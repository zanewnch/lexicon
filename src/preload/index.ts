import { contextBridge, ipcRenderer } from 'electron'
import { type LookupResult, type TranslationRequestMode } from '../shared/lookup'
import type { GamificationDashboard, LearningDashboard, LearningItem, ReviewExerciseType, ReviewFeedback } from '../shared/learning'
import type { NewsArticle } from '../main/news'
import type { ModelBenchmark } from '../main/modelBenchmark'

type OpenPopupPayload = {
  text: string | null
  source: 'selection' | 'manual'
}

type TranslationResult =
  | { ok: true; kind: 'translation'; text: string; direction: 'zh-to-en' | 'en-to-zh'; translationRecordId: number }
  | { ok: true; kind: 'lookup'; lookup: LookupResult }
  | { ok: false; message: string }

type ModelStatus = {
  exists: boolean
  filename: string
  path: string
  size: number
  expectedSize: number | null
  backend: 'metal' | 'cuda' | 'vulkan' | 'cpu'
  runtimeState: 'idle' | 'loading' | 'ready' | 'error'
  state: 'missing' | 'ready' | 'downloading' | 'verifying' | 'error'
  message?: string
}

type DownloadProgress = {
  received: number
  total: number
  percent: number
}

type InstalledModel = { filename: string; path: string; size: number; modifiedAt: number }
type HuggingFaceModel = { id: string; downloads: number; likes: number; updatedAt?: string }
type HuggingFaceGgufFile = { filename: string; size: number; sha256?: string }
type ModelDownloadRequest = { kind: 'curated'; id: string } | { kind: 'huggingface'; repository: string; filename: string } | { kind: 'custom'; url: string }

type StudyDirection = {
  id: number
  title: string
  focus: string
  status: 'planning' | 'active' | 'done'
}

type IeltsWorkspace = { notes: string; directions: StudyDirection[] }
type TranslationHistoryRecord = {
  id: number
  sourceText: string
  translatedText: string
  direction: 'zh-to-en' | 'en-to-zh'
  sourceSurface: string
  createdAt: string
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
  translate: (text: string, sessionId?: number, mode?: TranslationRequestMode): Promise<TranslationResult> =>
    ipcRenderer.invoke('translation:translate', text, sessionId, mode),
  closePopup: (): void => ipcRenderer.send('popup:close'),
  resizePopup: (height: number): void => ipcRenderer.send('popup:resize', height),
  getModelStatus: (): Promise<ModelStatus> => ipcRenderer.invoke('model:status'),
  listModels: (): Promise<InstalledModel[]> => ipcRenderer.invoke('model:list'),
  getModelBenchmarks: (): Promise<Record<string, ModelBenchmark>> => ipcRenderer.invoke('model:benchmarks'),
  benchmarkModel: (filename: string): Promise<ModelBenchmark> => ipcRenderer.invoke('model:benchmark', filename),
  searchHuggingFaceModels: (query: string): Promise<HuggingFaceModel[]> => ipcRenderer.invoke('model:search-huggingface', query),
  listHuggingFaceGgufFiles: (repository: string): Promise<HuggingFaceGgufFile[]> => ipcRenderer.invoke('model:list-huggingface-files', repository),
  selectModel: (filename: string): Promise<{ ok: true } | { ok: false; message: string }> => ipcRenderer.invoke('model:select', filename),
  openModelDownload: (): Promise<void> => ipcRenderer.invoke('model:open-download-window'),
  downloadModel: (request: ModelDownloadRequest = { kind: 'curated', id: 'gemma-4-e2b' }): Promise<{ ok: true; status: ModelStatus } | { ok: false; message: string }> =>
    ipcRenderer.invoke('model:download', request),
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) =>
    subscribe('model:download-progress', callback),
  onDownloadState: (callback: (state: 'verifying') => void) => subscribe('model:download-state', callback),
  onModelReady: (callback: () => void) => subscribe('model:ready', callback),
  onYouTubeTranscriptOpen: (callback: (transcript: import('../shared/youtube').YouTubeTranscript) => void) => subscribe('youtube:transcript-open', callback),
  onYouTubeTranscriptSegment: (callback: (segment: { videoId: string; segmentId: string; translation: string }) => void) => subscribe('youtube:transcript-segment', callback),
  onYouTubeTranscriptProgress: (callback: (progress: { videoId: string; completed: number; total: number }) => void) => subscribe('youtube:transcript-progress', callback),
  onSetupError: (callback: (message: string) => void) => subscribe('setup:error', callback),
  closeSetup: (): void => ipcRenderer.send('setup:close'),
  loadIeltsWorkspace: (initialWorkspace: IeltsWorkspace): Promise<IeltsWorkspace> =>
    ipcRenderer.invoke('ielts-workspace:load', initialWorkspace),
  saveIeltsNotes: (notes: string): Promise<void> => ipcRenderer.invoke('ielts-workspace:save-notes', notes),
  saveIeltsDirections: (directions: StudyDirection[]): Promise<void> =>
    ipcRenderer.invoke('ielts-workspace:save-directions', directions),
  generateIeltsWriting: (mode: 'outline' | 'feedback' | 'sample', taskType: 'task-1' | 'task-2', prompt: string, draft: string): Promise<string> =>
    ipcRenderer.invoke('ielts-writing:generate', { mode, taskType, prompt, draft }),
  listTranslationHistory: (): Promise<TranslationHistoryRecord[]> => ipcRenderer.invoke('history:list'),
  loadLearningDashboard: (): Promise<LearningDashboard> => ipcRenderer.invoke('learning:dashboard'),
  createLearningFromRecord: (recordId: number): Promise<LearningItem> => ipcRenderer.invoke('learning:create-from-record', recordId),
  createLearningFromSource: (sourceText: string, translatedText: string, direction: 'zh-to-en' | 'en-to-zh', sourceSurface: string): Promise<LearningItem> =>
    ipcRenderer.invoke('learning:create-from-source', { sourceText, translatedText, direction, sourceSurface }),
  reviewLearningItem: (itemId: number, exerciseType: ReviewExerciseType, answer: string, operationId?: string): Promise<ReviewFeedback> =>
    ipcRenderer.invoke('learning:review', { itemId, exerciseType, answer, operationId }),
  reviewLearningTask: (itemIds: number[], answer: string, operationId?: string): Promise<Omit<ReviewFeedback, 'nextReviewAt'>> => ipcRenderer.invoke('learning:task', { itemIds, answer, operationId }),
  updateLearningPreferences: (preferences: { streakEnabled?: boolean; reducedMotion?: boolean }): Promise<GamificationDashboard> => ipcRenderer.invoke('learning:update-preferences', preferences),
  deleteLearningItem: (itemId: number): Promise<void> => ipcRenderer.invoke('learning:delete-item', itemId),
  clearLearningData: (): Promise<void> => ipcRenderer.invoke('learning:clear-data'),
  getSetting: (key: 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model'): Promise<string | undefined> => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model', value: 'dark' | 'light' | 'system' | 'true' | 'false' | string): Promise<void> => ipcRenderer.invoke('settings:set', key, value),
  chooseBackupDirectory: (): Promise<string | undefined> => ipcRenderer.invoke('settings:choose-backup-directory'),
  setShortcut: (shortcut: string): Promise<{ ok: true } | { ok: false; message: string }> => ipcRenderer.invoke('settings:set-shortcut', shortcut),
  searchNews: (query: string): Promise<NewsArticle[]> => ipcRenderer.invoke('news:search', query),
  summarizeNews: (article: Pick<NewsArticle, 'title' | 'description'>): Promise<string> => ipcRenderer.invoke('news:summarize', article),
  openNews: (url: string): Promise<void> => ipcRenderer.invoke('news:open', url)
})
