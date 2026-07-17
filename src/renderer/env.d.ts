declare module '*.css'
declare module '*.sass'
declare module '*.sass'
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

type OpenPopupPayload = {
  text: string | null
  source: 'selection' | 'manual'
}

type TranslationResult =
  | { ok: true; kind: 'translation'; text: string; direction: 'zh-to-en' | 'en-to-zh'; translationRecordId: number }
  | { ok: true; kind: 'lookup'; lookup: LookupResult }
  | { ok: false; message: string }

type TranslationRequestMode = 'translation' | 'lookup'

type LookupResult = {
  term: string
  ipa: string
  meaning: string
  example: string
  exampleTranslation: string
}

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

type InstalledModel = { filename: string; path: string; size: number }
type HuggingFaceModel = { id: string; downloads: number; likes: number; updatedAt?: string }
type HuggingFaceGgufFile = { filename: string; size: number; sha256?: string }
type ModelDownloadRequest = { kind: 'curated'; id: string } | { kind: 'huggingface'; repository: string; filename: string } | { kind: 'custom'; url: string }

type YouTubeTranscriptSegment = {
  id: string
  startMs: number
  endMs: number
  text: string
  translation?: string
}

type YouTubeTranscript = {
  videoId: string
  title: string
  language: string
  segments: YouTubeTranscriptSegment[]
}

type StudyDirection = {
  id: number
  title: string
  focus: string
  status: 'planning' | 'active' | 'done'
}

type IeltsWorkspace = { notes: string; directions: StudyDirection[] }
type LearningState = 'new' | 'learning' | 'mastered'
type ReviewExerciseType = 'reverse_translation' | 'cloze' | 'rewrite'
type LearningItem = { id: number; translationRecordId: number; promptZh: string; targetEn: string; focusExpression: string; explanationZh: string; alternatives: string[]; tags: string[]; state: LearningState; nextReviewAt: string; createdAt: string }
type ReviewCard = LearningItem & { exerciseType: ReviewExerciseType; clozePrompt?: string }
type LearningDashboard = { due: ReviewCard[]; recent: LearningItem[]; counts: Record<LearningState, number>; weekly: { saved: number; reviewed: number; correct: number }; patterns: Array<{ expression: string; misses: number }> }
type ReviewFeedback = { result: 'again' | 'hard' | 'good' | 'easy'; communicativeSuccess: boolean; message: string; correction: string; naturalAnswer: string; nextReviewAt: string }
type NewsArticle = { id: string; title: string; url: string; source: string; publishedAt: string; description: string }

interface Window {
  api: {
    platform: string
    debugLog(scope: string, event: string, details: Record<string, unknown>): void
    onOpenPopup(callback: (payload: OpenPopupPayload) => void): () => void
    translate(text: string, sessionId?: number, mode?: TranslationRequestMode): Promise<TranslationResult>
    closePopup(): void
    resizePopup(height: number): void
    getModelStatus(): Promise<ModelStatus>
    listModels(): Promise<InstalledModel[]>
    searchHuggingFaceModels(query: string): Promise<HuggingFaceModel[]>
    listHuggingFaceGgufFiles(repository: string): Promise<HuggingFaceGgufFile[]>
    selectModel(filename: string): Promise<{ ok: true } | { ok: false; message: string }>
    openModelDownload(): Promise<void>
    downloadModel(request?: ModelDownloadRequest): Promise<{ ok: true; status: ModelStatus } | { ok: false; message: string }>
    onDownloadProgress(callback: (progress: DownloadProgress) => void): () => void
    onDownloadState(callback: (state: 'verifying') => void): () => void
    onModelReady(callback: () => void): () => void
    onYouTubeTranscriptOpen(callback: (transcript: YouTubeTranscript) => void): () => void
    onYouTubeTranscriptSegment(callback: (segment: { videoId: string; segmentId: string; translation: string }) => void): () => void
    onYouTubeTranscriptProgress(callback: (progress: { videoId: string; completed: number; total: number }) => void): () => void
    onSetupError(callback: (message: string) => void): () => void
    closeSetup(): void
    loadIeltsWorkspace(initialWorkspace: IeltsWorkspace): Promise<IeltsWorkspace>
    saveIeltsNotes(notes: string): Promise<void>
    saveIeltsDirections(directions: StudyDirection[]): Promise<void>
    loadLearningDashboard(): Promise<LearningDashboard>
    createLearningFromRecord(recordId: number): Promise<LearningItem>
    createLearningFromSource(sourceText: string, translatedText: string, direction: 'zh-to-en' | 'en-to-zh', sourceSurface: string): Promise<LearningItem>
    reviewLearningItem(itemId: number, exerciseType: ReviewExerciseType, answer: string): Promise<ReviewFeedback>
    reviewLearningTask(itemIds: number[], answer: string): Promise<Omit<ReviewFeedback, 'nextReviewAt'>>
    deleteLearningItem(itemId: number): Promise<void>
    clearLearningData(): Promise<void>
    getSetting(key: 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model'): Promise<string | undefined>
    setSetting(key: 'theme' | 'backup-on-quit' | 'backup-directory' | 'shortcut' | 'model', value: ThemeMode | 'true' | 'false' | string): Promise<void>
    chooseBackupDirectory(): Promise<string | undefined>
    setShortcut(shortcut: string): Promise<{ ok: true } | { ok: false; message: string }>
    searchNews(query: string): Promise<NewsArticle[]>
    summarizeNews(article: Pick<NewsArticle, 'title' | 'description'>): Promise<string>
    openNews(url: string): Promise<void>
  }
}
