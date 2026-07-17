<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { initializeTheme, setTheme, type ThemeMode } from '../theme'
const theme = ref<ThemeMode>(initializeTheme())
const backupOnQuit = ref(false)
const backupDirectory = ref('')
const shortcut = ref(window.api.platform === 'darwin' ? 'CommandOrControl+Shift+L' : 'CommandOrControl+Shift+Q')
const shortcutMessage = ref('')
const models = ref<InstalledModel[]>([])
const benchmarks = ref<Record<string, ModelBenchmark>>({})
const benchmarkingFilename = ref<string | null>(null)
const selectedModel = ref('')
const modelMessage = ref('')
const switchingModel = ref(false)
function chooseTheme(mode: ThemeMode): void { theme.value = mode; setTheme(mode) }
async function setBackupOnQuit(enabled: boolean): Promise<void> {
  backupOnQuit.value = enabled
  await window.api.setSetting('backup-on-quit', String(enabled))
}
async function chooseBackupDirectory(): Promise<void> {
  const directory = await window.api.chooseBackupDirectory()
  if (!directory) return
  backupDirectory.value = directory
  await window.api.setSetting('backup-directory', directory)
}
function captureShortcut(event: KeyboardEvent): void {
  event.preventDefault()
  const accelerator = toAccelerator(event)
  if (!accelerator) {
    shortcutMessage.value = '請按住 Ctrl、Alt 或 Command，再按一個按鍵。'
    return
  }
  void window.api.setShortcut(accelerator).then((result) => {
    if (result.ok) {
      shortcut.value = accelerator
      shortcutMessage.value = ''
    } else {
      shortcutMessage.value = result.message
    }
  })
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
    .replace('CommandOrControl', window.api.platform === 'darwin' ? '⌘' : 'Ctrl')
    .replace('Control', 'Ctrl')
    .replaceAll('+', ' + ')
}
function formatBytes(bytes: number): string { return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB` }
async function refreshModels(): Promise<void> {
  models.value = await window.api.listModels()
  benchmarks.value = await window.api.getModelBenchmarks()
}
async function chooseModel(filename: string): Promise<void> {
  if (!filename || filename === selectedModel.value) return
  modelMessage.value = ''
  switchingModel.value = true
  const result = await window.api.selectModel(filename)
  switchingModel.value = false
  if (result.ok) selectedModel.value = filename
  else modelMessage.value = result.message
}
async function openModelDownload(): Promise<void> { await window.api.openModelDownload() }
async function benchmarkModel(model: InstalledModel): Promise<void> {
  benchmarkingFilename.value = model.filename
  modelMessage.value = ''
  try { benchmarks.value = { ...benchmarks.value, [model.filename]: await window.api.benchmarkModel(model.filename) } }
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
onMounted(async () => {
  backupOnQuit.value = (await window.api.getSetting('backup-on-quit')) === 'true'
  backupDirectory.value = (await window.api.getSetting('backup-directory')) ?? ''
  shortcut.value = (await window.api.getSetting('shortcut')) ?? shortcut.value
  await refreshModels()
  selectedModel.value = (await window.api.getSetting('model')) ?? (await window.api.getModelStatus()).filename
})
</script>
<template><div class="lexicon-page"><div class="text-overline text-primary">Lexicon</div><div class="text-h4">設定</div><q-card flat class="lexicon-card q-mt-lg"><q-card-section><div class="text-h6">Appearance</div><div class="text-caption text-grey-5">選擇 Lexicon 的明暗主題，設定會同步套用到所有視窗。</div><q-option-group v-model="theme" :options="[{label:'Dark',value:'dark'},{label:'Light',value:'light'},{label:'System',value:'system'}]" type="radio" inline class="q-mt-md" @update:model-value="chooseTheme" /></q-card-section></q-card><q-card flat class="lexicon-card q-mt-md"><q-card-section><div class="text-h6">模型</div><div class="text-caption text-grey-5">模型會保留在此電腦。效能測試會暫時載入指定模型，完成後回復目前模型。</div><q-select v-model="selectedModel" :options="models.map(model => ({ label: `${model.filename} · ${formatBytes(model.size)}`, value: model.filename }))" emit-value map-options outlined class="q-mt-sm" label="目前模型" :loading="switchingModel" :disable="switchingModel || Boolean(benchmarkingFilename) || !models.length" @update:model-value="chooseModel" /><div v-if="modelMessage" class="text-caption text-negative q-mt-sm">{{ modelMessage }}</div><q-btn outline color="primary" class="q-mt-sm" :disable="Boolean(benchmarkingFilename)" label="下載模型" @click="openModelDownload" /><q-list separator class="q-mt-md"><q-item v-for="model in models" :key="model.filename"><q-item-section><q-item-label>{{ model.filename }}</q-item-label><q-item-label caption>{{ formatBytes(model.size) }}<span v-if="model.filename === selectedModel"> · 目前使用中</span></q-item-label><template v-if="benchmarkFor(model) && benchmarkCurrent(model)"><q-item-label caption class="q-mt-xs"><q-badge outline :color="benchmarkColor(benchmarkFor(model)!)" :label="benchmarkLabel(benchmarkFor(model)!)" /> <template v-if="benchmarkFor(model)!.status === 'success'">{{ benchmarkFor(model)!.backend.toUpperCase() }} · 首次 {{ (benchmarkFor(model)!.firstTokenMs / 1000).toFixed(1) }} 秒 · {{ benchmarkFor(model)!.tokensPerSecond.toFixed(1) }} tok/s</template></q-item-label><q-item-label caption class="q-mt-xs"><template v-if="benchmarkFor(model)!.status === 'success'">{{ benchmarkFor(model)!.recommendation }} · {{ formatDate(benchmarkFor(model)!.completedAt) }}</template><template v-else>{{ benchmarkFor(model)!.message }} · {{ formatDate(benchmarkFor(model)!.completedAt) }}</template></q-item-label></template><q-item-label v-else-if="benchmarkFor(model)" caption class="q-mt-xs text-warning">模型檔案已變更，請重新測試。</q-item-label><q-item-label v-else caption class="q-mt-xs text-grey-5">尚未測試</q-item-label></q-item-section><q-item-section side><q-btn outline color="primary" :loading="benchmarkingFilename === model.filename" :disable="Boolean(benchmarkingFilename) || switchingModel" label="測試效能" @click="benchmarkModel(model)" /></q-item-section></q-item></q-list></q-card-section></q-card><q-card flat class="lexicon-card q-mt-md"><q-card-section><div class="text-h6">資料備份</div><div class="text-caption text-grey-5">結束 Lexicon 時，建立一份完整的 SQLite 資料庫備份。</div><q-checkbox :model-value="backupOnQuit" class="q-mt-sm" label="關閉 App 時自動備份" color="primary" @update:model-value="setBackupOnQuit(Boolean($event))" /><div class="row items-center q-gutter-sm q-mt-sm"><q-btn outline color="primary" label="選擇備份資料夾" @click="chooseBackupDirectory" /><span class="text-caption text-grey-5">{{ backupDirectory || '尚未選擇資料夾' }}</span></div></q-card-section></q-card><q-card flat class="lexicon-card q-mt-md"><q-card-section><div class="text-h6">快捷鍵</div><div class="text-caption text-grey-5">點選欄位後，直接按下想使用的組合鍵。</div><q-input :model-value="displayShortcut(shortcut)" readonly outlined class="q-mt-sm" label="快速開啟翻譯" @keydown="captureShortcut" /><div v-if="shortcutMessage" class="text-caption text-negative q-mt-sm">{{ shortcutMessage }}</div></q-card-section></q-card></div></template>
