import './styles.css'
import { initializeTheme, setTheme, THEME_CHANGE_EVENT, type ThemeMode } from '../theme'
import {
  detectTranslationDirection,
  getDirectionLabels,
  type TranslationDirection
} from '../../shared/translationDirection'

const DEFAULT_SIDEBAR_WIDTH = 240
const MIN_SIDEBAR_WIDTH = 72
const MAX_SIDEBAR_WIDTH = 360
const SIDEBAR_WIDTH_KEY = 'lexicon.sidebarWidth'
const SIDEBAR_COLLAPSED_KEY = 'lexicon.sidebarCollapsed'

const shell = document.querySelector<HTMLElement>('#app-shell')!
const sidebarToggle = document.querySelector<HTMLButtonElement>('#sidebar-toggle')!
const resizeHandle = document.querySelector<HTMLElement>('#sidebar-resize')!
const navItems = [...document.querySelectorAll<HTMLButtonElement>('[data-view]')]
const views = [...document.querySelectorAll<HTMLElement>('.app-view')]
const themeOptions = [...document.querySelectorAll<HTMLButtonElement>('[data-theme-mode]')]

const form = document.querySelector<HTMLFormElement>('#app-translation-form')!
const input = document.querySelector<HTMLTextAreaElement>('#app-source-input')!
const translateButton = document.querySelector<HTMLButtonElement>('#app-translate-button')!
const copyButton = document.querySelector<HTMLButtonElement>('#app-copy-button')!
const sourceHint = document.querySelector<HTMLSpanElement>('#app-source-hint')!
const status = document.querySelector<HTMLParagraphElement>('#app-status')!
const resultCard = document.querySelector<HTMLElement>('#app-result-card')!
const result = document.querySelector<HTMLParagraphElement>('#app-translation-result')!
const translationTitle = document.querySelector<HTMLHeadingElement>('#translate-title')!
const translationLead = document.querySelector<HTMLParagraphElement>('#translate-lead')!
const sourceLabel = document.querySelector<HTMLLabelElement>('#app-source-label')!
const resultLabel = document.querySelector<HTMLSpanElement>('#app-result-label')!
const modelStatus = document.querySelector<HTMLParagraphElement>('#settings-model-status')!
const modelPath = document.querySelector<HTMLElement>('#settings-model-path')!
const backend = document.querySelector<HTMLSpanElement>('#settings-backend')!

let sidebarWidth = readSidebarWidth()
let sidebarCollapsed = readCollapsedState()
let latestTranslation = ''
let isDragging = false

renderThemeSelection(initializeTheme())
applySidebarState()
void loadModelStatus()
window.api.onModelReady(() => void loadModelStatus())

window.addEventListener(THEME_CHANGE_EVENT, (event) => {
  const mode = (event as CustomEvent<ThemeMode>).detail
  renderThemeSelection(mode)
})

themeOptions.forEach((option) => {
  option.addEventListener('click', () => {
    const mode = option.dataset.themeMode
    if (mode === 'dark' || mode === 'light' || mode === 'system') {
      setTheme(mode)
      renderThemeSelection(mode)
    }
  })
})

sidebarToggle.addEventListener('click', () => {
  sidebarCollapsed = !sidebarCollapsed
  persistSidebarState()
  applySidebarState()
})

resizeHandle.addEventListener('pointerdown', (event) => {
  if (sidebarCollapsed) return
  isDragging = true
  resizeHandle.setPointerCapture(event.pointerId)
  document.body.classList.add('is-resizing-sidebar')
})

resizeHandle.addEventListener('pointermove', (event) => {
  if (!isDragging) return
  sidebarWidth = clamp(event.clientX, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
  applySidebarState(false)
})

resizeHandle.addEventListener('pointerup', stopResizing)
resizeHandle.addEventListener('pointercancel', stopResizing)

resizeHandle.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    sidebarWidth = clamp(sidebarWidth - 16, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
    sidebarCollapsed = false
    persistSidebarState()
    applySidebarState()
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    sidebarWidth = clamp(sidebarWidth + 16, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
    sidebarCollapsed = false
    persistSidebarState()
    applySidebarState()
  }
})

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    const viewName = item.dataset.view
    if (viewName === 'translate' || viewName === 'settings') showView(viewName)
  })
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  void translate()
})

form.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return

  event.preventDefault()
  event.stopPropagation()
  void translate()
}, true)

copyButton.addEventListener('click', async () => {
  if (!latestTranslation) return
  await navigator.clipboard.writeText(latestTranslation)
  setStatus('已複製翻譯結果')
})

function stopResizing(event: PointerEvent): void {
  if (!isDragging) return
  isDragging = false
  if (resizeHandle.hasPointerCapture(event.pointerId)) resizeHandle.releasePointerCapture(event.pointerId)
  document.body.classList.remove('is-resizing-sidebar')
  persistSidebarState()
}

function applySidebarState(animate = true): void {
  shell.style.setProperty('--sidebar-width', `${sidebarCollapsed ? MIN_SIDEBAR_WIDTH : sidebarWidth}px`)
  shell.classList.toggle('is-collapsed', sidebarCollapsed)
  sidebarToggle.textContent = sidebarCollapsed ? '›' : '‹'
  sidebarToggle.title = sidebarCollapsed ? '展開 sidebar' : '摺疊 sidebar'
  sidebarToggle.setAttribute('aria-label', sidebarCollapsed ? '展開 sidebar' : '摺疊 sidebar')
  sidebarToggle.setAttribute('aria-expanded', String(!sidebarCollapsed))
  if (!animate) shell.classList.add('skip-sidebar-transition')
  else shell.classList.remove('skip-sidebar-transition')
}

function persistSidebarState(): void {
  localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
}

function readSidebarWidth(): number {
  const value = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY))
  return Number.isFinite(value) ? clamp(value, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH) : DEFAULT_SIDEBAR_WIDTH
}

function readCollapsedState(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function showView(viewName: 'translate' | 'settings'): void {
  views.forEach((view) => {
    view.hidden = view.id !== `${viewName}-view`
  })
  navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.view === viewName))
}

function renderThemeSelection(mode: ThemeMode): void {
  themeOptions.forEach((option) => {
    const selected = option.dataset.themeMode === mode
    option.classList.toggle('is-selected', selected)
    option.setAttribute('aria-checked', String(selected))
  })
}

async function translate(): Promise<void> {
  const text = input.value.trim()
  setDirection(detectTranslationDirection(text))
  if (!text) {
    setStatus('請先輸入要翻譯的中文')
    input.focus()
    return
  }

  setBusy(true)
  resultCard.hidden = true
  setStatus('Gemma 4 翻譯中…')

  try {
    const response = await window.api.translate(text)
    if (response.ok) {
      setDirection(response.direction)
      latestTranslation = response.text
      result.textContent = response.text
      resultCard.hidden = false
      setStatus('')
    } else {
      latestTranslation = ''
      setStatus(response.message)
    }
  } catch (error) {
    latestTranslation = ''
    const message = error instanceof Error ? error.message : '翻譯失敗，請重試'
    setStatus(message)
  } finally {
    setBusy(false)
  }
}

function setDirection(direction: TranslationDirection): void {
  const labels = getDirectionLabels(direction)
  translationTitle.textContent = labels.title
  translationLead.textContent = direction === 'zh-to-en'
    ? '輸入繁體中文，使用本機 Gemma 4 翻譯成自然英文。'
    : '輸入英文，使用本機 Gemma 4 翻譯成自然繁體中文。'
  sourceLabel.textContent = `${labels.sourceLanguage}內容`
  input.placeholder = labels.placeholder
  resultLabel.textContent = labels.targetLanguage
}

async function loadModelStatus(): Promise<void> {
  const model = await window.api.getModelStatus()
  if (model.exists) {
    modelStatus.textContent = model.runtimeState === 'loading'
      ? `已下載 · 模型載入中 · ${formatBytes(model.size)}`
      : `已下載 · ${formatBytes(model.size)}`
    modelPath.textContent = model.path
    backend.textContent = model.runtimeState === 'ready' ? model.backend.toUpperCase() : '—'
  } else {
    modelStatus.textContent = '尚未下載模型'
    modelPath.textContent = '請從 Setup Wizard 下載 Gemma 4 E2B'
    backend.textContent = '—'
  }
}

function setBusy(busy: boolean): void {
  input.disabled = busy
  translateButton.disabled = busy
  translateButton.textContent = busy ? '翻譯中…' : '翻譯'
}

function setStatus(message: string): void {
  status.textContent = message
  status.hidden = !message
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  return `${bytes} bytes`
}
