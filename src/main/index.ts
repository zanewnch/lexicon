import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  screen,
  shell,
  Tray
} from 'electron'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { captureSelectedText } from './selection'
import {
  downloadModel,
  CURATED_MODELS,
  getModelPathForFilename,
  getModelPath,
  getModelStatus,
  listHuggingFaceGgufFiles,
  listInstalledModels,
  modelExists,
  searchHuggingFaceModels
} from './model'
import { TranslationEngine } from './llm'
import { TranslationJobScheduler } from './translationJobScheduler'
import { evaluateBenchmark, type ModelBenchmark } from './modelBenchmark'
import { IeltsWorkspaceStore, type IeltsWorkspace, type StudyDirection } from './ieltsWorkspaceStore'
import { LearningStore } from './learningStore'
import type { LearningExtraction, ReviewExerciseType } from '../shared/learning'
import { detectTranslationDirection } from '../shared/translationDirection'
import { isEnglishLookupQuery, type TranslationRequestMode } from '../shared/lookup'
import { startYouTubeBridge } from './youtubeBridge'
import { registerMacYouTubeNativeHost } from './youtubeNativeHost'
import { type YouTubeTranscript } from '../shared/youtube'
import { isSafeArticleUrl, searchNews } from './news'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Command+Shift+Q is reserved by macOS for log out, so use a conflict-free
// default there while retaining the established Windows shortcut.
const DEFAULT_HOTKEY = process.platform === 'darwin'
  ? 'CommandOrControl+Shift+L'
  : 'CommandOrControl+Shift+Q'
const POPUP_WIDTH = 420
const POPUP_DEFAULT_HEIGHT = 304
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
const translationJobs = new TranslationJobScheduler()
let ieltsWorkspaceStore: IeltsWorkspaceStore | undefined
let learningStore: LearningStore | undefined
let tray: Tray | undefined
let hotkeyRegistered = false
let registeredHotkey = DEFAULT_HOTKEY
let popupAnchorPoint: Electron.Point | undefined
let popupOpenRequestId = 0
let nextTranslationRequestId = 0
let popupFocusCheck: NodeJS.Timeout | undefined
let shouldQuitAfterBackup = false
const activeTranslationRequestIds = new Set<number>()
let modelBenchmarkInProgress = false
const MODEL_BENCHMARKS_SETTING = 'model-benchmarks'
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
    startYouTubeBridge({
      translator,
      translationJobs,
      onCaptionPopup: (caption) => void openPopup({ text: caption.text, source: 'selection' }, screen.getCursorScreenPoint()),
      onTranscript: showYouTubeTranscript,
      onTranscriptSegment: (videoId, segmentId, translation) => sendYouTubeEvent('youtube:transcript-segment', { videoId, segmentId, translation }),
      onTranscriptProgress: (videoId, completed, total) => sendYouTubeEvent('youtube:transcript-progress', { videoId, completed, total })
    })
    void registerMacYouTubeNativeHost().catch((error) => {
      debugError('youtube', 'macOS native host registration failed', error)
    })
    void initializeModel()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        if (hotkeyRegistered) showMainWindow()
        else showSetupWindow()
      }
    })
  })

  app.on('before-quit', (event) => {
    if (shouldQuitAfterBackup || !shouldBackupOnQuit()) return
    event.preventDefault()
    void backupBeforeQuit()
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    void translator.dispose()
    ieltsWorkspaceStore?.close()
    learningStore?.close()
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
    // Keep the popup above the source window while it is active. The interval is
    // a Windows fallback: a floating frameless window does not always emit blur.
    window.setAlwaysOnTop(true, 'floating')
    window.on('blur', () => hidePopupWindow(window))
    window.on('hide', stopPopupFocusCheck)
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

function showYouTubeTranscript(transcript: YouTubeTranscript): void {
  const mainWindow = createWindow('app')
  const sendTranscript = (): void => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send('youtube:transcript-open', transcript)
    mainWindow.show()
    mainWindow.focus()
  }
  if (mainWindow.webContents.isLoading()) mainWindow.webContents.once('did-finish-load', sendTranscript)
  else sendTranscript()
}

function sendYouTubeEvent(channel: string, payload: unknown): void {
  const mainWindow = windows.get('app')
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

async function initializeModel(): Promise<void> {
  const appDataPath = app.getPath('appData')
  const selectedFilename = getIeltsWorkspaceStore().getSetting('model')
  const selectedPath = selectedFilename ? getModelPathForFilename(appDataPath, selectedFilename) : getModelPath(appDataPath)
  const installed = await listInstalledModels(appDataPath)
  if ((selectedFilename && !installed.some((model) => model.path === selectedPath)) || (!selectedFilename && !(await modelExists(appDataPath)))) {
    showSetupWindow()
    return
  }

  registerHotkey()
  try {
    await translator.load(selectedPath)
    sendModelReady()
    showMainWindow()
  } catch (error) {
    debugError('model', 'load failed', error)
    showSetupWindow(formatError(error, '模型載入失敗'))
  }
}

function registerHotkey(): void {
  if (hotkeyRegistered) return

  const configuredHotkey = getIeltsWorkspaceStore().getSetting('shortcut') ?? DEFAULT_HOTKEY
  hotkeyRegistered = tryRegisterHotkey(configuredHotkey)

  if (!hotkeyRegistered) {
    new Notification({
      title: 'Lexicon 快捷鍵無法使用',
      body: `${formatHotkey(configuredHotkey)} 已被其他程式使用，請關閉衝突程式後重新啟動 Lexicon。`
    }).show()
  }
}

async function handleHotkey(): Promise<void> {
  const popup = windows.get('popup')
  if (popup?.isVisible()) {
    popup.hide()
    return
  }

  const point = screen.getCursorScreenPoint()
  const requestId = ++popupOpenRequestId
  const text = await captureSelectedText()

  const currentPopup = windows.get('popup')
  if (requestId !== popupOpenRequestId) return
  if (currentPopup?.isVisible()) return
  await openPopup({ text, source: text ? 'selection' : 'manual' }, point)
}

async function openPopup(payload: OpenPopupPayload, point: Electron.Point): Promise<void> {
  const popupWindow = createWindow('popup')
  popupAnchorPoint = point
  positionPopup(popupWindow, point, POPUP_DEFAULT_HEIGHT)
  popupWindow.setAlwaysOnTop(true, 'floating')

  const sendPayload = (): void => {
    if (popupWindow.isDestroyed()) return
    popupWindow.webContents.send('popup:open', payload)
    popupWindow.show()
    popupWindow.focus()
    startPopupFocusCheck(popupWindow)
  }

  if (popupWindow.webContents.isLoading()) {
    popupWindow.webContents.once('did-finish-load', sendPayload)
  } else {
    sendPayload()
  }
}

function hidePopupWindow(popup: BrowserWindow): void {
  if (!popup.isDestroyed() && popup.isVisible()) popup.hide()
}

function startPopupFocusCheck(popup: BrowserWindow): void {
  stopPopupFocusCheck()
  popupFocusCheck = setInterval(() => {
    if (popup.isDestroyed() || !popup.isVisible()) return
    if (!popup.isFocused()) hidePopupWindow(popup)
  }, 100)
}

function stopPopupFocusCheck(): void {
  if (!popupFocusCheck) return
  clearInterval(popupFocusCheck)
  popupFocusCheck = undefined
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

  ipcMain.handle('ielts-workspace:load', (_event, initialWorkspace: unknown) => {
    const workspace = parseIeltsWorkspace(initialWorkspace)
    return getIeltsWorkspaceStore().load(workspace)
  })

  ipcMain.handle('ielts-workspace:save-notes', (_event, notes: unknown) => {
    if (typeof notes !== 'string') throw new Error('筆記格式不正確')
    getIeltsWorkspaceStore().saveNotes(notes)
  })

  ipcMain.handle('ielts-workspace:save-directions', (_event, directions: unknown) => {
    const workspace = parseIeltsWorkspace({ notes: '', directions })
    getIeltsWorkspaceStore().saveDirections(workspace.directions)
  })

  ipcMain.handle('settings:get', (_event, key: unknown) => {
    if (!isSettingKey(key)) throw new Error('設定項目不正確')
    return getIeltsWorkspaceStore().getSetting(key)
  })

  ipcMain.handle('settings:set', (_event, key: unknown, value: unknown) => {
    if (!isSettingKey(key) || !isSettingValue(key, value)) throw new Error('設定值不正確')
    getIeltsWorkspaceStore().setSetting(key, value)
  })

  ipcMain.handle('settings:choose-backup-directory', async (event) => {
    const options: Electron.OpenDialogOptions = {
      title: '選擇備份資料夾',
      properties: ['openDirectory', 'createDirectory']
    }
    const parentWindow = BrowserWindow.fromWebContents(event.sender)
    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, options)
      : await dialog.showOpenDialog(options)
    return result.canceled ? undefined : result.filePaths[0]
  })

  ipcMain.handle('settings:set-shortcut', (_event, shortcut: unknown) => {
    if (typeof shortcut !== 'string' || !shortcut) return { ok: false, message: '快捷鍵格式不正確' }
    return setHotkey(shortcut)
  })

  ipcMain.handle('translation:translate', async (_event, text: unknown, sessionId: unknown, mode: unknown) => {
    if (modelBenchmarkInProgress) return { ok: false, message: '模型效能測試進行中，完成後再試一次。' }
    const requestId = ++nextTranslationRequestId
    const startedAt = Date.now()
    const popupSessionId = typeof sessionId === 'number' ? sessionId : undefined
    activeTranslationRequestIds.add(requestId)
    if (typeof text !== 'string') {
      activeTranslationRequestIds.delete(requestId)
      return { ok: false, message: '翻譯內容格式不正確' }
    }

    try {
      const requestMode: TranslationRequestMode = mode === 'lookup' ? 'lookup' : 'translation'
      if (requestMode === 'lookup' && !isEnglishLookupQuery(text)) {
        return { ok: false, message: '查詞模式只支援英文單字或短語' }
      }
      if (requestMode === 'lookup') {
        const lookup = await translationJobs.submit({ id: `ipc-${requestId}`, text, direction: 'en-to-zh', priority: 'interactive' }, () => translator.lookup(text, `ipc-${requestId}`))
        return { ok: true, kind: 'lookup' as const, lookup }
      }
      const direction = detectTranslationDirection(text)
      const translated = await translationJobs.submit({ id: `ipc-${requestId}`, text, direction, priority: 'interactive' }, () => translator.translate(text, direction, `ipc-${requestId}`))
      const translationRecordId = getLearningStore().recordTranslation(text, translated, direction)
      return { ok: true, kind: 'translation' as const, text: translated, direction, translationRecordId }
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

  ipcMain.handle('model:status', async () => {
    const selectedFilename = getIeltsWorkspaceStore().getSetting('model')
    const selected = (await listInstalledModels(app.getPath('appData'))).find((model) => model.filename === selectedFilename)
    const status = selected
      ? { exists: true, filename: selected.filename, path: selected.path, size: selected.size, expectedSize: selected.size, state: 'ready' as const }
      : await getModelStatus(app.getPath('appData'))
    return {
      ...status,
      backend: translator.backend,
      runtimeState: translator.state,
      message: translator.errorMessage ?? status.message
    }
  })

  ipcMain.handle('ielts-writing:generate', async (_event, request: unknown) => {
    if (!request || typeof request !== 'object') throw new Error('寫作請求格式不正確')
    const { mode, taskType, prompt, draft } = request as Record<string, unknown>
    if ((mode !== 'outline' && mode !== 'feedback' && mode !== 'sample') || (taskType !== 'task-1' && taskType !== 'task-2')) {
      throw new Error('寫作模式格式不正確')
    }
    if (typeof prompt !== 'string' || typeof draft !== 'string') throw new Error('寫作內容格式不正確')
    if (!prompt.trim()) throw new Error('請先輸入 IELTS 寫作題目')
    if (prompt.length > 6000 || draft.length > 12000) throw new Error('寫作內容過長，請縮短後再試')
    if (mode === 'feedback' && !draft.trim()) throw new Error('請先貼上你的英文草稿')
    return translator.generateIeltsWriting(mode, taskType, prompt, draft)
  })

  ipcMain.handle('model:list', () => listInstalledModels(app.getPath('appData')))

  ipcMain.handle('model:benchmarks', async () => {
    const models = await listInstalledModels(app.getPath('appData'))
    const saved = getStoredModelBenchmarks()
    return Object.fromEntries(models.flatMap((model) => {
      const benchmark = saved[model.filename]
      return benchmark ? [[model.filename, benchmark]] : []
    }))
  })

  ipcMain.handle('model:benchmark', async (_event, filename: unknown): Promise<ModelBenchmark> => {
    if (typeof filename !== 'string' || filename !== basename(filename) || !filename.toLowerCase().endsWith('.gguf')) {
      throw new Error('模型檔案格式不正確')
    }
    if (modelBenchmarkInProgress) throw new Error('已有模型效能測試正在進行')

    const models = await listInstalledModels(app.getPath('appData'))
    const model = models.find((candidate) => candidate.filename === filename)
    if (!model) throw new Error('找不到指定的模型檔案')

    modelBenchmarkInProgress = true
    const selectedFilename = getIeltsWorkspaceStore().getSetting('model')
    const selected = models.find((candidate) => candidate.filename === selectedFilename)
    const switched = selected?.filename !== model.filename
    let benchmark: ModelBenchmark

    try {
      benchmark = await translationJobs.submit(
        { id: `model-benchmark-${Date.now()}`, text: '', direction: 'en-to-zh', priority: 'interactive' },
        async () => {
          if (switched) await translator.load(model.path)
          const warmMeasurements = await translator.benchmarkTranslation()
          const evaluation = evaluateBenchmark(warmMeasurements)
          return {
            status: 'success' as const,
            filename: model.filename,
            size: model.size,
            modifiedAt: model.modifiedAt,
            completedAt: new Date().toISOString(),
            backend: translator.backend,
            firstTokenMs: Math.round(warmMeasurements.firstTokenMs),
            tokensPerSecond: Math.round(warmMeasurements.tokensPerSecond * 10) / 10,
            ...evaluation
          }
        }
      )
    } catch (error) {
      benchmark = {
        status: 'failed', filename: model.filename, size: model.size, modifiedAt: model.modifiedAt,
        completedAt: new Date().toISOString(), message: formatError(error, '模型效能測試失敗')
      }
    } finally {
      if (switched && selected) {
        try { await translator.load(selected.path); sendModelReady() }
        catch (error) { debugError('model benchmark', 'failed to restore selected model', error, { filename: selected.filename }) }
      }
      modelBenchmarkInProgress = false
    }

    saveModelBenchmark(benchmark)
    return benchmark
  })

  ipcMain.handle('model:search-huggingface', async (_event, query: unknown) => {
    if (typeof query !== 'string' || query.trim().length < 2 || query.length > 100) throw new Error('請輸入 2 到 100 個字元的模型名稱')
    return searchHuggingFaceModels(query)
  })

  ipcMain.handle('model:list-huggingface-files', async (_event, repository: unknown) => {
    if (typeof repository !== 'string') throw new Error('模型名稱格式不正確')
    return listHuggingFaceGgufFiles(repository)
  })

  ipcMain.handle('model:select', async (_event, filename: unknown) => {
    if (modelBenchmarkInProgress) return { ok: false, message: '模型效能測試進行中，完成後再切換模型。' }
    if (typeof filename !== 'string' || filename !== basename(filename) || !filename.toLowerCase().endsWith('.gguf')) return { ok: false, message: '模型檔案格式不正確' }
    const models = await listInstalledModels(app.getPath('appData'))
    const selected = models.find((model) => model.filename === filename)
    if (!selected) return { ok: false, message: '找不到指定的模型檔案' }
    const previous = models.find((model) => model.filename === getIeltsWorkspaceStore().getSetting('model'))
    try {
      await translator.load(selected.path)
      getIeltsWorkspaceStore().setSetting('model', selected.filename)
      sendModelReady()
      return { ok: true }
    } catch (error) {
      if (previous) await translator.load(previous.path).catch(() => undefined)
      return { ok: false, message: formatError(error, '模型重新載入失敗') }
    }
  })

  ipcMain.handle('model:open-download-window', () => {
    const window = createWindow('download-model')
    window.show()
    window.focus()
  })

  ipcMain.handle('model:download', async (event, request: unknown) => {
    if (modelBenchmarkInProgress) return { ok: false, message: '模型效能測試進行中，完成後再下載模型。' }
    try {
      if (!isModelDownloadRequest(request)) throw new Error('模型下載來源格式不正確')
      const result = await downloadModel(app.getPath('appData'), request, event.sender)
      await translator.load(result.path)
      getIeltsWorkspaceStore().setSetting('model', result.filename)
      registerHotkey()
      sendModelReady()
      return { ok: true, status: result }
    } catch (error) {
      const message = formatError(error, '模型下載失敗')
      return { ok: false, message }
    }
  })

  ipcMain.on('popup:close', () => {
    const popup = windows.get('popup')
    if (popup) hidePopupWindow(popup)
  })

  ipcMain.on('popup:resize', (_event, requestedHeight: unknown) => {
    const popup = windows.get('popup')
    if (!popup || popup.isDestroyed() || !popupAnchorPoint) return

    const height = Number(requestedHeight)
    if (!Number.isFinite(height)) return

    const clampedHeight = Math.round(
      Math.min(POPUP_MAX_HEIGHT, Math.max(POPUP_DEFAULT_HEIGHT, height))
    )
    positionPopup(popup, popupAnchorPoint, clampedHeight)
  })

  ipcMain.on('setup:close', () => {
    const setup = windows.get('setup')
    if (setup && !setup.isDestroyed()) setup.hide()
  })
}

function getIeltsWorkspaceStore(): IeltsWorkspaceStore {
  ieltsWorkspaceStore ??= new IeltsWorkspaceStore(app.getPath('userData'))
  return ieltsWorkspaceStore
}

function getLearningStore(): LearningStore {
  learningStore ??= new LearningStore(app.getPath('userData'))
  return learningStore
}

function getStoredModelBenchmarks(): Record<string, ModelBenchmark> {
  const raw = getIeltsWorkspaceStore().getSetting(MODEL_BENCHMARKS_SETTING)
  if (!raw) return {}
  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([, benchmark]) => isStoredModelBenchmark(benchmark))) as Record<string, ModelBenchmark>
  } catch { return {} }
}

function saveModelBenchmark(benchmark: ModelBenchmark): void {
  const benchmarks = getStoredModelBenchmarks()
  benchmarks[benchmark.filename] = benchmark
  getIeltsWorkspaceStore().setSetting(MODEL_BENCHMARKS_SETTING, JSON.stringify(benchmarks))
}

function isStoredModelBenchmark(value: unknown): value is ModelBenchmark {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const common = typeof item.filename === 'string' && typeof item.size === 'number' && typeof item.modifiedAt === 'number' && typeof item.completedAt === 'string'
  if (!common) return false
  if (item.status === 'failed') return typeof item.message === 'string'
  return item.status === 'success'
    && ['metal', 'cuda', 'vulkan', 'cpu'].includes(item.backend as string)
    && typeof item.firstTokenMs === 'number'
    && typeof item.tokensPerSecond === 'number'
    && ['smooth', 'usable', 'strained', 'not-recommended'].includes(item.rating as string)
    && typeof item.recommendation === 'string'
}

type SettingKey = 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model'

function isSettingKey(value: unknown): value is SettingKey {
  return value === 'theme' || value === 'backup-on-quit' || value === 'backup-directory' || value === 'shortcut' || value === 'model'
}

function isSettingValue(key: SettingKey, value: unknown): value is string {
  if (key === 'theme') return ['dark', 'light', 'system'].includes(value as string)
  if (key === 'backup-on-quit') return value === 'true' || value === 'false'
  return typeof value === 'string'
}

function isModelDownloadRequest(value: unknown): value is { kind: 'curated'; id: string } | { kind: 'huggingface'; repository: string; filename: string } | { kind: 'custom'; url: string } {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { kind?: unknown; id?: unknown; repository?: unknown; filename?: unknown; url?: unknown }
  return (candidate.kind === 'curated' && typeof candidate.id === 'string' && CURATED_MODELS.some((model) => model.id === candidate.id))
    || (candidate.kind === 'huggingface' && typeof candidate.repository === 'string' && typeof candidate.filename === 'string')
    || (candidate.kind === 'custom' && typeof candidate.url === 'string' && candidate.url.length <= 2_000)
}

function shouldBackupOnQuit(): boolean {
  const store = getIeltsWorkspaceStore()
  return store.getSetting('backup-on-quit') === 'true' && Boolean(store.getSetting('backup-directory'))
}

function setHotkey(shortcut: string): { ok: true } | { ok: false; message: string } {
  const previousHotkey = registeredHotkey
  if (hotkeyRegistered) globalShortcut.unregister(previousHotkey)
  hotkeyRegistered = false

  if (tryRegisterHotkey(shortcut)) {
    getIeltsWorkspaceStore().setSetting('shortcut', shortcut)
    return { ok: true }
  }

  hotkeyRegistered = tryRegisterHotkey(previousHotkey)
  return { ok: false, message: '此快捷鍵無法使用，可能已被系統或其他程式佔用。' }
}

function tryRegisterHotkey(shortcut: string): boolean {
  try {
    const registered = globalShortcut.register(shortcut, () => {
      void handleHotkey()
    })
    if (registered) registeredHotkey = shortcut
    return registered
  } catch {
    return false
  }
}

function formatHotkey(shortcut: string): string {
  return shortcut
    .replace('CommandOrControl', process.platform === 'darwin' ? '⌘' : 'Ctrl')
    .replace('Control', 'Ctrl')
    .replaceAll('+', ' + ')
}

async function backupBeforeQuit(): Promise<void> {
  try {
    const store = getIeltsWorkspaceStore()
    const directory = store.getSetting('backup-directory')
    if (directory) await store.backupTo(directory)
  } catch (error) {
    console.error('Lexicon backup failed before quit', error)
  } finally {
    shouldQuitAfterBackup = true
    app.quit()
  }
}

function parseIeltsWorkspace(value: unknown): IeltsWorkspace {
  if (!value || typeof value !== 'object') throw new Error('IELTS 工作區資料格式不正確')
  const candidate = value as Record<string, unknown>
  if (typeof candidate.notes !== 'string' || !Array.isArray(candidate.directions)) {
    throw new Error('IELTS 工作區資料格式不正確')
  }

  const directions = candidate.directions.map((direction): StudyDirection => {
    if (!direction || typeof direction !== 'object') throw new Error('學習方向格式不正確')
    const item = direction as Record<string, unknown>
    if (
      typeof item.id !== 'number'
      || !Number.isSafeInteger(item.id)
      || typeof item.title !== 'string'
      || typeof item.focus !== 'string'
      || !['planning', 'active', 'done'].includes(item.status as string)
    ) {
      throw new Error('學習方向格式不正確')
    }
    return { id: item.id, title: item.title, focus: item.focus, status: item.status as StudyDirection['status'] }
  })

  ipcMain.handle('news:search', async (_event, query: unknown) => {
    if (typeof query !== 'string' || query.length > 200) throw new Error('新聞關鍵字格式不正確')
    return searchNews(query)
  })

  ipcMain.handle('news:summarize', async (_event, article: unknown) => {
    if (!article || typeof article !== 'object') throw new Error('新聞內容格式不正確')
    const candidate = article as { title?: unknown; description?: unknown }
    if (typeof candidate.title !== 'string' || typeof candidate.description !== 'string') throw new Error('新聞內容格式不正確')
    return translator.summarizeNews(candidate.title.slice(0, 500), candidate.description.slice(0, 3_000))
  })

  ipcMain.handle('news:open', async (_event, url: unknown) => {
    if (typeof url !== 'string' || !isSafeArticleUrl(url)) throw new Error('新聞連結格式不正確')
    await shell.openExternal(url)
  })

  ipcMain.handle('learning:dashboard', () => getLearningStore().getDashboard())
  ipcMain.handle('history:list', () => getLearningStore().listTranslationHistory())
  ipcMain.handle('learning:create-from-record', async (_event, recordId: unknown) => {
    if (!Number.isSafeInteger(recordId) || (recordId as number) < 1) throw new Error('翻譯紀錄格式不正確')
    const store = getLearningStore()
    const record = store.getTranslationRecord(recordId as number)
    const extraction = await translationJobs.submit(
      { id: `learning-extract-${record.id}`, text: record.sourceText, direction: record.direction, priority: 'background' },
      () => translator.extractLearningItem(record.sourceText, record.translatedText, record.direction, `learning-extract-${record.id}`)
    )
    return store.createItem(record.id, extraction)
  })
  ipcMain.handle('learning:create-from-source', async (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object') throw new Error('學習來源格式不正確')
    const source = payload as { sourceText?: unknown; translatedText?: unknown; direction?: unknown; sourceSurface?: unknown }
    if (typeof source.sourceText !== 'string' || !source.sourceText.trim() || typeof source.translatedText !== 'string' || !source.translatedText.trim() || !['zh-to-en', 'en-to-zh'].includes(source.direction as string)) throw new Error('學習來源格式不正確')
    const store = getLearningStore()
    const sourceText = source.sourceText
    const translatedText = source.translatedText
    const direction = source.direction as 'zh-to-en' | 'en-to-zh'
    const recordId = store.recordTranslation(sourceText, translatedText, direction, typeof source.sourceSurface === 'string' ? source.sourceSurface : 'learning')
    const extraction = await translationJobs.submit(
      { id: `learning-source-${recordId}`, text: sourceText, direction, priority: 'background' },
      () => translator.extractLearningItem(sourceText, translatedText, direction, `learning-source-${recordId}`)
    )
    return store.createItem(recordId, extraction)
  })
  ipcMain.handle('learning:review', async (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object') throw new Error('複習資料格式不正確')
    const review = payload as { itemId?: unknown; exerciseType?: unknown; answer?: unknown; operationId?: unknown }
    if (!Number.isSafeInteger(review.itemId) || !['reverse_translation', 'cloze', 'rewrite'].includes(review.exerciseType as string) || typeof review.answer !== 'string' || (review.operationId !== undefined && (typeof review.operationId !== 'string' || review.operationId.length > 100))) throw new Error('複習資料格式不正確')
    const store = getLearningStore()
    const item = store.getItem(review.itemId as number)
    const extraction: LearningExtraction = { promptZh: item.promptZh, targetEn: item.targetEn, focusExpression: item.focusExpression, explanationZh: item.explanationZh, alternatives: item.alternatives, tags: item.tags }
    const exerciseType = review.exerciseType as ReviewExerciseType
    const answer = review.answer
    const feedback = await translationJobs.submit(
      { id: `learning-review-${item.id}`, text: answer, direction: 'zh-to-en', priority: 'interactive' },
      () => translator.evaluateLearningAnswer(extraction, exerciseType, answer, `learning-review-${item.id}`)
    )
    return store.review(item.id, exerciseType, answer, feedback, review.operationId as string | undefined)
  })
  ipcMain.handle('learning:task', async (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object') throw new Error('任務資料格式不正確')
    const task = payload as { itemIds?: unknown; answer?: unknown; operationId?: unknown }
    if (!Array.isArray(task.itemIds) || task.itemIds.length < 2 || task.itemIds.length > 3 || !task.itemIds.every((id) => Number.isSafeInteger(id)) || typeof task.answer !== 'string' || !task.answer.trim() || (task.operationId !== undefined && (typeof task.operationId !== 'string' || task.operationId.length > 100))) throw new Error('任務資料格式不正確')
    const store = getLearningStore()
    const items = task.itemIds.map((id) => store.getItem(id as number))
    const extractions = items.map((item) => ({ promptZh: item.promptZh, targetEn: item.targetEn, focusExpression: item.focusExpression, explanationZh: item.explanationZh, alternatives: item.alternatives, tags: item.tags }))
    const answer = task.answer
    const feedback = await translationJobs.submit({ id: `learning-task-${Date.now()}`, text: answer, direction: 'zh-to-en', priority: 'interactive' }, () => translator.evaluateLearningTask(extractions, answer))
    return store.reviewTask(task.itemIds as number[], answer, feedback, task.operationId as string | undefined)
  })
  ipcMain.handle('learning:update-preferences', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object') throw new Error('學習設定格式不正確')
    const preferences = payload as { streakEnabled?: unknown; reducedMotion?: unknown }
    if ((preferences.streakEnabled !== undefined && typeof preferences.streakEnabled !== 'boolean') || (preferences.reducedMotion !== undefined && typeof preferences.reducedMotion !== 'boolean')) throw new Error('學習設定格式不正確')
    return getLearningStore().updatePreferences({ streakEnabled: preferences.streakEnabled as boolean | undefined, reducedMotion: preferences.reducedMotion as boolean | undefined })
  })
  ipcMain.handle('learning:delete-item', (_event, itemId: unknown) => {
    if (!Number.isSafeInteger(itemId) || (itemId as number) < 1) throw new Error('學習項目格式不正確')
    getLearningStore().deleteItem(itemId as number)
  })
  ipcMain.handle('learning:clear-data', () => getLearningStore().clearLearningData())

  return { notes: candidate.notes, directions }
}

function sendModelReady(): void {
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
