<script setup lang="ts">
import { englishApi } from '@/api/english'
import { EnglishActions, EnglishButton, EnglishCard, EnglishChoice, EnglishInput, EnglishProgress, EnglishSection, EnglishSelect, EnglishSeparator } from '../ui'
import type { HuggingFaceGgufFile, HuggingFaceModel } from '@/types/english'

import { onUnmounted, ref } from 'vue'




const emit = defineEmits<{ completed: []; close: [] }>()
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
  { label: 'Hy-MT2 1.8B Q4 — 翻譯專用候選 · 約 1.13 GB', value: 'hy-mt2-1.8b-q4' },
  { label: 'Qwen 3.5 4B Q4 — 通用多語言模型 · 約 2.52 GB', value: 'qwen-3.5-4b-q4' },
  { label: 'Llama 3.2 3B — 替代選擇 · 約 2 GB', value: 'llama-3.2-3b' },
  { label: 'Llama 3.1 8B — 較佳品質 · 建議 8 GB 以上記憶體 · 約 5 GB', value: 'llama-3.1-8b' }
]
const unsubs = [
  englishApi.onDownloadProgress(({ received, total, percent: value }) => {
    percent.value = value
    progressLabel.value = total ? `${value}% · ${formatBytes(received)} / ${formatBytes(total)}` : `${formatBytes(received)} 已下載`
  }),
  englishApi.onDownloadState(() => { progressLabel.value = '正在驗證 SHA256…' }),
  englishApi.onModelReady(() => { if (downloading.value) { downloading.value = false; emit('completed') } })
]
function formatBytes(bytes: number): string { return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB` }
function useCurated(): void { customUrl.value = ''; selectedRepository.value = ''; selectedFile.value = '' }
function useCustom(): void { choice.value = ''; selectedRepository.value = ''; selectedFile.value = '' }
async function searchModels(): Promise<void> {
  const query = searchQuery.value.trim()
  if (query.length < 2) { message.value = '請至少輸入 2 個字元'; return }
  searching.value = true; message.value = ''; searchResults.value = []; files.value = []; selectedRepository.value = ''; selectedFile.value = ''
  try { searchResults.value = await englishApi.searchHuggingFaceModels(query) }
  catch (error) { message.value = error instanceof Error ? error.message : 'Hugging Face 搜尋失敗' }
  finally { searching.value = false }
}
async function loadGgufFiles(repository: string): Promise<void> {
  if (!repository) return
  choice.value = ''; customUrl.value = ''; selectedFile.value = ''; files.value = []; loadingFiles.value = true; message.value = ''
  try { files.value = await englishApi.listHuggingFaceGgufFiles(repository) }
  catch (error) { message.value = error instanceof Error ? error.message : '無法讀取 GGUF 檔案' }
  finally { loadingFiles.value = false }
}
async function download(): Promise<void> {
  const url = customUrl.value.trim()
  if (url && (!/^https:\/\/.+\.gguf(?:$|[?#])/i.test(url))) { message.value = '請輸入 HTTPS 的 .gguf 直連網址'; return }
  if (!url && !selectedFile.value && !choice.value) { message.value = '請選擇模型、GGUF 檔案或輸入自訂網址'; return }
  downloading.value = true; message.value = ''; percent.value = 0; progressLabel.value = '正在連線到 Hugging Face…'
  try {
  const response = await englishApi.downloadModel(url
    ? { kind: 'custom', url }
    : selectedFile.value ? { kind: 'huggingface', repository: selectedRepository.value, filename: selectedFile.value } : { kind: 'curated', id: choice.value })
  if (!response.ok) { message.value = response.message; downloading.value = false }
  else { downloading.value = false; emit('completed') }
  } catch (error) { message.value = error instanceof Error ? error.message : '下載失敗'; downloading.value = false }
}
onUnmounted(() => unsubs.forEach((unsubscribe) => unsubscribe()))
</script>

<template><div class="english-page"><div class="english-ui__text-overline english-ui__text-primary">Unus</div><div class="english-ui__text-h4">下載模型</div><EnglishCard flat class="english-card english-ui__q-mt-lg"><EnglishSection v-if="!downloading"><div class="english-ui__text-body2 english-ui__text-grey-5">可直接搜尋 Hugging Face 的公開 GGUF 模型。透過搜尋下載的檔案會校驗 SHA256。</div><div class="english-ui__row english-ui__q-gutter-sm english-ui__q-mt-md"><EnglishInput v-model="searchQuery" outlined dense class="english-ui__col" label="搜尋 Hugging Face 模型" @keyup.enter="searchModels" /><EnglishButton outline color="primary" label="搜尋" :loading="searching" @click="searchModels" /></div><EnglishSelect v-if="searchResults.length" v-model="selectedRepository" :options="searchResults.map(model => ({ label: `${model.id} · ${model.downloads.toLocaleString()} downloads`, value: model.id }))" emit-value map-options outlined dense class="english-ui__q-mt-sm" label="搜尋結果" @update:model-value="loadGgufFiles" /><EnglishSelect v-if="selectedRepository" v-model="selectedFile" :options="files.map(file => ({ label: `${file.filename} · ${formatBytes(file.size)}`, value: file.filename }))" emit-value map-options outlined dense class="english-ui__q-mt-sm" label="選擇 GGUF quantization" :loading="loadingFiles" :disable="loadingFiles || !files.length" /><EnglishSeparator class="english-ui__q-my-md" /><div class="english-ui__text-caption english-ui__text-grey-5">快速推薦</div><EnglishChoice v-model="choice" :options="options" type="radio" class="english-ui__q-mt-sm" @update:model-value="useCurated" /><div class="english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-md">或輸入自訂 HTTPS .gguf 直連網址（不做 SHA256 校驗）</div><EnglishInput v-model="customUrl" outlined dense class="english-ui__q-mt-xs" placeholder="https://huggingface.co/.../model.gguf" @update:model-value="useCustom" /><div v-if="message" class="english-ui__text-negative english-ui__text-caption english-ui__q-mt-sm">{{ message }}</div></EnglishSection><EnglishSection v-else><EnglishProgress rounded size="10px" :value="percent / 100" color="primary" /><div class="english-muted english-ui__q-mt-sm">{{ progressLabel }}</div><div v-if="message" class="english-ui__text-negative english-ui__text-caption english-ui__q-mt-sm">{{ message }}</div></EnglishSection><EnglishActions align="right"><EnglishButton flat label="取消" :disable="downloading" @click="emit('close')" /><EnglishButton v-if="!downloading" color="primary" label="下載並使用" @click="download" /></EnglishActions></EnglishCard></div></template>
