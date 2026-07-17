<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { LearningDashboard, ReviewCard, ReviewFeedback } from '../../shared/learning'

const dashboard = ref<LearningDashboard>({ due: [], recent: [], counts: { new: 0, learning: 0, mastered: 0 }, weekly: { saved: 0, reviewed: 0, correct: 0 }, patterns: [] })
const activeCard = ref<ReviewCard | null>(null)
const answer = ref('')
const feedback = ref<ReviewFeedback | null>(null)
const busy = ref(false)
const error = ref('')
const filter = ref<'all' | 'new' | 'learning' | 'mastered'>('all')
const taskOpen = ref(false)
const taskAnswer = ref('')
const taskFeedback = ref<Omit<ReviewFeedback, 'nextReviewAt'> | null>(null)

const items = computed(() => filter.value === 'all' ? dashboard.value.recent : dashboard.value.recent.filter((item) => item.state === filter.value))
const taskItems = computed(() => dashboard.value.recent.slice(0, 3))
const exerciseLabel = computed(() => activeCard.value?.exerciseType === 'cloze' ? '補上英文核心表達' : activeCard.value?.exerciseType === 'rewrite' ? '換個情境重新表達' : '請用自然英文說出來')
const question = computed(() => {
  if (!activeCard.value) return ''
  if (activeCard.value.exerciseType === 'cloze') return activeCard.value.clozePrompt ?? activeCard.value.targetEn
  if (activeCard.value.exerciseType === 'rewrite') return `請把這個意思改成不同情境也能用的英文：${activeCard.value.promptZh}`
  return activeCard.value.promptZh
})

onMounted(() => void refresh())

async function refresh(): Promise<void> {
  try { dashboard.value = await window.api.loadLearningDashboard() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '讀取學習資料失敗' }
}
function start(card: ReviewCard): void { activeCard.value = card; answer.value = ''; feedback.value = null; error.value = '' }
async function submit(): Promise<void> {
  if (!activeCard.value || !answer.value.trim()) return
  busy.value = true; error.value = ''
  try { feedback.value = await window.api.reviewLearningItem(activeCard.value.id, activeCard.value.exerciseType, answer.value.trim()); await refresh() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法評估答案' }
  finally { busy.value = false }
}
function next(): void { const card = dashboard.value.due.find((item) => item.id !== activeCard.value?.id); activeCard.value = card ?? null; answer.value = ''; feedback.value = null }
async function remove(id: number): Promise<void> { await window.api.deleteLearningItem(id); await refresh() }
async function clearAll(): Promise<void> { if (!window.confirm('確定清除所有翻譯學習資料與複習紀錄？此操作無法復原。')) return; await window.api.clearLearningData(); activeCard.value = null; await refresh() }
async function submitTask(): Promise<void> {
  if (taskItems.value.length < 2 || !taskAnswer.value.trim()) return
  busy.value = true; error.value = ''
  try { taskFeedback.value = await window.api.reviewLearningTask(taskItems.value.map((item) => item.id), taskAnswer.value.trim()) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法評估任務答案' }
  finally { busy.value = false }
}
function stateLabel(state: string): string { return state === 'new' ? '待熟悉' : state === 'learning' ? '正在變熟' : '已能使用' }
</script>

<template>
  <div class="row items-start justify-between q-col-gutter-md"><div><div class="text-overline text-primary">Learning · Local private</div><div class="text-h3">今日學習</div><div class="text-body1 text-grey-5 q-mt-sm">從你真的查過的英文開始，練到下次能自己說。</div></div><q-btn flat dense color="negative" label="清除學習資料" @click="clearAll" /></div>
  <div class="row q-col-gutter-sm q-mt-lg"><div v-for="stat in [{key:'new',label:'待熟悉'},{key:'learning',label:'正在變熟'},{key:'mastered',label:'已能使用'}]" :key="stat.key" class="col-4"><q-card flat class="lexicon-card"><q-card-section><div class="text-caption text-grey-5">{{ stat.label }}</div><div class="text-h4 q-mt-xs">{{ dashboard.counts[stat.key as 'new' | 'learning' | 'mastered'] }}</div></q-card-section></q-card></div></div>
  <q-card flat class="lexicon-card q-mt-md"><q-card-section><div class="text-subtitle1">本週回顧</div><div class="row q-col-gutter-md q-mt-sm"><div class="col-4"><div class="text-caption text-grey-5">新收藏</div><div>{{ dashboard.weekly.saved }}</div></div><div class="col-4"><div class="text-caption text-grey-5">完成複習</div><div>{{ dashboard.weekly.reviewed }}</div></div><div class="col-4"><div class="text-caption text-grey-5">正確回答</div><div>{{ dashboard.weekly.correct }}</div></div></div><div v-if="dashboard.patterns.length" class="text-caption text-grey-6 q-mt-md">最近常卡住：<span v-for="pattern in dashboard.patterns" :key="pattern.expression" class="q-mr-sm">{{ pattern.expression }}（{{ pattern.misses }} 次）</span></div></q-card-section></q-card>

  <q-card v-if="activeCard" flat class="lexicon-card q-mt-lg learning-review"><q-card-section><div class="row justify-between items-center"><q-badge outline color="primary" :label="exerciseLabel" /><q-btn flat dense label="離開" @click="activeCard = null" /></div><div class="text-overline text-grey-5 q-mt-lg">情境</div><div class="text-h5 q-mt-xs">{{ question }}</div><q-input v-model="answer" class="q-mt-lg" outlined type="textarea" autogrow label="你的英文答案" :disable="busy || Boolean(feedback)" @keydown.ctrl.enter.prevent="submit" /><div v-if="feedback" class="q-mt-lg"><q-banner rounded :class="feedback.communicativeSuccess ? 'bg-positive text-white' : 'bg-orange-2 text-dark'"><div class="text-subtitle2">{{ feedback.message }}</div><div v-if="feedback.correction" class="q-mt-sm">{{ feedback.correction }}</div></q-banner><div class="text-overline text-grey-5 q-mt-md">自然說法</div><div class="text-body1">{{ feedback.naturalAnswer }}</div><q-btn class="q-mt-lg" color="primary" label="下一題" @click="next" /></div><q-btn v-else class="q-mt-md" color="primary" :loading="busy" :disable="!answer.trim()" label="檢查答案" @click="submit" /></q-card-section></q-card>

  <q-card v-else flat class="lexicon-card q-mt-lg"><q-card-section><div class="row justify-between items-center"><div><div class="text-h6">現在要練什麼？</div><div class="text-caption text-grey-5 q-mt-xs">每題都從你的翻譯紀錄而來。</div></div><q-btn v-if="dashboard.due.length" color="primary" label="開始今天的練習" @click="start(dashboard.due[0])" /></div><div v-if="!dashboard.due.length" class="q-mt-lg text-grey-5">目前沒有到期項目。先在翻譯結果按「學這句」，明天就會有第一題。</div></q-card-section></q-card>

  <q-card v-if="taskItems.length >= 2" flat class="lexicon-card q-mt-md"><q-card-section><div class="row justify-between items-center"><div><div class="text-h6">情境任務</div><div class="text-caption text-grey-5">把多個已學表達寫進一則真的能用的訊息。</div></div><q-btn flat color="primary" :label="taskOpen ? '收起' : '開始任務'" @click="taskOpen = !taskOpen" /></div><div v-if="taskOpen" class="q-mt-md"><div>請寫一則英文工作訊息，詢問進度並保持禮貌。嘗試使用：</div><div class="q-gutter-xs q-mt-sm"><q-badge v-for="item in taskItems" :key="item.id" outline color="primary" :label="item.focusExpression" /></div><q-input v-model="taskAnswer" class="q-mt-md" outlined type="textarea" autogrow label="你的英文訊息" :disable="busy || Boolean(taskFeedback)" /><q-btn v-if="!taskFeedback" class="q-mt-sm" color="primary" :disable="!taskAnswer.trim()" :loading="busy" label="取得任務回饋" @click="submitTask" /><q-banner v-else rounded class="q-mt-md bg-blue-1 text-dark"><div class="text-subtitle2">{{ taskFeedback.message }}</div><div v-if="taskFeedback.correction" class="q-mt-sm">{{ taskFeedback.correction }}</div><div class="q-mt-sm">{{ taskFeedback.naturalAnswer }}</div></q-banner></div></q-card-section></q-card>

  <div class="row items-center justify-between q-mt-xl"><div><div class="text-overline text-primary">My expressions</div><div class="text-h5">我的表達</div></div><q-btn-toggle v-model="filter" dense unelevated toggle-color="primary" :options="[{label:'全部',value:'all'},{label:'待熟悉',value:'new'},{label:'變熟中',value:'learning'},{label:'已能使用',value:'mastered'}]" /></div>
  <q-list bordered separator class="q-mt-md rounded-borders"><q-item v-for="item in items" :key="item.id" class="q-py-md"><q-item-section><q-item-label>{{ item.targetEn }}</q-item-label><q-item-label caption class="q-mt-xs">{{ item.promptZh }}</q-item-label><div class="q-gutter-xs q-mt-sm"><q-badge outline color="primary" :label="stateLabel(item.state)" /><q-badge v-for="tag in item.tags" :key="tag" outline color="grey-6" :label="tag" /></div></q-item-section><q-item-section side><q-btn flat dense color="negative" icon="delete_outline" @click="remove(item.id)" /></q-item-section></q-item><q-item v-if="!items.length"><q-item-section class="text-grey-5">還沒有收藏的表達。</q-item-section></q-item></q-list>
  <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>
</template>
