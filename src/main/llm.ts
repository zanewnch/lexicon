import {
  type ChatWrapper,
  Gemma4ChatWrapper,
  getLlama,
  getLlamaGpuTypes,
  LlamaChatSession,
  LlamaLogLevel,
  resolveChatWrapper,
  type Llama,
  type LlamaContext,
  type LlamaGpuType,
  type LlamaModel
} from 'node-llama-cpp'
import { type TranslationDirection } from '../shared/translationDirection'
import { type LookupResult } from '../shared/lookup'
import type { LearningExtraction, ReviewFeedback, ReviewExerciseType } from '../shared/learning'

export type ComputeBackend = 'metal' | 'cuda' | 'vulkan' | 'cpu'
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

function getLookupSystemPrompt(): string {
  return `You are Lexicon, an English learner's dictionary for Traditional Chinese speakers.
For the English word or short phrase the user provides, return exactly one valid JSON object and nothing else. Do not use Markdown or code fences.

Use this exact schema:
{"term":"...","ipa":"/.../","meaning":"...","example":"...","exampleTranslation":"..."}

Rules:
- term: repeat the queried English word or phrase with normal capitalization.
- ipa: General American IPA, enclosed in slashes.
- meaning: concise Traditional Chinese meaning for the most likely common sense; use semicolons only when needed.
- example: one natural, complete English sentence that demonstrates the meaning.
- exampleTranslation: a natural Traditional Chinese translation of that exact example.
- Do not invent rare senses or extra facts. Every field must be a non-empty string.`
}

function getLearningExtractionPrompt(): string {
  return `You turn a real translation into one useful English learning item for a Traditional Chinese speaker.
Return exactly one JSON object, no Markdown or commentary.
Schema: {"promptZh":"...","targetEn":"...","focusExpression":"...","explanationZh":"...","alternatives":["..."],"tags":["..."]}
Rules:
- targetEn must be one natural English sentence the learner can reuse.
- promptZh is the matching Traditional Chinese communication intent.
- focusExpression is one useful English phrase that appears verbatim in targetEn.
- explanationZh is a concise Traditional Chinese usage explanation, maximum 40 Chinese characters.
- alternatives contains at most one natural alternative; tags contains 1 to 3 short Traditional Chinese situation tags.
- Do not invent details not in the input.`
}

function getReviewPrompt(item: LearningExtraction, exerciseType: ReviewExerciseType): string {
  return `You give concise, encouraging feedback to a Traditional Chinese English learner.
Return exactly one JSON object, no Markdown or commentary.
Schema: {"communicativeSuccess":true,"message":"...","correction":"...","naturalAnswer":"...","result":"again|hard|good|easy"}
Rules:
- Judge whether the learner's answer communicates the prompt.
- correction has at most one important correction in Traditional Chinese; use an empty string if none.
- message is concise Traditional Chinese encouragement.
- naturalAnswer is one natural English answer.
- Result: again if meaning fails; hard if understandable but focus expression or grammar needs correction; good if correct; easy only if correct and natural.
Learning item: ${JSON.stringify(item)}
Exercise type: ${exerciseType}`
}

export class TranslationEngine {
  private llama: Llama | undefined
  private model: LlamaModel | undefined
  private context: LlamaContext | undefined
  private chatWrapper: ChatWrapper | undefined
  private loadOperation: Promise<void> | undefined
  private selectedBackend: ComputeBackend = 'cpu'
  private runtimeState: ModelRuntimeState = 'idle'
  private runtimeError: string | undefined
  private nextTranslationOperationId = 0

  async load(modelPath: string): Promise<void> {
    if (this.loadOperation) {
      return this.loadOperation
    }

    const startedAt = Date.now()
    this.runtimeState = 'loading'
    this.runtimeError = undefined

    this.loadOperation = (async () => {
      await this.dispose()

      const supportedGpuTypes: LlamaGpuType[] = await getLlamaGpuTypes('supported').catch(() => [])
      const candidates: Array<{ backend: ComputeBackend; gpu: LlamaGpuType }> = []

      // node-llama-cpp does not expose an NPU backend for GGUF models.
      // Keep this explicit so an NPU is never reported as being used when it is not.
      if (supportedGpuTypes.includes('metal')) candidates.push({ backend: 'metal', gpu: 'metal' })
      if (supportedGpuTypes.includes('cuda')) candidates.push({ backend: 'cuda', gpu: 'cuda' })
      if (supportedGpuTypes.includes('vulkan')) candidates.push({ backend: 'vulkan', gpu: 'vulkan' })
      candidates.push({ backend: 'cpu', gpu: false })

      let lastError: unknown
      for (const candidate of candidates) {
        let llama: Llama | undefined
        let model: LlamaModel | undefined
        let context: LlamaContext | undefined

        try {
          llama = await getLlama({ gpu: candidate.gpu, build: 'never', logLevel: LlamaLogLevel.error })
          model = await llama.loadModel({
            modelPath,
            gpuLayers: candidate.backend === 'cpu' ? 0 : 'auto'
          })
          context = await model.createContext({ contextSize: 2048 })

          this.llama = llama
          this.model = model
          this.context = context
          this.chatWrapper = model.fileInfo.metadata.general.architecture === 'gemma4'
            ? new Gemma4ChatWrapper({ reasoning: false })
            : resolveChatWrapper(model)
          this.selectedBackend = candidate.backend
          this.runtimeState = 'ready'

          writeLog('info', `[Lexicon] Gemma 4 compute backend: ${candidate.backend}`)
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
    try {
      await this.waitUntilReady()
      if (!this.context) throw new Error('翻譯模型尚未載入')

      const session = new LlamaChatSession({
          contextSequence: this.context.getSequence(),
          chatWrapper: this.getChatWrapper(),
          systemPrompt: getTranslationSystemPrompt(direction),
          autoDisposeSequence: true
        })

        try {
          const response = await session.prompt(input, {
            maxTokens: 512,
            temperature: 0,
            trimWhitespaceSuffix: true
          })
          const cleaned = cleanTranslation(response)
          if (!cleaned) throw new Error('模型沒有產生翻譯結果')
          return cleaned
        } finally {
          session.dispose()
        }
    } catch (error) {
      debugError('translation failed', error, { operationId, elapsedMs: Date.now() - startedAt })
      throw error
    }
  }

  async lookup(text: string, traceId?: string): Promise<LookupResult> {
    const input = text.trim()
    if (!input) throw new Error('請先輸入要查詢的英文單字或短語')

    const operationId = traceId ?? `lookup-${++this.nextTranslationOperationId}`
    const startedAt = Date.now()
    try {
      await this.waitUntilReady()
      if (!this.context) throw new Error('翻譯模型尚未載入')

      const session = new LlamaChatSession({
          contextSequence: this.context.getSequence(),
          chatWrapper: this.getChatWrapper(),
          systemPrompt: getLookupSystemPrompt(),
          autoDisposeSequence: true
        })

        try {
          const response = await session.prompt(input, {
            maxTokens: 512,
            temperature: 0,
            trimWhitespaceSuffix: true
          })
          return parseLookupResult(response)
        } finally {
          session.dispose()
        }
    } catch (error) {
      debugError('lookup failed', error, { operationId, elapsedMs: Date.now() - startedAt })
      throw error
    }
  }

  async summarizeNews(title: string, description: string): Promise<string> {
    const input = `Title: ${title}\nArticle excerpt: ${description || '(No excerpt available)'}`
    return this.promptText(
      'You summarize a news article for a Traditional Chinese reader. Use only the supplied title and excerpt; do not add facts. Return 2 to 3 concise Traditional Chinese bullet points. If the excerpt lacks enough detail, explicitly say so.',
      input,
      300
    )
  }

  async extractLearningItem(sourceText: string, translatedText: string, direction: TranslationDirection, traceId?: string): Promise<LearningExtraction> {
    const fallback = fallbackLearningExtraction(sourceText, translatedText, direction)
    try {
      const response = await this.promptJson(getLearningExtractionPrompt(), `Source: ${sourceText}\nTranslation: ${translatedText}\nDirection: ${direction}`, traceId)
      return parseLearningExtraction(response, fallback)
    } catch (error) {
      debugError('learning extraction failed; using fallback', error)
      return fallback
    }
  }

  async evaluateLearningAnswer(item: LearningExtraction, exerciseType: ReviewExerciseType, answer: string, traceId?: string): Promise<Omit<ReviewFeedback, 'nextReviewAt'>> {
    const fallback = fallbackReview(item, answer)
    try {
      const response = await this.promptJson(getReviewPrompt(item, exerciseType), `Learner answer: ${answer}`, traceId)
      return parseReviewFeedback(response, fallback)
    } catch (error) {
      debugError('learning review failed; using fallback', error)
      return fallback
    }
  }

  async evaluateLearningTask(items: LearningExtraction[], answer: string, traceId?: string): Promise<Omit<ReviewFeedback, 'nextReviewAt'>> {
    const fallback = fallbackReview(items[0], answer)
    try {
      const response = await this.promptJson(`You assess an English learner's short real-world message. Return exactly one JSON object with this schema: {"communicativeSuccess":true,"message":"...","correction":"...","naturalAnswer":"...","result":"again|hard|good|easy"}. Use concise Traditional Chinese for message and correction. Judge whether the response completes the task and naturally uses the requested expressions. Correct only the most important point.`, `Required expressions: ${JSON.stringify(items.map((item) => item.focusExpression))}\nUseful models: ${JSON.stringify(items.map((item) => item.targetEn))}\nLearner message: ${answer}`, traceId)
      return parseReviewFeedback(response, fallback)
    } catch (error) {
      debugError('learning task review failed; using fallback', error)
      return fallback
    }
  }

  private async promptJson(systemPrompt: string, input: string, _traceId?: string): Promise<string> {
    await this.waitUntilReady()
    if (!this.context) throw new Error('翻譯模型尚未載入')
    const session = new LlamaChatSession({
      contextSequence: this.context.getSequence(), chatWrapper: this.getChatWrapper(),
      systemPrompt, autoDisposeSequence: true
    })
    try { return await session.prompt(input, { maxTokens: 512, temperature: 0, trimWhitespaceSuffix: true }) }
    finally { session.dispose() }
  }

  private async promptText(systemPrompt: string, input: string, maxTokens: number): Promise<string> {
    await this.waitUntilReady()
    if (!this.context) throw new Error('翻譯模型尚未載入')
    const session = new LlamaChatSession({
      contextSequence: this.context.getSequence(), chatWrapper: this.getChatWrapper(),
      systemPrompt, autoDisposeSequence: true
    })
    try {
      const response = await session.prompt(input, { maxTokens, temperature: 0, trimWhitespaceSuffix: true })
      if (!response.trim()) throw new Error('模型沒有產生新聞摘要')
      return response.trim()
    } finally { session.dispose() }
  }

  async dispose(): Promise<void> {
    const context = this.context
    const model = this.model
    const llama = this.llama
    this.context = undefined
    this.chatWrapper = undefined
    this.model = undefined
    this.llama = undefined
    this.selectedBackend = 'cpu'
    if (this.runtimeState !== 'loading') this.runtimeState = 'idle'
    await context?.dispose()
    await model?.dispose()
    await llama?.dispose()
  }

  private getChatWrapper(): ChatWrapper {
    if (!this.chatWrapper) throw new Error('翻譯模型尚未載入')
    return this.chatWrapper
  }
}

function cleanTranslation(response: string): string {
  let result = response.trim()
  result = result.replace(/^(?:English|Chinese|Traditional Chinese|中文|繁體中文)\s*[:：]\s*/i, '')
  result = result.replace(/^<\|channel\|>final\s*/i, '')
  result = result.replace(/^<\|channel\|>answer\s*/i, '')
  return result.trim()
}

function parseLookupResult(response: string): LookupResult {
  const start = response.indexOf('{')
  const end = response.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('模型回傳的查詞格式不正確，請重試')

  let value: unknown
  try {
    value = JSON.parse(response.slice(start, end + 1))
  } catch {
    throw new Error('模型回傳的查詞格式不正確，請重試')
  }

  if (!value || typeof value !== 'object') throw new Error('模型回傳的查詞格式不正確，請重試')
  const candidate = value as Record<string, unknown>
  return {
    term: getLookupField(candidate, 'term'),
    ipa: getLookupField(candidate, 'ipa'),
    meaning: getLookupField(candidate, 'meaning'),
    example: getLookupField(candidate, 'example'),
    exampleTranslation: getLookupField(candidate, 'exampleTranslation')
  }
}

function getLookupField(candidate: Record<string, unknown>, field: keyof LookupResult): string {
  const value = candidate[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('模型回傳的查詞內容不完整，請重試')
  }
  return value.trim()
}

function parseJson(response: string): Record<string, unknown> {
  const start = response.indexOf('{'); const end = response.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('模型回傳 JSON 格式不正確')
  const value: unknown = JSON.parse(response.slice(start, end + 1))
  if (!value || typeof value !== 'object') throw new Error('模型回傳 JSON 格式不正確')
  return value as Record<string, unknown>
}
function stringField(value: Record<string, unknown>, key: string, fallback: string): string { return typeof value[key] === 'string' && value[key].trim() ? value[key].trim() : fallback }
function stringList(value: Record<string, unknown>, key: string, fallback: string[]): string[] { return Array.isArray(value[key]) ? value[key].filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).slice(0, key === 'alternatives' ? 1 : 3) : fallback }
function fallbackLearningExtraction(source: string, translated: string, direction: TranslationDirection): LearningExtraction {
  const targetEn = direction === 'zh-to-en' ? translated : source
  const promptZh = direction === 'zh-to-en' ? source : translated
  const focusExpression = targetEn.split(/\s+/).slice(0, Math.min(4, targetEn.split(/\s+/).length)).join(' ')
  return { promptZh, targetEn, focusExpression, explanationZh: '從你的真實使用情境練習這句英文。', alternatives: [], tags: ['個人翻譯'] }
}
function parseLearningExtraction(response: string, fallback: LearningExtraction): LearningExtraction {
  const value = parseJson(response)
  const targetEn = stringField(value, 'targetEn', fallback.targetEn)
  const focusExpression = stringField(value, 'focusExpression', fallback.focusExpression)
  return {
    promptZh: stringField(value, 'promptZh', fallback.promptZh), targetEn,
    focusExpression: targetEn.toLowerCase().includes(focusExpression.toLowerCase()) ? focusExpression : fallback.focusExpression,
    explanationZh: stringField(value, 'explanationZh', fallback.explanationZh),
    alternatives: stringList(value, 'alternatives', fallback.alternatives), tags: stringList(value, 'tags', fallback.tags)
  }
}
function fallbackReview(item: LearningExtraction, answer: string): Omit<ReviewFeedback, 'nextReviewAt'> {
  const success = answer.trim().toLowerCase().includes(item.focusExpression.toLowerCase())
  return success
    ? { communicativeSuccess: true, message: '做得好，你成功取回了核心表達。', correction: '', naturalAnswer: item.targetEn, result: 'good' }
    : { communicativeSuccess: Boolean(answer.trim()), message: '再試一次，先把核心表達放進句子裡。', correction: `試著使用「${item.focusExpression}」。`, naturalAnswer: item.targetEn, result: answer.trim() ? 'hard' : 'again' }
}
function parseReviewFeedback(response: string, fallback: Omit<ReviewFeedback, 'nextReviewAt'>): Omit<ReviewFeedback, 'nextReviewAt'> {
  const value = parseJson(response); const result = value.result
  return {
    communicativeSuccess: typeof value.communicativeSuccess === 'boolean' ? value.communicativeSuccess : fallback.communicativeSuccess,
    message: stringField(value, 'message', fallback.message), correction: stringField(value, 'correction', fallback.correction),
    naturalAnswer: stringField(value, 'naturalAnswer', fallback.naturalAnswer),
    result: result === 'again' || result === 'hard' || result === 'good' || result === 'easy' ? result : fallback.result
  }
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
