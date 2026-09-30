export type OpenPopupPayload = {
  text: string | null
  source: 'selection' | 'manual'
  selectionPending?: boolean
}

export type TranslationResult =
  | { ok: true; kind: 'translation'; text: string; direction: 'zh-to-en' | 'en-to-zh'; translationRecordId: number }
  | { ok: true; kind: 'lookup'; lookup: LookupResult }
  | { ok: false; message: string }

export type TranslationRequestMode = 'translation' | 'lookup'

export type LookupResult = {
  term: string
  ipa: string
  meaning: string
  example: string
  exampleTranslation: string
}

export type ModelStatus = {
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

export type DownloadProgress = {
  received: number
  total: number
  percent: number
}

export type InstalledModel = { filename: string; path: string; size: number; modifiedAt: number }
export type ModelBenchmarkRating = 'smooth' | 'usable' | 'strained' | 'not-recommended'
export type ModelBenchmark =
  | { status: 'success'; filename: string; size: number; modifiedAt: number; completedAt: string; backend: 'metal' | 'cuda' | 'vulkan' | 'cpu'; firstTokenMs: number; tokensPerSecond: number; rating: ModelBenchmarkRating; recommendation: string }
  | { status: 'failed'; filename: string; size: number; modifiedAt: number; completedAt: string; message: string }
export type HuggingFaceModel = { id: string; downloads: number; likes: number; updatedAt?: string }
export type HuggingFaceGgufFile = { filename: string; size: number; sha256?: string }
export type ModelDownloadRequest = { kind: 'curated'; id: string } | { kind: 'huggingface'; repository: string; filename: string } | { kind: 'custom'; url: string }

export type StudyDirection = {
  id: number
  title: string
  focus: string
  status: 'planning' | 'active' | 'done'
}

export type IeltsWorkspace = { notes: string; directions: StudyDirection[] }
export type TranslationHistoryRecord = { id: number; sourceText: string; translatedText: string; direction: 'zh-to-en' | 'en-to-zh'; sourceSurface: string; createdAt: string }
export type NewsArticle = { id: string; title: string; url: string; source: string; publishedAt: string; description: string }


export * from './englishLearning'
export * from './englishYoutube'
