import api from './client'
import type * as T from '@/types/english'

async function call<R>(operation: string, ...args: unknown[]): Promise<R> {
  try {
  const response = await api.post<{ result: R }>('/english/rpc/', { operation, args }, {
    timeout: 0, headers: { 'X-Unus-Client': 'web' }
  })
  return response.data.result
  } catch (error) {
    const payload = (error as { response?: { data?: { error?: string } } }).response?.data
    throw new Error(payload?.error ?? (error instanceof Error ? error.message : '英文服務無法連線'))
  }
}

const listeners = new Map<string, Set<(data: any) => void>>()
const retained = new Map<string, unknown>()
let events: EventSource | undefined
function subscribe<V>(channel: string, callback: (data: V) => void): () => void {
  const callbacks = listeners.get(channel) ?? new Set()
  callbacks.add(callback); listeners.set(channel, callbacks)
  if (!events) {
    events = new EventSource('/api/english/events/')
    events.onmessage = (message) => {
      const { channel, data } = JSON.parse(message.data) as { channel: string; data: unknown }
      if (channel === 'youtube:transcript-open') {
        retained.delete('youtube:transcript-error'); retained.delete('youtube:transcript-progress'); retained.delete('youtube:player-position')
      }
      if (channel === 'youtube:transcript-segment') {
        const update = data as { videoId: string; segmentId: string; translation: string }
        const transcript = retained.get('youtube:transcript-open') as T.YouTubeTranscript | undefined
        const segment = transcript?.videoId === update.videoId ? transcript.segments.find((item) => item.id === update.segmentId) : undefined
        if (segment) segment.translation = update.translation
      }
      retained.set(channel, data)
      listeners.get(channel)?.forEach((listener) => listener(data))
    }
  }
  if (retained.has(channel)) queueMicrotask(() => { if (callbacks.has(callback)) callback(retained.get(channel) as V) })
  return () => {
    callbacks.delete(callback)
    if (!callbacks.size) listeners.delete(channel)
    if (!listeners.size) { events?.close(); events = undefined; retained.clear() }
  }
}

export const englishApi = {
  platform: 'win32',
  translate: (text: string, sessionId?: number, mode?: T.TranslationRequestMode): Promise<T.TranslationResult> =>
    call('translation:translate', text, sessionId, mode),
  getModelStatus: (): Promise<T.ModelStatus> => call('model:status'),
  listModels: (): Promise<T.InstalledModel[]> => call('model:list'),
  getModelBenchmarks: (): Promise<Record<string, T.ModelBenchmark>> => call('model:benchmarks'),
  benchmarkModel: (filename: string): Promise<T.ModelBenchmark> => call('model:benchmark', filename),
  searchHuggingFaceModels: (query: string): Promise<T.HuggingFaceModel[]> => call('model:search-huggingface', query),
  listHuggingFaceGgufFiles: (repository: string): Promise<T.HuggingFaceGgufFile[]> => call('model:list-huggingface-files', repository),
  selectModel: (filename: string): Promise<{ ok: true } | { ok: false; message: string }> => call('model:select', filename),
  openModelDownload: async (): Promise<void> => { window.dispatchEvent(new Event('english:open-model-download')) },
  downloadModel: (request: T.ModelDownloadRequest = { kind: 'curated', id: 'gemma-4-e2b' }): Promise<{ ok: true; status: T.ModelStatus } | { ok: false; message: string }> =>
    call('model:download', request),
  onDownloadProgress: (callback: (progress: T.DownloadProgress) => void) =>
    subscribe('model:download-progress', callback),
  onDownloadState: (callback: (state: 'verifying') => void) => subscribe('model:download-state', callback),
  onModelReady: (callback: () => void) => subscribe('model:ready', callback),
  onYouTubeTranscriptOpen: (callback: (transcript: T.YouTubeTranscript) => void) => subscribe('youtube:transcript-open', callback),
  onYouTubeTranscriptSegment: (callback: (segment: { videoId: string; segmentId: string; translation: string }) => void) => subscribe('youtube:transcript-segment', callback),
  onYouTubeTranscriptProgress: (callback: (progress: { videoId: string; completed: number; total: number }) => void) => subscribe('youtube:transcript-progress', callback),
  onYouTubeTranscriptError: (callback: (error: { videoId: string; message: string }) => void) => subscribe('youtube:transcript-error', callback),
  onYouTubePlayerPosition: (callback: (position: { videoId: string; positionMs: number; playing: boolean }) => void) => subscribe('youtube:player-position', callback),
  controlYouTube: (control: T.YouTubeControl): Promise<{ ok: true } | { ok: false; message: string }> => call('youtube:control', control),
  loadIeltsWorkspace: (initialWorkspace: T.IeltsWorkspace): Promise<T.IeltsWorkspace> =>
    call('ielts-workspace:load', initialWorkspace),
  saveIeltsNotes: (notes: string): Promise<void> => call('ielts-workspace:save-notes', notes),
  saveIeltsDirections: (directions: T.StudyDirection[]): Promise<void> =>
    call('ielts-workspace:save-directions', directions),
  generateIeltsWriting: (mode: 'outline' | 'feedback' | 'sample', taskType: 'task-1' | 'task-2', prompt: string, draft: string): Promise<string> =>
    call('ielts-writing:generate', { mode, taskType, prompt, draft }),
  listTranslationHistory: (): Promise<T.TranslationHistoryRecord[]> => call('history:list'),
  deleteTranslationHistoryRecord: (recordId: number): Promise<void> => call('history:delete', recordId),
  loadLearningDashboard: (): Promise<T.LearningDashboard> => call('learning:dashboard'),
  createLearningFromRecord: (recordId: number): Promise<T.LearningItem> => call('learning:create-from-record', recordId),
  createLearningFromSource: (sourceText: string, translatedText: string, direction: 'zh-to-en' | 'en-to-zh', sourceSurface: string): Promise<T.LearningItem> =>
    call('learning:create-from-source', { sourceText, translatedText, direction, sourceSurface }),
  reviewLearningItem: (itemId: number, exerciseType: T.ReviewExerciseType, answer: string, operationId?: string): Promise<T.ReviewFeedback> =>
    call('learning:review', { itemId, exerciseType, answer, operationId }),
  reviewLearningTask: (itemIds: number[], answer: string, operationId?: string): Promise<Omit<T.ReviewFeedback, 'nextReviewAt'>> => call('learning:task', { itemIds, answer, operationId }),
  updateLearningPreferences: (preferences: { streakEnabled?: boolean; reducedMotion?: boolean }): Promise<T.GamificationDashboard> => call('learning:update-preferences', preferences),
  deleteLearningItem: (itemId: number): Promise<void> => call('learning:delete-item', itemId),
  clearLearningData: (): Promise<void> => call('learning:clear-data'),
  getSetting: (key: 'unus-theme' | 'youtube-videos' | 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model'): Promise<string | undefined> => call('settings:get', key),
  setSetting: (key: 'unus-theme' | 'youtube-videos' | 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model', value: 'dark' | 'light' | 'system' | 'true' | 'false' | string): Promise<void> => call('settings:set', key, value),
  chooseBackupDirectory: (): Promise<string | undefined> => call('settings:choose-backup-directory'),
  setShortcut: (shortcut: string): Promise<{ ok: true } | { ok: false; message: string }> => call('settings:set-shortcut', shortcut),
  searchNews: (query: string): Promise<T.NewsArticle[]> => call('news:search', query),
  summarizeNews: (article: Pick<T.NewsArticle, 'title' | 'description'>): Promise<string> => call('news:summarize', article),
  openNews: (url: string): Promise<void> => call('news:open', url)
}

export async function initializeEnglishApi(): Promise<void> {
  englishApi.platform = await call<string>('system:platform')
}

export function onEnglishTheme(callback: (theme: string) => void): () => void { return subscribe('settings:theme-changed', callback) }
