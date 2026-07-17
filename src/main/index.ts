import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  screen,
  Tray
} from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { captureSelectedText } from './selection'
import {
  downloadModel,
  getModelPath,
  getModelStatus,
  modelExists
} from './model'
import { TranslationEngine } from './llm'
import { detectTranslationDirection } from '../shared/translationDirection'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HOTKEY = 'Ctrl+Shift+Q'
const POPUP_WIDTH = 420
const POPUP_DEFAULT_HEIGHT = 360
const POPUP_MAX_HEIGHT = 720
const APP_WIDTH = 1000
const APP_HEIGHT = 680
const APP_MIN_WIDTH = 760
const APP_MIN_HEIGHT = 480
const isDevelopment = Boolean(process.env.ELECTRON_RENDERER_URL)

if (isDevelopment) {
  process.stdout.on('error', ignoreBrokenPipe)
  process.stderr.on('error', ignoreBrokenPipe)
}

type PageName = 'app' | 'popup' | 'settings' | 'setup' | 'download-model'
type OpenPopupPayload = { text: string | null; source: 'selection' | 'manual' }

const windows = new Map<PageName, BrowserWindow>()
const translator = new TranslationEngine()
let tray: Tray | undefined
let hotkeyRegistered = false
let popupAnchorPoint: Electron.Point | undefined
let nextTranslationRequestId = 0
const activeTranslationRequestIds = new Set<number>()

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const setup = windows.get('setup')
    if (setup && !setup.isDestroyed()) {
      setup.show()
      setup.focus()
      return
    }

    if (hotkeyRegistered) showMainWindow()
    else showSetupWindow()
  })

  app.whenReady().then(() => {
    createTray()
    createWindow('popup')
    registerIpc()
    void initializeModel()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        if (hotkeyRegistered) showMainWindow()
        else showSetupWindow()
      }
    })
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    void translator.dispose()
    tray?.destroy()
  })

}

function loadPage(window: BrowserWindow, page: PageName): void {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  if (rendererUrl) {
    void window.loadURL(`${rendererUrl}/${page}/index.html`)
    return
  }

  void window.loadFile(join(__dirname, '../renderer', page, 'index.html'))
}

function createWindow(page: PageName): BrowserWindow {
  const existingWindow = windows.get(page)
  if (existingWindow && !existingWindow.isDestroyed()) return existingWindow

  const isApp = page === 'app'
  const isPopup = page === 'popup'
  const window = new BrowserWindow({
    width: isPopup ? POPUP_WIDTH : isApp ? APP_WIDTH : page === 'setup' ? 640 : 720,
    height: isPopup ? POPUP_DEFAULT_HEIGHT : isApp ? APP_HEIGHT : page === 'setup' ? 460 : 520,
    minWidth: isApp ? APP_MIN_WIDTH : undefined,
    minHeight: isApp ? APP_MIN_HEIGHT : undefined,
    show: false,
    frame: !isPopup,
    resizable: !isPopup,
    movable: true,
    skipTaskbar: isPopup,
    alwaysOnTop: isPopup,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '../preload/index.cjs')
    }
  })

  window.once('ready-to-show', () => {
    if (page === 'setup') window.show()
  })

  if (isPopup) {
    // Keep the popup above the source window while it is active. Moving focus to
    // another app (or the desktop) should put it away; Ctrl+Shift+Q can show it again.
    window.setAlwaysOnTop(true, 'floating')
    window.on('focus', () => debugLog('popup', 'focus received'))
    window.on('blur', () => {
      if (!window.isDestroyed() && window.isVisible()) {
        debugLog('popup', 'blur hid popup')
        window.hide()
      }
    })
  }

  if (isDevelopment) {
    window.webContents.on('console-message', (details) => {
      if (details.level !== 'error') return
      debugLog('renderer', 'console error', {
        page,
        lineNumber: details.lineNumber,
        sourceId: details.sourceId,
        message: details.message
      })
    })
    window.webContents.on('render-process-gone', (_event, details) => {
      debugLog('renderer', 'process gone', { page, reason: details.reason, exitCode: details.exitCode })
    })
    window.on('unresponsive', () => debugLog('renderer', 'window unresponsive', { page }))
    window.on('responsive', () => debugLog('renderer', 'window responsive again', { page }))
  }

  window.on('closed', () => windows.delete(page))
  loadPage(window, page)
  windows.set(page, window)
  return window
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  )
  tray = new Tray(icon)
  tray.setToolTip('Lexicon')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '開啟 Lexicon',
        click: () => {
          if (hotkeyRegistered) {
            showMainWindow()
          } else {
            showSetupWindow()
          }
        }
      },
      {
        label: '下載 / 重新載入模型',
        click: () => showSetupWindow()
      },
      { type: 'separator' },
      { label: '結束 Lexicon', click: () => app.quit() }
    ])
  )
}

function showMainWindow(): void {
  const mainWindow = createWindow('app')
  mainWindow.show()
  mainWindow.focus()
}

async function initializeModel(): Promise<void> {
  const appDataPath = app.getPath('appData')
  if (!(await modelExists(appDataPath))) {
    debugLog('model', 'model file missing; opening setup')
    showSetupWindow()
    return
  }

  registerHotkey()
  debugLog('model', 'load requested')

  try {
    await translator.load(getModelPath(appDataPath))
    debugLog('model', 'load completed', { backend: translator.backend })
    sendModelReady()
  } catch (error) {
    debugError('model', 'load failed', error)
    showSetupWindow(formatError(error, '模型載入失敗'))
  }
}

function registerHotkey(): void {
  if (hotkeyRegistered) return

  hotkeyRegistered = globalShortcut.register(HOTKEY, () => {
    void handleHotkey()
  })

  if (!hotkeyRegistered) {
    new Notification({
      title: 'Lexicon 快捷鍵無法使用',
      body: `${HOTKEY} 已被其他程式使用，請關閉衝突程式後重新啟動 Lexicon。`
    }).show()
  }
}

async function handleHotkey(): Promise<void> {
  const popup = windows.get('popup')
  if (popup?.isVisible()) {
    debugLog('popup', 'hotkey hid visible popup')
    popup.hide()
    return
  }

  const point = screen.getCursorScreenPoint()
  const captureStartedAt = Date.now()
  const text = await captureSelectedText()
  debugLog('selection', 'capture completed', {
    elapsedMs: Date.now() - captureStartedAt,
    captured: text !== null,
    textLength: text?.length ?? 0
  })
  await openPopup({ text, source: text ? 'selection' : 'manual' }, point)
}

async function openPopup(payload: OpenPopupPayload, point: Electron.Point): Promise<void> {
  debugLog('popup', 'open requested', { source: payload.source, textLength: payload.text?.length ?? 0 })
  const popup = createWindow('popup')
  popupAnchorPoint = point
  positionPopup(popup, point, POPUP_DEFAULT_HEIGHT)
  popup.setAlwaysOnTop(true, 'floating')

  const sendPayload = (): void => {
    if (popup.isDestroyed()) return
    debugLog('popup', 'open payload sent', { source: payload.source, textLength: payload.text?.length ?? 0 })
    popup.webContents.send('popup:open', payload)
    popup.show()
    popup.focus()
  }

  if (popup.webContents.isLoading()) {
    popup.webContents.once('did-finish-load', sendPayload)
  } else {
    sendPayload()
  }
}

function positionPopup(popup: BrowserWindow, point: Electron.Point, height: number): void {
  const { workArea } = screen.getDisplayNearestPoint(point)
  const gap = 14

  const [currentWidth, currentHeight] = popup.getSize()
  if (currentWidth !== POPUP_WIDTH || currentHeight !== height) {
    popup.setSize(POPUP_WIDTH, height)
  }

  let x = point.x + gap
  let y = point.y + gap

  if (x + POPUP_WIDTH > workArea.x + workArea.width) x = point.x - POPUP_WIDTH - gap
  if (y + height > workArea.y + workArea.height) y = point.y - height - gap

  x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - POPUP_WIDTH))
  y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - height))
  popup.setPosition(x, y)
}

function showSetupWindow(message?: string): void {
  const setup = createWindow('setup')
  if (message) {
    const sendMessage = (): void => {
      if (!setup.isDestroyed()) setup.webContents.send('setup:error', message)
    }
    if (setup.webContents.isLoading()) setup.webContents.once('did-finish-load', sendMessage)
    else sendMessage()
  }
  setup.show()
  setup.focus()
}

function registerIpc(): void {
  ipcMain.on('debug:log', (_event, payload: unknown) => {
    if (!isDevelopment || !isDebugPayload(payload)) return
    console.log(`[Lexicon debug][renderer:${payload.scope}] ${payload.event}`, payload.details)
  })

  ipcMain.handle('translation:translate', async (_event, text: unknown, sessionId: unknown) => {
    const requestId = ++nextTranslationRequestId
    const startedAt = Date.now()
    const popupSessionId = typeof sessionId === 'number' ? sessionId : undefined
    activeTranslationRequestIds.add(requestId)
    debugLog('translation', 'IPC received', {
      requestId,
      popupSessionId,
      textLength: typeof text === 'string' ? text.length : undefined,
      runtimeState: translator.state
    })

    if (typeof text !== 'string') {
      activeTranslationRequestIds.delete(requestId)
      debugLog('translation', 'IPC rejected: invalid text', { requestId, popupSessionId })
      return { ok: false, message: '翻譯內容格式不正確' }
    }

    try {
      const direction = detectTranslationDirection(text)
      const translated = await translator.translate(text, direction, `ipc-${requestId}`)
      debugLog('translation', 'IPC completed', {
        requestId,
        popupSessionId,
        elapsedMs: Date.now() - startedAt,
        resultLength: translated.length,
        direction
      })
      return { ok: true, text: translated, direction }
    } catch (error) {
      debugError('translation', 'IPC failed', error, {
        requestId,
        popupSessionId,
        elapsedMs: Date.now() - startedAt
      })
      return { ok: false, message: formatError(error, '翻譯失敗') }
    } finally {
      activeTranslationRequestIds.delete(requestId)
    }
  })

  ipcMain.handle('model:status', async (event) => {
    const status = await getModelStatus(app.getPath('appData'))
    debugLog('model', 'status requested', {
      senderId: event.sender.id,
      exists: status.exists,
      runtimeState: translator.state,
      backend: translator.backend
    })
    return {
      ...status,
      backend: translator.backend,
      runtimeState: translator.state,
      message: translator.errorMessage ?? status.message
    }
  })

  ipcMain.handle('model:download', async (event) => {
    try {
      const result = await downloadModel(app.getPath('appData'), event.sender)
      await translator.load(result.path)
      registerHotkey()
      sendModelReady()
      return { ok: true, status: result }
    } catch (error) {
      const message = formatError(error, '模型下載失敗')
      return { ok: false, message }
    }
  })

  ipcMain.on('popup:close', () => {
    debugLog('popup', 'close IPC received', {
      runtimeState: translator.state,
      activeTranslationRequestIds: [...activeTranslationRequestIds]
    })
    const popup = windows.get('popup')
    if (popup && !popup.isDestroyed()) popup.hide()
  })

  ipcMain.on('popup:resize', (_event, requestedHeight: unknown) => {
    const popup = windows.get('popup')
    if (!popup || popup.isDestroyed() || !popupAnchorPoint) return

    const height = Number(requestedHeight)
    if (!Number.isFinite(height)) return

    const clampedHeight = Math.round(
      Math.min(POPUP_MAX_HEIGHT, Math.max(POPUP_DEFAULT_HEIGHT, height))
    )
    debugLog('popup', 'resize IPC received', { requestedHeight: height, clampedHeight })
    positionPopup(popup, popupAnchorPoint, clampedHeight)
  })

  ipcMain.on('setup:close', () => {
    const setup = windows.get('setup')
    if (setup && !setup.isDestroyed()) setup.hide()
  })
}

function sendModelReady(): void {
  debugLog('model', 'ready event sent', { windowCount: windows.size, backend: translator.backend })
  windows.forEach((window) => {
    if (!window.isDestroyed()) window.webContents.send('model:ready')
  })
}

function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function debugLog(scope: string, event: string, details: Record<string, unknown> = {}): void {
  if (!isDevelopment) return
  writeDebug('log', `[Lexicon debug][main][${scope}] ${event}`, details)
}

function debugError(
  scope: string,
  event: string,
  error: unknown,
  details: Record<string, unknown> = {}
): void {
  if (!isDevelopment) return
  const message = error instanceof Error ? error.message : String(error)
  writeDebug('error', `[Lexicon debug][main][${scope}] ${event}`, { ...details, message })
}

function writeDebug(method: 'log' | 'error', message: string, details: Record<string, unknown>): void {
  try {
    console[method](message, details)
  } catch (error) {
    ignoreBrokenPipe(error)
  }
}

function ignoreBrokenPipe(error: unknown): void {
  if ((error as NodeJS.ErrnoException | undefined)?.code === 'EPIPE') return
  throw error
}

function isDebugPayload(payload: unknown): payload is {
  scope: string
  event: string
  details: Record<string, unknown>
} {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  return typeof candidate.scope === 'string'
    && typeof candidate.event === 'string'
    && typeof candidate.details === 'object'
    && candidate.details !== null
}
