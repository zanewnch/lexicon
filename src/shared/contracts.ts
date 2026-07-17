import type { LookupResult, TranslationRequestMode } from './lookup'
import type { TranslationDirection } from './translationDirection'

export type TranslationResult =
  | { ok: true; kind: 'translation'; text: string; direction: TranslationDirection; translationRecordId: number }
  | { ok: true; kind: 'lookup'; lookup: LookupResult }
  | { ok: false; message: string }

export type ModelStatus = {
  exists: boolean
  filename: string
  path: string
  size: number
  expectedSize: number | null
  state: 'missing' | 'ready' | 'downloading' | 'verifying' | 'error'
  message?: string
  backend: 'metal' | 'cuda' | 'vulkan' | 'cpu'
  runtimeState: 'idle' | 'loading' | 'ready' | 'error'
}

export type TranslationRequest = {
  text: string
  sessionId?: number
  mode?: TranslationRequestMode
}
