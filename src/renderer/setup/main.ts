import '../shared.css'
import { initializeTheme } from '../theme'

initializeTheme()

const downloadButton = document.querySelector<HTMLButtonElement>('#download-button')!
const laterButton = document.querySelector<HTMLButtonElement>('#later-button')!
const progressBar = document.querySelector<HTMLDivElement>('#progress-bar')!
const progressLabel = document.querySelector<HTMLParagraphElement>('#progress-label')!
const setupStatus = document.querySelector<HTMLParagraphElement>('#setup-status')!
const badge = document.querySelector<HTMLSpanElement>('#model-badge')!

downloadButton.addEventListener('click', () => {
  void download()
})

laterButton.addEventListener('click', () => window.api.closeSetup())

window.api.onDownloadProgress(({ received, total, percent }) => {
  progressBar.style.width = `${percent}%`
  progressLabel.textContent = `${percent}% · ${formatBytes(received)} / ${formatBytes(total)}`
  badge.textContent = '下載中'
  badge.className = 'badge badge-progress'
})

window.api.onDownloadState((state) => {
  if (state === 'verifying') {
    downloadButton.disabled = true
    progressLabel.textContent = '正在驗證 SHA256…'
    badge.textContent = '驗證中'
    badge.className = 'badge badge-progress'
  }
})

window.api.onModelReady(() => {
  downloadButton.disabled = true
  laterButton.disabled = true
  progressBar.style.width = '100%'
  progressLabel.textContent = '模型已載入，可以按 Ctrl+1 開始翻譯'
  setupStatus.textContent = ''
  badge.textContent = '已就緒'
  badge.className = 'badge badge-ready'
})

window.api.onSetupError((message) => {
  setError(message)
  downloadButton.disabled = false
})

void loadStatus()

async function loadStatus(): Promise<void> {
  const model = await window.api.getModelStatus()
  if (model.exists) {
    badge.textContent = '載入中'
    badge.className = 'badge badge-progress'
    progressBar.style.width = '100%'
    progressLabel.textContent = '模型已下載，正在載入…'
    downloadButton.disabled = true
  }
}

async function download(): Promise<void> {
  downloadButton.disabled = true
  laterButton.disabled = true
  setupStatus.textContent = ''
  progressLabel.textContent = '正在連線到 Hugging Face…'

  const response = await window.api.downloadModel()
  if (!response.ok) {
    setError(response.message)
    downloadButton.disabled = false
    laterButton.disabled = false
  }
}

function setError(message: string): void {
  setupStatus.textContent = message
  setupStatus.className = 'status-message status-error'
  badge.textContent = '下載失敗'
  badge.className = 'badge badge-error'
  progressLabel.textContent = '可以按 Retry 重新下載'
  downloadButton.textContent = '重新下載'
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  return `${bytes} bytes`
}
