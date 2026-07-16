import { contextBridge, ipcRenderer } from 'electron'

type OpenPopupPayload = {
  text: string | null
  source: 'selection' | 'manual'
}

type TranslationResult =
  | { ok: true; text: string; direction: 'zh-to-en' | 'en-to-zh' }
  | { ok: false; message: string }

type ModelStatus = {
  exists: boolean
  filename: string
  path: string
  size: number
  expectedSize: number | null
  backend: 'cuda' | 'vulkan' | 'cpu'
  runtimeState: 'idle' | 'loading' | 'ready' | 'error'
  state: 'missing' | 'ready' | 'downloading' | 'verifying' | 'error'
  message?: string
}

type DownloadProgress = {
  received: number
  total: number
  percent: number
}

function subscribe<T>(channel: string, callback: (value: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, value: T): void => callback(value)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  debugLog: (scope: string, event: string, details: Record<string, unknown>): void =>
    ipcRenderer.send('debug:log', { scope, event, details }),
  onOpenPopup: (callback: (payload: OpenPopupPayload) => void) => subscribe('popup:open', callback),
  translate: (text: string, sessionId?: number): Promise<TranslationResult> =>
    ipcRenderer.invoke('translation:translate', text, sessionId),
  closePopup: (): void => ipcRenderer.send('popup:close'),
  resizePopup: (height: number): void => ipcRenderer.send('popup:resize', height),
  getModelStatus: (): Promise<ModelStatus> => ipcRenderer.invoke('model:status'),
  downloadModel: (): Promise<{ ok: true; status: ModelStatus } | { ok: false; message: string }> =>
    ipcRenderer.invoke('model:download'),
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) =>
    subscribe('model:download-progress', callback),
  onDownloadState: (callback: (state: 'verifying') => void) => subscribe('model:download-state', callback),
  onModelReady: (callback: () => void) => subscribe('model:ready', callback),
  onSetupError: (callback: (message: string) => void) => subscribe('setup:error', callback),
  closeSetup: (): void => ipcRenderer.send('setup:close')
})
