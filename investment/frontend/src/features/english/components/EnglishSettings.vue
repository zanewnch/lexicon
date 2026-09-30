<script setup lang="ts">
import { englishApi, initializeEnglishApi } from '@/api/english'
import { EnglishButton, EnglishCard, EnglishChoice, EnglishInput, EnglishItem, EnglishItemLabel, EnglishItemSection, EnglishList, EnglishSection, EnglishSelect } from '../ui'
import type { InstalledModel, ModelBenchmark, ModelBenchmarkRating } from '@/types/english'

import { onMounted, ref } from 'vue'


import ModelDownload from './ModelDownload.vue'
import { onUnmounted } from 'vue'
const downloadOpen = ref(new URLSearchParams(location.search).get('download') === '1')
function openDownload() { downloadOpen.value = true }
onMounted(() => window.addEventListener('english:open-model-download', openDownload))
onUnmounted(() => window.removeEventListener('english:open-model-download', openDownload))
const backupOnQuit = ref(false)
const backupDirectory = ref('')
const shortcut = ref(englishApi.platform === 'darwin' ? 'CommandOrControl+Shift+L' : 'CommandOrControl+Shift+Q')
const shortcutMessage = ref('')
const models = ref<InstalledModel[]>([])
const benchmarks = ref<Record<string, ModelBenchmark>>({})
const benchmarkingFilename = ref<string | null>(null)
const selectedModel = ref('')
const modelMessage = ref('')
const switchingModel = ref(false)
async function setBackupOnQuit(enabled: boolean): Promise<void> {
  try {
    await englishApi.setSetting('backup-on-quit', String(enabled))
    backupOnQuit.value = enabled
  } catch (error) { modelMessage.value = error instanceof Error ? error.message : '備份設定未保存' }
}
async function chooseBackupDirectory(): Promise<void> {
  try {
    const directory = await englishApi.chooseBackupDirectory()
    if (!directory) return
    await englishApi.setSetting('backup-directory', directory)
    backupDirectory.value = directory
  } catch (error) { modelMessage.value = error instanceof Error ? error.message : '備份資料夾未保存' }
}
function captureShortcut(event: KeyboardEvent): void {
  event.preventDefault()
  const accelerator = toAccelerator(event)
  if (!accelerator) {
    shortcutMessage.value = '請按住 Ctrl、Alt 或 Command，再按一個按鍵。'
    return
  }
  void englishApi.setShortcut(accelerator).then((result) => {
    if (result.ok) {
      shortcut.value = accelerator
      shortcutMessage.value = ''
    } else {
      shortcutMessage.value = result.message
    }
  }).catch((error) => { shortcutMessage.value = error instanceof Error ? error.message : '快捷鍵未保存' })
}
function toAccelerator(event: KeyboardEvent): string | undefined {
  const key = acceleratorKey(event.code)
  if (!key || !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) return undefined
  const modifiers = [
    event.metaKey ? 'CommandOrControl' : '',
    event.ctrlKey ? 'Control' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : ''
  ].filter(Boolean)
  return [...modifiers, key].join('+')
}
function acceleratorKey(code: string): string | undefined {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^F[1-9][0-9]?$/.test(code)) return code
  return ({ Space: 'Space', Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right' } as Record<string, string>)[code]
}
function displayShortcut(value: string): string {
  return value
    .replace('CommandOrControl', englishApi.platform === 'darwin' ? '⌘' : 'Ctrl')
    .replace('Control', 'Ctrl')
    .split('+').join(' + ')
}
function formatBytes(bytes: number): string { return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB` }
async function refreshModels(): Promise<void> {
  models.value = await englishApi.listModels()
  benchmarks.value = await englishApi.getModelBenchmarks()
  selectedModel.value = (await englishApi.getSetting('model')) ?? (await englishApi.getModelStatus()).filename
}
async function chooseModel(filename: string): Promise<void> {
  if (!filename || filename === selectedModel.value) return
  modelMessage.value = ''
  switchingModel.value = true
  try {
    const result = await englishApi.selectModel(filename)
    if (result.ok) selectedModel.value = filename
    else modelMessage.value = result.message
  } catch (error) { modelMessage.value = error instanceof Error ? error.message : '模型切換失敗' }
  finally { switchingModel.value = false }
}
async function openModelDownload(): Promise<void> { downloadOpen.value = !downloadOpen.value }
async function benchmarkModel(model: InstalledModel): Promise<void> {
  benchmarkingFilename.value = model.filename
  modelMessage.value = ''
  try { benchmarks.value = { ...benchmarks.value, [model.filename]: await englishApi.benchmarkModel(model.filename) } }
  catch (error) { modelMessage.value = error instanceof Error ? error.message : '模型效能測試失敗' }
  finally { benchmarkingFilename.value = null }
}
function benchmarkFor(model: InstalledModel): ModelBenchmark | undefined { return benchmarks.value[model.filename] }
function benchmarkCurrent(model: InstalledModel): boolean {
  const benchmark = benchmarkFor(model)
  return Boolean(benchmark && benchmark.size === model.size && benchmark.modifiedAt === model.modifiedAt)
}
function benchmarkLabel(benchmark: ModelBenchmark): string {
  if (benchmark.status === 'failed') return '測試失敗'
  return ({ smooth: '順暢', usable: '可用', strained: '吃力', 'not-recommended': '不建議' } as Record<ModelBenchmarkRating, string>)[benchmark.rating]
}
function benchmarkColor(benchmark: ModelBenchmark): string {
  if (benchmark.status === 'failed' || benchmark.rating === 'not-recommended') return 'negative'
  return benchmark.rating === 'strained' ? 'warning' : benchmark.rating === 'usable' ? 'primary' : 'positive'
}
function formatDate(value: string): string { return new Date(value).toLocaleString() }
function benchmarkText(model: InstalledModel): string {
  const benchmark = benchmarkFor(model)
  if (!benchmark) return '尚未測試'
  if (!benchmarkCurrent(model)) return '模型檔案已變更，請重新測試。'
  if (benchmark.status === 'failed') return benchmark.message
  return `${benchmarkLabel(benchmark)} · ${benchmark.backend.toUpperCase()} · 首次 ${(benchmark.firstTokenMs / 1000).toFixed(1)} 秒 · ${benchmark.tokensPerSecond.toFixed(1)} tok/s · ${benchmark.recommendation}`
}
onMounted(async () => {
  try {
    await initializeEnglishApi()
    backupOnQuit.value = (await englishApi.getSetting('backup-on-quit')) === 'true'
    backupDirectory.value = (await englishApi.getSetting('backup-directory')) ?? ''
    shortcut.value = (await englishApi.getSetting('shortcut')) ?? (englishApi.platform === 'darwin' ? 'CommandOrControl+Shift+L' : 'CommandOrControl+Shift+Q')
    await refreshModels()
    selectedModel.value = (await englishApi.getSetting('model')) ?? (await englishApi.getModelStatus()).filename
  } catch (error) { modelMessage.value = error instanceof Error ? error.message : '英文服務未連線' }
})
</script>
<template>
  <div class="english-settings">
    <p v-if="modelMessage" class="english-ui__text-negative" role="status">{{ modelMessage }}</p>
    <EnglishCard><EnglishSection>
      <h2 class="english-ui__text-h6">本機模型</h2>
      <p class="english-ui__text-grey-5 english-ui__q-mt-sm">模型保留在這台電腦；桌面與瀏覽器共用同一份模型。</p>
      <EnglishSelect :model-value="selectedModel" :options="models.map(model => ({ label: `${model.filename} · ${formatBytes(model.size)}`, value: model.filename }))" class="english-ui__q-mt-md" label="目前模型" :loading="switchingModel" :disable="switchingModel || Boolean(benchmarkingFilename) || !models.length" @update:model-value="chooseModel" />
      <EnglishButton outline class="english-ui__q-mt-md" label="下載模型" :disable="Boolean(benchmarkingFilename)" @click="openModelDownload" />
      <EnglishList class="english-ui__q-mt-md"><EnglishItem v-for="model in models" :key="model.filename"><EnglishItemSection><EnglishItemLabel>{{ model.filename }}</EnglishItemLabel><EnglishItemLabel caption>{{ formatBytes(model.size) }}{{ model.filename === selectedModel ? ' · 使用中' : '' }}</EnglishItemLabel><EnglishItemLabel caption>{{ benchmarkText(model) }}</EnglishItemLabel></EnglishItemSection><EnglishItemSection side><EnglishButton outline :loading="benchmarkingFilename === model.filename" :disable="Boolean(benchmarkingFilename) || switchingModel" label="測試效能" @click="benchmarkModel(model)" /></EnglishItemSection></EnglishItem></EnglishList>
    </EnglishSection></EnglishCard>
    <ModelDownload v-if="downloadOpen" class="english-ui__q-mt-lg" @completed="refreshModels(); downloadOpen = false" @close="downloadOpen = false" />
    <EnglishCard class="english-ui__q-mt-lg"><EnglishSection>
      <h2 class="english-ui__text-h6">資料備份</h2><p class="english-ui__text-grey-5 english-ui__q-mt-sm">結束 Unus 時，備份英文資料與投資資料（含本機交易設定）到所選資料夾。</p>
      <EnglishChoice :model-value="backupOnQuit" class="english-ui__q-mt-md" label="關閉 App 時自動備份" @update:model-value="setBackupOnQuit(Boolean($event))" />
      <div class="english-ui__row english-ui__items-center english-ui__q-gutter-sm english-ui__q-mt-md"><EnglishButton outline label="選擇備份資料夾" @click="chooseBackupDirectory" /><span>{{ backupDirectory || '尚未選擇資料夾' }}</span></div>
    </EnglishSection></EnglishCard>
    <EnglishCard class="english-ui__q-mt-lg"><EnglishSection>
      <h2 class="english-ui__text-h6">快捷鍵</h2><p class="english-ui__text-grey-5 english-ui__q-mt-sm">點選欄位後按下組合鍵，會更新這台電腦的快速翻譯快捷鍵。</p>
      <EnglishInput :model-value="displayShortcut(shortcut)" readonly class="english-ui__q-mt-md" label="快速開啟翻譯" @keydown="captureShortcut" /><p v-if="shortcutMessage" class="english-ui__text-negative">{{ shortcutMessage }}</p>
    </EnglishSection></EnglishCard>
  </div>
</template>
