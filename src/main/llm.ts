import {
  Gemma4ChatWrapper,
  getLlama,
  getLlamaGpuTypes,
  LlamaChatSession,
  LlamaLogLevel,
  type Llama,
  type LlamaContext,
  type LlamaGpuType,
  type LlamaModel
} from 'node-llama-cpp'
import { type TranslationDirection } from '../shared/translationDirection'

export type ComputeBackend = 'cuda' | 'vulkan' | 'cpu'
export type ModelRuntimeState = 'idle' | 'loading' | 'ready' | 'error'

const isDevelopment = Boolean(process.env.ELECTRON_RENDERER_URL)

function getTranslationSystemPrompt(direction: TranslationDirection): string {
  const sourceLanguage = direction === 'zh-to-en' ? 'Traditional Chinese' : 'English'
  const targetLanguage = direction === 'zh-to-en' ? 'English' : 'Traditional Chinese'
  const contextualExamples =
    direction === 'zh-to-en'
      ? `Examples:
- "已儲存" → "Your changes have been saved."
- "送出指定週次的週報填報資料。" → "Submit the weekly progress report for the selected week."
- "取得使用者權限" → "Retrieve the user's access permissions."`
      : `Examples:
- "Save changes" → "儲存目前的變更。"
- "WeeklyProgressController" → "用來處理每週進度相關操作的控制器。"
- "[FromBody] SubmitWeeklyProgressRequest request" → "從請求主體取得的每週進度提交資料。"`

  return `You are Lexicon, a contextual translator.
Translate the user's ${sourceLanguage} selection into a natural, idiomatic ${targetLanguage} phrase or short sentence that someone can use immediately.

First infer the likely use from the selection itself:
- For normal prose, preserve its meaning, tense, tone, paragraph breaks, and intent.
- For a compact UI label or status, write the natural product copy a native speaker would expect, rather than a bare word-for-word gloss.
- For code-like identifiers, API signatures, or technical names, translate their apparent role into a concise natural description. Keep exact code tokens only when they are needed for clarity.
- Never invent behaviour, business rules, or details that are not supported by the selected text.
- If the input is already a complete sentence, do not pad it with extra facts. Prefer one concise sentence.

${contextualExamples}

Return only the ${targetLanguage} result. Do not add explanations, labels, notes, quotation marks, or commentary.
Do not show or describe your reasoning.`
}

export class TranslationEngine {
  private llama: Llama | undefined
  private model: LlamaModel | undefined
  private context: LlamaContext | undefined
  private loadOperation: Promise<void> | undefined
  private requestQueue = Promise.resolve()
  private selectedBackend: ComputeBackend = 'cpu'
  private runtimeState: ModelRuntimeState = 'idle'
  private runtimeError: string | undefined
  private nextTranslationOperationId = 0

  async load(modelPath: string): Promise<void> {
    if (this.loadOperation) {
      debugLog('model load already in progress')
      return this.loadOperation
    }

    const startedAt = Date.now()
    debugLog('model load started', { modelPath })
    this.runtimeState = 'loading'
    this.runtimeError = undefined

    this.loadOperation = (async () => {
      await this.dispose()

      const supportedGpuTypes: LlamaGpuType[] = await getLlamaGpuTypes('supported').catch(() => [])
      debugLog('GPU backends detected', { supportedGpuTypes })
      const candidates: Array<{ backend: ComputeBackend; gpu: LlamaGpuType }> = []

      // node-llama-cpp does not expose an NPU backend for GGUF models.
      // Keep this explicit so an NPU is never reported as being used when it is not.
      if (supportedGpuTypes.includes('cuda')) candidates.push({ backend: 'cuda', gpu: 'cuda' })
      if (supportedGpuTypes.includes('vulkan')) candidates.push({ backend: 'vulkan', gpu: 'vulkan' })
      candidates.push({ backend: 'cpu', gpu: false })

      let lastError: unknown
      for (const candidate of candidates) {
        let llama: Llama | undefined
        let model: LlamaModel | undefined
        let context: LlamaContext | undefined

        try {
          const candidateStartedAt = Date.now()
          debugLog('backend load attempt started', { backend: candidate.backend })
          llama = await getLlama({ gpu: candidate.gpu, build: 'never', logLevel: LlamaLogLevel.error })
          model = await llama.loadModel({
            modelPath,
            gpuLayers: candidate.backend === 'cpu' ? 0 : 'auto'
          })
          context = await model.createContext({ contextSize: 2048 })

          this.llama = llama
          this.model = model
          this.context = context
          this.selectedBackend = candidate.backend
          this.runtimeState = 'ready'

          writeLog('info', `[Lexicon] Gemma 4 compute backend: ${candidate.backend}`)
          debugLog('backend load attempt completed', {
            backend: candidate.backend,
            elapsedMs: Date.now() - candidateStartedAt
          })
          return
        } catch (error) {
          lastError = error
          debugError('backend load attempt failed', error, { backend: candidate.backend })
          await context?.dispose()
          await model?.dispose()
          await llama?.dispose()
          console.warn(`[Lexicon] ${candidate.backend} backend unavailable; trying the next backend`, error)
        }
      }

      throw lastError ?? new Error('找不到可用的模型執行 backend')
    })()

    try {
      await this.loadOperation
      debugLog('model load completed', { backend: this.selectedBackend, elapsedMs: Date.now() - startedAt })
    } catch (error) {
      this.loadOperation = undefined
      await this.dispose()
      this.runtimeState = 'error'
      this.runtimeError = error instanceof Error ? error.message : String(error)
      debugError('model load failed', error, { elapsedMs: Date.now() - startedAt })
      throw error
    }

    this.loadOperation = undefined
  }

  get ready(): boolean {
    return this.context !== undefined
  }

  get backend(): ComputeBackend {
    return this.selectedBackend
  }

  get state(): ModelRuntimeState {
    return this.runtimeState
  }

  get errorMessage(): string | undefined {
    return this.runtimeError
  }

  get loadPromise(): Promise<void> | undefined {
    return this.loadOperation
  }

  async waitUntilReady(): Promise<void> {
    if (this.context) return
    if (this.loadOperation) {
      await this.loadOperation
      return
    }
    if (this.runtimeState === 'error') {
      throw new Error(this.runtimeError ?? '翻譯模型載入失敗')
    }
    throw new Error('翻譯模型尚未載入')
  }

  async translate(text: string, direction: TranslationDirection, traceId?: string): Promise<string> {
    const input = text.trim()
    if (!input) throw new Error('請先輸入要翻譯的中文')

    const operationId = traceId ?? `translation-${++this.nextTranslationOperationId}`
    const startedAt = Date.now()
    debugLog('translation received', {
      operationId,
      textLength: input.length,
      direction,
      runtimeState: this.runtimeState,
      backend: this.selectedBackend
    })

    try {
      const readinessStartedAt = Date.now()
      await this.waitUntilReady()
      debugLog('translation model ready', { operationId, elapsedMs: Date.now() - readinessStartedAt })
      if (!this.context) throw new Error('翻譯模型尚未載入')

      const previous = this.requestQueue
      let release!: () => void
      this.requestQueue = new Promise<void>((resolve) => {
        release = resolve
      })
      const queueStartedAt = Date.now()
      await previous
      debugLog('translation queue acquired', { operationId, waitedMs: Date.now() - queueStartedAt })

      try {
        const session = new LlamaChatSession({
          contextSequence: this.context.getSequence(),
          chatWrapper: new Gemma4ChatWrapper({ reasoning: false }),
          systemPrompt: getTranslationSystemPrompt(direction),
          autoDisposeSequence: true
        })

        try {
          const promptStartedAt = Date.now()
          debugLog('translation prompt started', { operationId })
          const response = await session.prompt(input, {
            maxTokens: 512,
            temperature: 0,
            trimWhitespaceSuffix: true
          })
          const cleaned = cleanTranslation(response)
          if (!cleaned) throw new Error('模型沒有產生翻譯結果')
          debugLog('translation prompt completed', {
            operationId,
            promptElapsedMs: Date.now() - promptStartedAt,
            elapsedMs: Date.now() - startedAt,
            resultLength: cleaned.length
          })
          return cleaned
        } finally {
          session.dispose()
        }
      } finally {
        release()
      }
    } catch (error) {
      debugError('translation failed', error, { operationId, elapsedMs: Date.now() - startedAt })
      throw error
    }
  }

  async dispose(): Promise<void> {
    const context = this.context
    const model = this.model
    const llama = this.llama
    this.context = undefined
    this.model = undefined
    this.llama = undefined
    this.selectedBackend = 'cpu'
    if (this.runtimeState !== 'loading') this.runtimeState = 'idle'
    await context?.dispose()
    await model?.dispose()
    await llama?.dispose()
  }
}

function cleanTranslation(response: string): string {
  let result = response.trim()
  result = result.replace(/^(?:English|Chinese|Traditional Chinese|中文|繁體中文)\s*[:：]\s*/i, '')
  result = result.replace(/^<\|channel\|>final\s*/i, '')
  result = result.replace(/^<\|channel\|>answer\s*/i, '')
  return result.trim()
}

function debugLog(event: string, details: Record<string, unknown> = {}): void {
  if (!isDevelopment) return
  writeLog('log', `[Lexicon debug][llm] ${event}`, details)
}

function debugError(event: string, error: unknown, details: Record<string, unknown> = {}): void {
  if (!isDevelopment) return
  const message = error instanceof Error ? error.message : String(error)
  writeLog('error', `[Lexicon debug][llm] ${event}`, { ...details, message })
}

function writeLog(
  method: 'log' | 'info' | 'error',
  message: string,
  details?: Record<string, unknown>
): void {
  try {
    if (details) console[method](message, details)
    else console[method](message)
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code !== 'EPIPE') throw error
  }
}
