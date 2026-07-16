import '../shared.css'
import { initializeTheme } from '../theme'
import {
  detectTranslationDirection,
  getDirectionLabels,
  type TranslationDirection
} from '../../shared/translationDirection'

initializeTheme()

type PopupState = 'idle' | 'loading-model' | 'translating' | 'success' | 'error'

const POPUP_DEFAULT_HEIGHT = 360
const POPUP_RESULT_HEIGHT = 540
const isDevelopment = window.location.protocol === 'http:'

const form = document.querySelector<HTMLFormElement>('#translation-form')!
const input = document.querySelector<HTMLTextAreaElement>('#source-input')!
const translateButton = document.querySelector<HTMLButtonElement>('#translate-button')!
const closeButton = document.querySelector<HTMLButtonElement>('#close-button')!
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button')!
const sourceHint = document.querySelector<HTMLSpanElement>('#source-hint')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const statusText = document.querySelector<HTMLSpanElement>('#status-text')!
const loadingIndicator = document.querySelector<HTMLSpanElement>('#loading-indicator')!
const resultCard = document.querySelector<HTMLElement>('#result-card')!
const result = document.querySelector<HTMLParagraphElement>('#translation-result')!
const translationTitle = document.querySelector<HTMLHeadingElement>('#translation-title')!
const sourceLabel = document.querySelector<HTMLLabelElement>('#source-label')!
const resultLabel = document.querySelector<HTMLSpanElement>('#result-label')!

let popupState: PopupState = 'idle'
let popupSessionId = 0
let latestTranslation = ''
let copyResetTimer: ReturnType<typeof setTimeout> | undefined

window.api.onOpenPopup(({ text, source }) => {
  popupSessionId += 1
  const sessionId = popupSessionId
  debugLog('popup opened', { sessionId, source, textLength: text?.length ?? 0 })

  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = undefined
  copyButton.textContent = '複製'

  input.value = text ?? ''
  setDirection(text ? detectTranslationDirection(text) : 'zh-to-en')
  latestTranslation = ''
  result.textContent = ''
  resultCard.hidden = true
  copyButton.textContent = '複製'
  window.api.resizePopup(POPUP_DEFAULT_HEIGHT)
  setState('idle')
  sourceHint.textContent =
    source === 'selection' ? '已取得選取文字，翻譯中…' : 'Enter 翻譯 · Shift+Enter 換行'

  if (text) {
    input.focus()
    void translate(sessionId)
  } else {
    input.focus()
    input.select()
  }
})

window.api.onModelReady(() => {
  debugLog('model ready event received', { sessionId: popupSessionId, popupState })
  if (popupState === 'loading-model') {
    statusText.textContent = '模型已載入，正在翻譯…'
  }
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  debugLog('form submitted', { sessionId: popupSessionId, popupState })
  void translate(popupSessionId)
})

form.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return

  // Capture at the form boundary so the textarea never consumes Enter as a newline.
  event.preventDefault()
  event.stopPropagation()
  debugLog('Enter submitted', { sessionId: popupSessionId, popupState })
  void translate(popupSessionId)
}, true)

closeButton.addEventListener('click', () => {
  debugLog('close clicked', { sessionId: popupSessionId, popupState })
  window.api.closePopup()
})

copyButton.addEventListener('click', async () => {
  if (!latestTranslation || popupState !== 'success') return

  try {
    await navigator.clipboard.writeText(latestTranslation)
    copyButton.textContent = '已複製'
    status.hidden = false
    statusText.textContent = '已複製翻譯結果'
    if (copyResetTimer) clearTimeout(copyResetTimer)
    copyResetTimer = setTimeout(() => {
      copyButton.textContent = '複製'
      status.hidden = true
    }, 1200)
  } catch {
    setState('error', '無法複製翻譯結果，請稍後重試')
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    debugLog('Escape pressed', { sessionId: popupSessionId, popupState })
    window.api.closePopup()
  }
})

async function translate(sessionId: number): Promise<void> {
  if (sessionId !== popupSessionId || popupState === 'loading-model' || popupState === 'translating') {
    debugLog('translation ignored', { sessionId, popupSessionId, popupState })
    return
  }

  const text = input.value.trim()
  setDirection(detectTranslationDirection(text))
  const startedAt = Date.now()
  debugLog('translation started', { sessionId, textLength: text.length })
  if (!text) {
    window.api.resizePopup(POPUP_DEFAULT_HEIGHT)
    setState('error', '請先輸入要翻譯的中文')
    input.focus()
    return
  }

  latestTranslation = ''
  result.textContent = ''
  resultCard.hidden = true
  window.api.resizePopup(POPUP_DEFAULT_HEIGHT)
  setState('translating', 'Gemma 4 翻譯中…')

  try {
    const model = await window.api.getModelStatus()
    debugLog('model status received', {
      sessionId,
      exists: model.exists,
      runtimeState: model.runtimeState,
      backend: model.backend
    })
    if (sessionId !== popupSessionId) return

    if (!model.exists) {
      setState('error', '模型尚未下載，請先完成 Setup Wizard')
      return
    }

    if (model.runtimeState === 'error') {
      setState('error', model.message ?? '模型載入失敗，請從 Setup Wizard 重新載入')
      return
    }

    if (model.runtimeState === 'loading') {
      setState('loading-model', '模型載入中，完成後會自動翻譯…')
    }

    debugLog('translation IPC dispatched', { sessionId })
    const response = await window.api.translate(text, sessionId)
    debugLog('translation IPC responded', {
      sessionId,
      elapsedMs: Date.now() - startedAt,
      ok: response.ok,
      resultLength: response.ok ? response.text.length : undefined
    })
    if (sessionId !== popupSessionId) return

    if (response.ok) {
      setDirection(response.direction)
      latestTranslation = response.text
      result.textContent = response.text
      resultCard.hidden = false
      setState('success')
      window.api.resizePopup(POPUP_RESULT_HEIGHT)
    } else {
      setState('error', `${response.message}，請重試`)
    }
  } catch (error) {
    debugError('translation failed in renderer', error, { sessionId, elapsedMs: Date.now() - startedAt })
    if (sessionId !== popupSessionId) return
    const message = error instanceof Error ? error.message : '翻譯失敗，請重試'
    setState('error', message)
  }
}

function setDirection(direction: TranslationDirection): void {
  const labels = getDirectionLabels(direction)
  translationTitle.textContent = labels.title
  sourceLabel.textContent = `要翻譯的${labels.sourceLanguage}`
  input.placeholder = labels.placeholder
  resultLabel.textContent = labels.targetLanguage
  document.title = `Lexicon ${labels.title}`
}

function setState(nextState: PopupState, message = ''): void {
  const previousState = popupState
  popupState = nextState
  debugLog('state changed', { sessionId: popupSessionId, from: previousState, to: nextState, message })
  const loadingModel = nextState === 'loading-model'
  const translating = nextState === 'translating'

  input.disabled = translating
  translateButton.disabled = loadingModel || translating
  translateButton.textContent =
    nextState === 'error'
      ? '重試'
      : nextState === 'success'
        ? '重新翻譯'
        : translating
          ? '翻譯中…'
          : '翻譯'
  copyButton.disabled = nextState !== 'success'
  loadingIndicator.hidden = !loadingModel && !translating
  statusText.textContent = message
  status.hidden = !message
  status.classList.toggle('status-error', nextState === 'error')
}

function debugLog(event: string, details: Record<string, unknown> = {}): void {
  if (!isDevelopment) return
  window.api.debugLog('popup', event, details)
  console.log(`[Lexicon debug][popup] ${event}`, details)
}

function debugError(event: string, error: unknown, details: Record<string, unknown> = {}): void {
  if (!isDevelopment) return
  const message = error instanceof Error ? error.message : String(error)
  window.api.debugLog('popup', event, { ...details, message })
  console.error(`[Lexicon debug][popup] ${event}`, { ...details, message })
}
