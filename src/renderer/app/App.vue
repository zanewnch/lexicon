<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { initializeTheme, setTheme, type ThemeMode } from '../theme'
import { detectTranslationDirection, getDirectionLabels } from '../../shared/translationDirection'
import IeltsWorkspace from './IeltsWorkspace.vue'
import SearchHistoryWorkspace from './SearchHistoryWorkspace.vue'
import YouTubeTranscript from './YouTubeTranscript.vue'
import LearningWorkspace from './LearningWorkspace.vue'
import NewsWorkspace from './NewsWorkspace.vue'
import Settings from '../settings/Settings.vue'

const view = ref<'translate' | 'news' | 'learn' | 'youtube' | 'ielts' | 'history' | 'settings'>('translate')
const drawerOpen = ref(true)
const source = ref('')
const sourceInput = ref<{ focus: () => void } | null>(null)
const result = ref('')
const translationRecordId = ref<number | null>(null)
const savingLearning = ref(false)
const status = ref('')
const busy = ref(false)
const theme = ref<ThemeMode>(initializeTheme())
const model = ref<ModelStatus | null>(null)
const youtubeTranscript = ref<YouTubeTranscript | null>(null)
const learningComplete = ref(false)
const direction = computed(() => detectTranslationDirection(source.value))
const labels = computed(() => getDirectionLabels(direction.value))
const hotkeyLabel = computed(() => window.api.platform === 'darwin' ? '⌘ + Shift + L' : 'Ctrl + Shift + Q')

async function translate(): Promise<void> {
  const text = source.value.trim()
  if (!text) { status.value = '請先輸入要翻譯的內容'; return }
  busy.value = true; result.value = ''; translationRecordId.value = null; status.value = 'Gemma 4 翻譯中…'
  try {
    const response = await window.api.translate(text)
    if (response.ok && response.kind === 'translation') { result.value = response.text; translationRecordId.value = response.translationRecordId; status.value = '' }
    else if (response.ok) status.value = '此查詢結果只能在快捷 popup 顯示'
    else status.value = response.message
  } catch (error) { status.value = error instanceof Error ? error.message : '翻譯失敗，請重試' }
  finally { busy.value = false }
}
async function copy(): Promise<void> { await navigator.clipboard.writeText(result.value); status.value = '已複製翻譯結果' }
async function learnThis(): Promise<void> {
  if (!translationRecordId.value) return
  savingLearning.value = true; status.value = '正在建立你的學習項目…'
  try { await window.api.createLearningFromRecord(translationRecordId.value); status.value = '已加入「我的表達」'; view.value = 'learn' }
  catch (error) { status.value = error instanceof Error ? error.message : '建立學習項目失敗' }
  finally { savingLearning.value = false }
}
async function loadModel(): Promise<void> { model.value = await window.api.getModelStatus() }
function formatBytes(bytes: number): string { return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB` }
function chooseTheme(mode: ThemeMode): void { theme.value = mode; setTheme(mode); void window.api.setSetting('theme', mode) }
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]'))
}
function focusSourceOnEnter(event: KeyboardEvent): void {
  if (view.value !== 'translate' || !sourceInput.value || event.key !== 'Enter' || event.shiftKey || event.isComposing || event.defaultPrevented || busy.value || isInteractiveTarget(event.target)) return
  event.preventDefault()
  sourceInput.value?.focus()
}
async function refreshLearningComplete(): Promise<void> {
  try { learningComplete.value = (await window.api.loadLearningDashboard()).gamification.today.completed }
  catch { learningComplete.value = false }
}
onMounted(() => {
  void window.api.getSetting('theme').then((saved) => {
    if (saved === 'dark' || saved === 'light' || saved === 'system') chooseTheme(saved)
  })
  void loadModel()
  window.api.onModelReady(() => void loadModel())
  window.api.onYouTubeTranscriptOpen((transcript) => { youtubeTranscript.value = transcript; view.value = 'youtube' })
  document.addEventListener('keydown', focusSourceOnEnter)
  window.addEventListener('learning:updated', refreshLearningComplete)
  void refreshLearningComplete()
})
onUnmounted(() => { document.removeEventListener('keydown', focusSourceOnEnter); window.removeEventListener('learning:updated', refreshLearningComplete) })
</script>

<template>
  <q-layout view="hHh Lpr fFf">
    <q-drawer v-model="drawerOpen" :width="248" :mini-width="76" :mini="!drawerOpen" bordered class="lexicon-drawer">
      <q-list padding>
        <q-item class="lexicon-brand-row q-mb-xl"><q-item-section avatar><div class="lexicon-brand">L</div></q-item-section><q-item-section><q-item-label class="lexicon-brand-name">Lexicon</q-item-label><q-item-label caption>Local workspace</q-item-label></q-item-section></q-item>
        <div class="lexicon-nav-label">工作區</div>
        <q-item clickable :active="view === 'translate'" @click="view = 'translate'"><q-item-section avatar><q-icon name="translate" /></q-item-section><q-item-section>翻譯</q-item-section></q-item>
        <q-item clickable :active="view === 'news'" @click="view = 'news'"><q-item-section avatar><q-icon name="newspaper" /></q-item-section><q-item-section>新聞</q-item-section></q-item>
        <q-item clickable :active="view === 'learn'" @click="view = 'learn'"><q-item-section avatar><q-icon :name="learningComplete ? 'check_circle' : 'school'" :color="learningComplete ? 'positive' : undefined" /></q-item-section><q-item-section>今日學習</q-item-section></q-item>
        <q-item clickable :active="view === 'youtube'" @click="view = 'youtube'"><q-item-section avatar><q-icon name="smart_display" /></q-item-section><q-item-section>YouTube</q-item-section></q-item>
        <div class="lexicon-nav-label q-mt-md">英文學習資源</div>
        <q-item clickable :active="view === 'ielts'" @click="view = 'ielts'"><q-item-section avatar><q-icon name="record_voice_over" /></q-item-section><q-item-section>雅思練習</q-item-section></q-item>
        <q-item clickable :active="view === 'history'" @click="view = 'history'"><q-item-section avatar><q-icon name="history" /></q-item-section><q-item-section>搜尋紀錄</q-item-section></q-item>
      </q-list>
      <div class="absolute-bottom q-pa-md lexicon-drawer-footer"><q-item clickable :active="view === 'settings'" @click="view = 'settings'"><q-item-section avatar><q-icon name="settings" /></q-item-section><q-item-section>設定</q-item-section></q-item></div>
    </q-drawer>
    <q-page-container>
      <q-page class="lexicon-page" :class="{ 'lexicon-page-wide': view === 'ielts' }">
        <template v-if="view === 'translate'">
          <div class="lexicon-hero row items-start justify-between q-col-gutter-md"><div><div class="text-overline text-primary">Lexicon · {{ hotkeyLabel }}</div><div class="text-h3">{{ labels.title }}</div><div class="text-body1 lexicon-lead q-mt-sm">{{ direction === 'zh-to-en' ? '輸入繁體中文，使用本機 Gemma 4 翻譯成自然英文。' : '輸入英文，使用本機 Gemma 4 翻譯成自然繁體中文。' }}</div></div><q-badge class="lexicon-local-badge" outline><span></span>Local private</q-badge></div>
          <q-form class="lexicon-translation-panel q-mt-xl" @submit="translate"><div class="lexicon-panel-heading"><span>{{ labels.sourceLanguage }}內容</span><span>{{ source.length }} 字元</span></div><q-input ref="sourceInput" v-model="source" borderless type="textarea" autogrow :placeholder="labels.placeholder" :disable="busy" @keydown.enter.exact.prevent="translate" /><div class="lexicon-panel-footer"><span class="lexicon-muted">Enter 翻譯 · Shift+Enter 換行</span><q-btn unelevated color="primary" :loading="busy" label="翻譯" type="submit" /></div></q-form>
          <div v-if="status" class="q-mt-md" :class="{ 'lexicon-status-error': !busy }">{{ status }}</div>
          <q-card v-if="result" flat class="lexicon-card q-mt-lg"><q-card-section class="row justify-between items-center"><q-badge color="positive" :label="labels.targetLanguage" /><div class="q-gutter-sm"><q-btn flat dense color="primary" label="複製" @click="copy" /><q-btn flat dense color="primary" :loading="savingLearning" label="學這句" @click="learnThis" /></div></q-card-section><q-card-section class="lexicon-result">{{ result }}</q-card-section></q-card>
        </template>
        <NewsWorkspace v-else-if="view === 'news'" />
        <LearningWorkspace v-else-if="view === 'learn'" />
        <YouTubeTranscript v-else-if="view === 'youtube'" :transcript="youtubeTranscript" />
        <IeltsWorkspace v-else-if="view === 'ielts'" />
        <SearchHistoryWorkspace v-else-if="view === 'history'" />
        <Settings v-else />
      </q-page>
    </q-page-container>
    <q-btn round dense flat icon="menu" class="fixed-top-left q-ma-sm" @click="drawerOpen = !drawerOpen" />
  </q-layout>
</template>
