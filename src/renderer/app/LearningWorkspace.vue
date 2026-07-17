<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { GamificationDashboard, LearningDashboard, ReviewCard, ReviewFeedback } from '../../shared/learning'

const emptyGamification: GamificationDashboard = {
  profile: { totalXp: 0, level: 1, title: '起步', currentStreak: 0, longestStreak: 0, shields: 0, streakEnabled: true, reducedMotion: false },
  today: { localDate: '', completed: false, requiredUnits: 2, completedUnits: 0, xpEarned: 0, tasks: [] }, week: { completedDays: 0, targetDays: 4 }, abilityMap: [], achievements: []
}
const dashboard = ref<LearningDashboard>({ due: [], recent: [], counts: { new: 0, learning: 0, mastered: 0 }, weekly: { saved: 0, reviewed: 0, correct: 0 }, patterns: [], gamification: emptyGamification })
const activeCard = ref<ReviewCard | null>(null)
const answer = ref('')
const feedback = ref<ReviewFeedback | null>(null)
const busy = ref(false)
const error = ref('')
const filter = ref<'all' | 'new' | 'learning' | 'mastered'>('all')
const taskOpen = ref(false)
const taskAnswer = ref('')
const taskFeedback = ref<Omit<ReviewFeedback, 'nextReviewAt'> | null>(null)
const completionOpen = ref(false)
const reviewOperationId = ref('')
const taskOperationId = ref('')

const items = computed(() => filter.value === 'all' ? dashboard.value.recent : dashboard.value.recent.filter((item) => item.state === filter.value))
const taskItems = computed(() => dashboard.value.recent.slice(0, 3))
const taskUnlocked = computed(() => dashboard.value.gamification.abilityMap.some((node) => node.stage === 'flexible' || node.stage === 'mastered'))
const exerciseLabel = computed(() => activeCard.value?.exerciseType === 'cloze' ? '補上英文核心表達' : activeCard.value?.exerciseType === 'rewrite' ? '換個情境重新表達' : '請用自然英文說出來')
const question = computed(() => {
  if (!activeCard.value) return ''
  if (activeCard.value.exerciseType === 'cloze') return activeCard.value.clozePrompt ?? activeCard.value.targetEn
  if (activeCard.value.exerciseType === 'rewrite') return `請把這個意思改成不同情境也能用的英文：${activeCard.value.promptZh}`
  return activeCard.value.promptZh
})

onMounted(() => void refresh())

async function refresh(): Promise<void> {
  try { dashboard.value = await window.api.loadLearningDashboard(); window.dispatchEvent(new Event('learning:updated')) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '讀取學習資料失敗' }
}
function start(card: ReviewCard): void { activeCard.value = card; answer.value = ''; feedback.value = null; reviewOperationId.value = crypto.randomUUID(); error.value = '' }
async function submit(): Promise<void> {
  if (!activeCard.value || !answer.value.trim()) return
  busy.value = true; error.value = ''
  try { feedback.value = await window.api.reviewLearningItem(activeCard.value.id, activeCard.value.exerciseType, answer.value.trim(), reviewOperationId.value); completionOpen.value = Boolean(feedback.value.rewards?.completedJourney); await refresh() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法評估答案' }
  finally { busy.value = false }
}
function next(): void { const card = dashboard.value.due.find((item) => item.id !== activeCard.value?.id); if (card) start(card); else { activeCard.value = null; answer.value = ''; feedback.value = null } }
async function remove(id: number): Promise<void> { await window.api.deleteLearningItem(id); await refresh() }
async function clearAll(): Promise<void> { if (!window.confirm('確定清除所有翻譯學習資料與複習紀錄？此操作無法復原。')) return; await window.api.clearLearningData(); activeCard.value = null; await refresh() }
async function submitTask(): Promise<void> {
  if (taskItems.value.length < 2 || !taskAnswer.value.trim()) return
  busy.value = true; error.value = ''
  try { taskFeedback.value = await window.api.reviewLearningTask(taskItems.value.map((item) => item.id), taskAnswer.value.trim(), taskOperationId.value || (taskOperationId.value = crypto.randomUUID())); completionOpen.value = Boolean(taskFeedback.value.rewards?.completedJourney); await refresh() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法評估任務答案' }
  finally { busy.value = false }
}
function stateLabel(state: string): string { return state === 'new' ? '待熟悉' : state === 'learning' ? '正在變熟' : '已能使用' }
function stageLabel(stage: string): string { return stage === 'saved' ? '已收藏' : stage === 'recalled' ? '能回想' : stage === 'flexible' ? '能變化' : '已能使用' }
function stageColor(stage: string): string { return stage === 'mastered' ? 'amber-8' : stage === 'flexible' ? 'positive' : stage === 'recalled' ? 'primary' : 'grey-6' }
function xpToNext(): number { return 40 + dashboard.value.gamification.profile.level * 10 }
async function updatePreferences(key: 'streakEnabled' | 'reducedMotion', value: boolean): Promise<void> { dashboard.value.gamification = await window.api.updateLearningPreferences({ [key]: value }) }
</script>

<template>
  <div class="row items-start justify-between q-col-gutter-md"><div><div class="text-overline text-primary">Learning · Local private</div><div class="text-h3">今日學習</div><div class="text-body1 text-grey-5 q-mt-sm">從你真的查過的英文開始，練到下次能自己說。</div></div><q-btn flat dense color="negative" label="清除學習資料" @click="clearAll" /></div>
  <q-card flat class="lexicon-card q-mt-lg gamification-journey" :class="{ 'reduced-motion': dashboard.gamification.profile.reducedMotion }"><q-card-section>
    <div class="row items-start justify-between"><div><div class="text-overline text-primary">今日旅程</div><div class="text-h6">{{ dashboard.gamification.today.completed ? '今天完成了' : `完成 ${dashboard.gamification.today.requiredUnits} 個小目標就好` }}</div><div class="text-caption text-grey-5 q-mt-xs">連續 {{ dashboard.gamification.profile.currentStreak }} 天 · 本週 {{ dashboard.gamification.week.completedDays }} / {{ dashboard.gamification.week.targetDays }} 天 · 保留券 {{ dashboard.gamification.profile.shields }}</div></div><div class="text-right"><div class="text-subtitle2">Lv. {{ dashboard.gamification.profile.level }} {{ dashboard.gamification.profile.title }}</div><div class="text-caption text-primary q-mt-xs">{{ dashboard.gamification.profile.totalXp }} XP · 下一級 {{ xpToNext() }} XP</div></div></div>
    <q-linear-progress rounded size="8px" class="q-mt-md" color="primary" :value="Math.min(1, dashboard.gamification.today.completedUnits / dashboard.gamification.today.requiredUnits)" />
    <q-list dense class="q-mt-md"><q-item v-for="task in dashboard.gamification.today.tasks" :key="task.kind" class="q-px-none"><q-item-section avatar><q-icon :name="task.completed ? 'check_circle' : 'radio_button_unchecked'" :color="task.completed ? 'positive' : 'grey-6'" /></q-item-section><q-item-section>{{ task.label }}</q-item-section><q-item-section side>{{ task.progressCount }} / {{ task.targetCount }}</q-item-section></q-item></q-list>
  </q-card-section></q-card>
  <div class="row q-col-gutter-sm q-mt-lg"><div v-for="stat in [{key:'new',label:'待熟悉'},{key:'learning',label:'正在變熟'},{key:'mastered',label:'已能使用'}]" :key="stat.key" class="col-4"><q-card flat class="lexicon-card"><q-card-section><div class="text-caption text-grey-5">{{ stat.label }}</div><div class="text-h4 q-mt-xs">{{ dashboard.counts[stat.key as 'new' | 'learning' | 'mastered'] }}</div></q-card-section></q-card></div></div>
  <q-card flat class="lexicon-card q-mt-md"><q-card-section><div class="text-subtitle1">本週回顧</div><div class="row q-col-gutter-md q-mt-sm"><div class="col-4"><div class="text-caption text-grey-5">新收藏</div><div>{{ dashboard.weekly.saved }}</div></div><div class="col-4"><div class="text-caption text-grey-5">完成複習</div><div>{{ dashboard.weekly.reviewed }}</div></div><div class="col-4"><div class="text-caption text-grey-5">正確回答</div><div>{{ dashboard.weekly.correct }}</div></div></div><div v-if="dashboard.patterns.length" class="text-caption text-grey-6 q-mt-md">最近常卡住：<span v-for="pattern in dashboard.patterns" :key="pattern.expression" class="q-mr-sm">{{ pattern.expression }}（{{ pattern.misses }} 次）</span></div></q-card-section></q-card>

  <q-card v-if="activeCard" flat class="lexicon-card q-mt-lg learning-review"><q-card-section><div class="row justify-between items-center"><q-badge outline color="primary" :label="exerciseLabel" /><q-btn flat dense label="離開" @click="activeCard = null" /></div><div class="text-overline text-grey-5 q-mt-lg">情境</div><div class="text-h5 q-mt-xs">{{ question }}</div><q-input v-model="answer" class="q-mt-lg" outlined type="textarea" autogrow label="你的英文答案" :disable="busy || Boolean(feedback)" @keydown.ctrl.enter.prevent="submit" /><div v-if="feedback" class="q-mt-lg"><q-banner rounded :class="feedback.communicativeSuccess ? 'bg-positive text-white' : 'bg-orange-2 text-dark'"><div class="text-subtitle2">{{ feedback.message }}</div><div v-if="feedback.correction" class="q-mt-sm">{{ feedback.correction }}</div></q-banner><div v-if="feedback.rewards && (feedback.rewards.xp || feedback.rewards.abilityStage)" class="q-mt-md text-primary">{{ feedback.rewards.xp ? `+${feedback.rewards.xp} XP` : '' }}<span v-if="feedback.rewards.abilityStage"> · {{ stageLabel(feedback.rewards.abilityStage) }}</span></div><div class="text-overline text-grey-5 q-mt-md">自然說法</div><div class="text-body1">{{ feedback.naturalAnswer }}</div><q-btn class="q-mt-lg" color="primary" label="下一題" @click="next" /></div><q-btn v-else class="q-mt-md" color="primary" :loading="busy" :disable="!answer.trim()" label="檢查答案" @click="submit" /></q-card-section></q-card>

  <q-card v-else flat class="lexicon-card q-mt-lg"><q-card-section><div class="row justify-between items-center"><div><div class="text-h6">現在要練什麼？</div><div class="text-caption text-grey-5 q-mt-xs">每題都從你的翻譯紀錄而來。</div></div><q-btn v-if="dashboard.due.length" color="primary" label="開始今天的練習" @click="start(dashboard.due[0])" /></div><div v-if="!dashboard.due.length" class="q-mt-lg text-grey-5">目前沒有到期項目。先在翻譯結果按「學這句」，明天就會有第一題。</div></q-card-section></q-card>

  <q-card v-if="taskItems.length >= 2" flat class="lexicon-card q-mt-md"><q-card-section><div class="row justify-between items-center"><div><div class="text-h6">情境任務</div><div class="text-caption text-grey-5">把多個已學表達寫進一則真的能用的訊息。</div></div><q-btn v-if="taskUnlocked" flat color="primary" :label="taskOpen ? '收起' : '開始任務'" @click="taskOpen = !taskOpen" /><q-badge v-else outline color="grey-6" label="完成第一個「能變化」後解鎖" /></div><div v-if="taskOpen && taskUnlocked" class="q-mt-md"><div>請寫一則英文工作訊息，詢問進度並保持禮貌。嘗試使用：</div><div class="q-gutter-xs q-mt-sm"><q-badge v-for="item in taskItems" :key="item.id" outline color="primary" :label="item.focusExpression" /></div><q-input v-model="taskAnswer" class="q-mt-md" outlined type="textarea" autogrow label="你的英文訊息" :disable="busy || Boolean(taskFeedback)" /><q-btn v-if="!taskFeedback" class="q-mt-sm" color="primary" :disable="!taskAnswer.trim()" :loading="busy" label="取得任務回饋" @click="submitTask" /><q-banner v-else rounded class="q-mt-md bg-blue-1 text-dark"><div class="text-subtitle2">{{ taskFeedback.message }}</div><div v-if="taskFeedback.correction" class="q-mt-sm">{{ taskFeedback.correction }}</div><div class="q-mt-sm">{{ taskFeedback.naturalAnswer }}</div><div v-if="taskFeedback.rewards?.xp" class="q-mt-sm text-primary">+{{ taskFeedback.rewards.xp }} XP</div></q-banner></div></q-card-section></q-card>

  <q-card v-if="dashboard.gamification.abilityMap.length" flat class="lexicon-card q-mt-lg"><q-card-section><div class="text-overline text-primary">能力地圖</div><div class="text-h6">你正在練成的真實表達</div><div class="q-gutter-sm q-mt-md"><q-chip v-for="node in dashboard.gamification.abilityMap" :key="node.itemId" square :color="stageColor(node.stage)" text-color="white" :label="`${node.expression} · ${stageLabel(node.stage)}`" /></div></q-card-section></q-card>
  <q-card flat class="lexicon-card q-mt-md"><q-card-section><div class="row justify-between items-center"><div><div class="text-overline text-primary">里程碑</div><div class="text-h6">{{ dashboard.gamification.achievements.filter((achievement) => achievement.unlockedAt).length }} / {{ dashboard.gamification.achievements.length }} 枚徽章</div></div><q-btn flat dense :label="dashboard.gamification.profile.streakEnabled ? '連續學習：開啟' : '連續學習：關閉'" @click="updatePreferences('streakEnabled', !dashboard.gamification.profile.streakEnabled)" /></div><div class="q-gutter-sm q-mt-md"><q-chip v-for="achievement in dashboard.gamification.achievements" :key="achievement.code" square :outline="!achievement.unlockedAt" :color="achievement.unlockedAt ? 'amber-8' : 'grey-6'" :text-color="achievement.unlockedAt ? 'white' : undefined" :label="achievement.title"><q-tooltip>{{ achievement.description }}</q-tooltip></q-chip></div><q-toggle class="q-mt-md" :model-value="dashboard.gamification.profile.reducedMotion" label="減少進度動畫" @update:model-value="updatePreferences('reducedMotion', $event)" /></q-card-section></q-card>
  <q-dialog v-model="completionOpen"><q-card class="lexicon-card"><q-card-section><div class="text-overline text-primary">今天完成了</div><div class="text-h5">你又讓自己的英文更靠近能直接使用。</div><div class="text-body2 text-grey-5 q-mt-sm">連續第 {{ dashboard.gamification.profile.currentStreak }} 天 · 今天累積 {{ dashboard.gamification.today.xpEarned }} XP</div></q-card-section><q-card-actions align="right"><q-btn flat color="primary" label="再練一題" v-close-popup @click="activeCard = dashboard.due[0] ?? null" /><q-btn unelevated color="primary" label="查看今天的進步" v-close-popup /></q-card-actions></q-card></q-dialog>

  <div class="row items-center justify-between q-mt-xl"><div><div class="text-overline text-primary">My expressions</div><div class="text-h5">我的表達</div></div><q-btn-toggle v-model="filter" dense unelevated toggle-color="primary" :options="[{label:'全部',value:'all'},{label:'待熟悉',value:'new'},{label:'變熟中',value:'learning'},{label:'已能使用',value:'mastered'}]" /></div>
  <q-list bordered separator class="q-mt-md rounded-borders"><q-item v-for="item in items" :key="item.id" class="q-py-md"><q-item-section><q-item-label>{{ item.targetEn }}</q-item-label><q-item-label caption class="q-mt-xs">{{ item.promptZh }}</q-item-label><div class="q-gutter-xs q-mt-sm"><q-badge outline color="primary" :label="stateLabel(item.state)" /><q-badge v-for="tag in item.tags" :key="tag" outline color="grey-6" :label="tag" /></div></q-item-section><q-item-section side><q-btn flat dense color="negative" icon="delete_outline" @click="remove(item.id)" /></q-item-section></q-item><q-item v-if="!items.length"><q-item-section class="text-grey-5">還沒有收藏的表達。</q-item-section></q-item></q-list>
  <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>
</template>
