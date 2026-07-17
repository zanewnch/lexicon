<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { initializeTheme } from '../theme'

initializeTheme()

const choice = ref('gemma-4-e2b')
const customUrl = ref('')
const searchQuery = ref('')
const searchResults = ref<HuggingFaceModel[]>([])
const selectedRepository = ref('')
const files = ref<HuggingFaceGgufFile[]>([])
const selectedFile = ref('')
const searching = ref(false)
const loadingFiles = ref(false)
const downloading = ref(false)
const percent = ref(0)
const progressLabel = ref('選擇模型後開始下載')
const message = ref('')
const options = [
  { label: 'Gemma 4 E2B — 建議使用 · 較快 · 約 2.29 GB', value: 'gemma-4-e2b' },
  { label: 'Llama 3.2 3B — 替代選擇 · 約 2 GB', value: 'llama-3.2-3b' },
  { label: 'Llama 3.1 8B — 較佳品質 · 建議 8 GB 以上記憶體 · 約 5 GB', value: 'llama-3.1-8b' }
]
const unsubs = [
  window.api.onDownloadProgress(({ received, total, percent: value }) => {
    percent.value = value
    progressLabel.value = total ? `${value}% · ${formatBytes(received)} / ${formatBytes(total)}` : `${formatBytes(received)} 已下載`
  }),
  window.api.onDownloadState(() => { progressLabel.value = '正在驗證 SHA256…' }),
  window.api.onModelReady(() => { if (downloading.value) window.close() })
]
function formatBytes(bytes: number): string { return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB` }
function useCurated(): void { customUrl.value = ''; selectedRepository.value = ''; selectedFile.value = '' }
function useCustom(): void { choice.value = ''; selectedRepository.value = ''; selectedFile.value = '' }
async function searchModels(): Promise<void> {
  const query = searchQuery.value.trim()
  if (query.length < 2) { message.value = '請至少輸入 2 個字元'; return }
  searching.value = true; message.value = ''; searchResults.value = []; files.value = []; selectedRepository.value = ''; selectedFile.value = ''
  try { searchResults.value = await window.api.searchHuggingFaceModels(query) }
  catch (error) { message.value = error instanceof Error ? error.message : 'Hugging Face 搜尋失敗' }
  finally { searching.value = false }
}
async function loadGgufFiles(repository: string): Promise<void> {
  if (!repository) return
  choice.value = ''; customUrl.value = ''; selectedFile.value = ''; files.value = []; loadingFiles.value = true; message.value = ''
  try { files.value = await window.api.listHuggingFaceGgufFiles(repository) }
  catch (error) { message.value = error instanceof Error ? error.message : '無法讀取 GGUF 檔案' }
  finally { loadingFiles.value = false }
}
async function download(): Promise<void> {
  const url = customUrl.value.trim()
  if (url && (!/^https:\/\/.+\.gguf(?:$|[?#])/i.test(url))) { message.value = '請輸入 HTTPS 的 .gguf 直連網址'; return }
  if (!url && !selectedFile.value && !choice.value) { message.value = '請選擇模型、GGUF 檔案或輸入自訂網址'; return }
  downloading.value = true; message.value = ''; percent.value = 0; progressLabel.value = '正在連線到 Hugging Face…'
  const response = await window.api.downloadModel(url
    ? { kind: 'custom', url }
    : selectedFile.value ? { kind: 'huggingface', repository: selectedRepository.value, filename: selectedFile.value } : { kind: 'curated', id: choice.value })
  if (!response.ok) { message.value = response.message; downloading.value = false }
}
onUnmounted(() => unsubs.forEach((unsubscribe) => unsubscribe()))
</script>

<template><div class="lexicon-page"><div class="text-overline text-primary">Lexicon</div><div class="text-h4">下載模型</div><q-card flat class="lexicon-card q-mt-lg"><q-card-section v-if="!downloading"><div class="text-body2 text-grey-5">可直接搜尋 Hugging Face 的公開 GGUF 模型。透過搜尋下載的檔案會校驗 SHA256。</div><div class="row q-gutter-sm q-mt-md"><q-input v-model="searchQuery" outlined dense class="col" label="搜尋 Hugging Face 模型" @keyup.enter="searchModels" /><q-btn outline color="primary" label="搜尋" :loading="searching" @click="searchModels" /></div><q-select v-if="searchResults.length" v-model="selectedRepository" :options="searchResults.map(model => ({ label: `${model.id} · ${model.downloads.toLocaleString()} downloads`, value: model.id }))" emit-value map-options outlined dense class="q-mt-sm" label="搜尋結果" @update:model-value="loadGgufFiles" /><q-select v-if="selectedRepository" v-model="selectedFile" :options="files.map(file => ({ label: `${file.filename} · ${formatBytes(file.size)}`, value: file.filename }))" emit-value map-options outlined dense class="q-mt-sm" label="選擇 GGUF quantization" :loading="loadingFiles" :disable="loadingFiles || !files.length" /><q-separator class="q-my-md" /><div class="text-caption text-grey-5">快速推薦</div><q-option-group v-model="choice" :options="options" type="radio" class="q-mt-sm" @update:model-value="useCurated" /><div class="text-caption text-grey-5 q-mt-md">或輸入自訂 HTTPS .gguf 直連網址（不做 SHA256 校驗）</div><q-input v-model="customUrl" outlined dense class="q-mt-xs" placeholder="https://huggingface.co/.../model.gguf" @update:model-value="useCustom" /><div v-if="message" class="text-negative text-caption q-mt-sm">{{ message }}</div></q-card-section><q-card-section v-else><q-linear-progress rounded size="10px" :value="percent / 100" color="primary" /><div class="lexicon-muted q-mt-sm">{{ progressLabel }}</div><div v-if="message" class="text-negative text-caption q-mt-sm">{{ message }}</div></q-card-section><q-card-actions align="right"><q-btn flat label="取消" :disable="downloading" @click="window.close()" /><q-btn v-if="!downloading" color="primary" label="下載並使用" @click="download" /></q-card-actions></q-card></div></template>
