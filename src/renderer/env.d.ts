declare module '*.css'

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

interface Window {
  api: {
    platform: string
    debugLog(scope: string, event: string, details: Record<string, unknown>): void
    onOpenPopup(callback: (payload: OpenPopupPayload) => void): () => void
    translate(text: string, sessionId?: number): Promise<TranslationResult>
    closePopup(): void
    resizePopup(height: number): void
    getModelStatus(): Promise<ModelStatus>
    downloadModel(): Promise<{ ok: true; status: ModelStatus } | { ok: false; message: string }>
    onDownloadProgress(callback: (progress: DownloadProgress) => void): () => void
    onDownloadState(callback: (state: 'verifying') => void): () => void
    onModelReady(callback: () => void): () => void
    onSetupError(callback: (message: string) => void): () => void
    closeSetup(): void
  }
}
