<script setup lang="ts">
import { englishApi } from '@/api/english'
import { EnglishActions, EnglishBadge, EnglishBanner, EnglishButton, EnglishCard, EnglishChip, EnglishChoice, EnglishDialog, EnglishIcon, EnglishInput, EnglishItem, EnglishItemLabel, EnglishItemSection, EnglishList, EnglishProgress, EnglishSection, EnglishTooltip } from '../ui'

import { computed, onMounted, ref } from 'vue'
import type { GamificationDashboard, LearningDashboard, ReviewCard, ReviewFeedback } from '@/types/englishLearning'

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
const abilityStageByItemId = computed(() => new Map(dashboard.value.gamification.abilityMap.map((node) => [node.itemId, node.stage])))
const taskItems = computed(() => dashboard.value.recent.filter((item) => {
  const stage = abilityStageByItemId.value.get(item.id)
  return stage === 'flexible' || stage === 'mastered'
}).slice(0, 3))
const taskUnlocked = computed(() => taskItems.value.length >= 2)
const taskPrompt = computed(() => {
  const tags = new Set(taskItems.value.flatMap((item) => item.tags))
  if (tags.has('工作')) return '請用下列表達寫一則自然、禮貌的英文工作訊息。'
  if (tags.has('IELTS')) return '請用下列表達回答一題 IELTS Speaking 或 Writing 情境。'
  if (tags.has('旅遊')) return '請用下列表達寫一段你在旅行時真的會說或傳出的英文。'
  if (tags.has('聊天')) return '請用下列表達寫一段自然的英文聊天訊息。'
  return '請用下列表達寫一段你自己真的可能使用的英文。'
})
const exerciseLabel = computed(() => activeCard.value?.exerciseType === 'cloze' ? '補上英文核心表達' : activeCard.value?.exerciseType === 'rewrite' ? '換個情境重新表達' : '請用自然英文說出來')
const question = computed(() => {
  if (!activeCard.value) return ''
  if (activeCard.value.exerciseType === 'cloze') return activeCard.value.clozePrompt ?? activeCard.value.targetEn
  if (activeCard.value.exerciseType === 'rewrite') return `請把這個意思改成不同情境也能用的英文：${activeCard.value.promptZh}`
  return activeCard.value.promptZh
})

onMounted(() => void refresh())

async function refresh(): Promise<void> {
  try { dashboard.value = await englishApi.loadLearningDashboard(); window.dispatchEvent(new Event('learning:updated')) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '讀取學習資料失敗' }
}
function start(card: ReviewCard): void { activeCard.value = card; answer.value = ''; feedback.value = null; reviewOperationId.value = crypto.randomUUID(); error.value = '' }
async function submit(): Promise<void> {
  if (!activeCard.value || !answer.value.trim()) return
  busy.value = true; error.value = ''
  try { feedback.value = await englishApi.reviewLearningItem(activeCard.value.id, activeCard.value.exerciseType, answer.value.trim(), reviewOperationId.value); completionOpen.value = Boolean(feedback.value.rewards?.completedJourney); await refresh() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法評估答案' }
  finally { busy.value = false }
}
function next(): void { const card = dashboard.value.due.find((item) => item.id !== activeCard.value?.id); if (card) start(card); else { activeCard.value = null; answer.value = ''; feedback.value = null } }
async function remove(id: number): Promise<void> { await englishApi.deleteLearningItem(id); await refresh() }
async function clearAll(): Promise<void> { if (!window.confirm('確定清除所有翻譯學習資料與複習紀錄？此操作無法復原。')) return; await englishApi.clearLearningData(); activeCard.value = null; await refresh() }
async function submitTask(): Promise<void> {
  if (taskItems.value.length < 2 || !taskAnswer.value.trim()) return
  busy.value = true; error.value = ''
  try { taskFeedback.value = await englishApi.reviewLearningTask(taskItems.value.map((item) => item.id), taskAnswer.value.trim(), taskOperationId.value || (taskOperationId.value = crypto.randomUUID())); completionOpen.value = Boolean(taskFeedback.value.rewards?.completedJourney); await refresh() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法評估任務答案' }
  finally { busy.value = false }
}
function stateLabel(state: string): string { return state === 'new' ? '待熟悉' : state === 'learning' ? '正在變熟' : '已能使用' }
function stageLabel(stage: string): string { return stage === 'saved' ? '已收藏' : stage === 'recalled' ? '能回想' : stage === 'flexible' ? '能變化' : '已能使用' }
function stageColor(stage: string): string { return stage === 'mastered' ? 'amber-8' : stage === 'flexible' ? 'positive' : stage === 'recalled' ? 'primary' : 'grey-6' }
function xpToNext(): number { return 40 + dashboard.value.gamification.profile.level * 10 }
async function updatePreferences(key: 'streakEnabled' | 'reducedMotion', value: boolean): Promise<void> { dashboard.value.gamification = await englishApi.updateLearningPreferences({ [key]: value }) }
</script>

<template>
  <div class="english-ui__row english-ui__items-start english-ui__justify-between english-ui__q-col-gutter-md"><div><div class="english-ui__text-overline english-ui__text-primary">Learning · Local private</div><div class="english-ui__text-h3">今日學習</div><div class="english-ui__text-body1 english-ui__text-grey-5 english-ui__q-mt-sm">從你真的查過的英文開始，練到下次能自己說。</div></div><EnglishButton flat dense color="negative" label="清除學習資料" @click="clearAll" /></div>
  <EnglishCard flat class="english-card english-ui__q-mt-lg gamification-journey" :class="{ 'reduced-motion': dashboard.gamification.profile.reducedMotion }"><EnglishSection>
    <div class="english-ui__row english-ui__items-start english-ui__justify-between"><div><div class="english-ui__text-overline english-ui__text-primary">今日旅程</div><div class="english-ui__text-h6">{{ dashboard.gamification.today.completed ? '今天完成了' : `完成 ${dashboard.gamification.today.requiredUnits} 個小目標就好` }}</div><div class="english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-xs">連續 {{ dashboard.gamification.profile.currentStreak }} 天 · 本週 {{ dashboard.gamification.week.completedDays }} / {{ dashboard.gamification.week.targetDays }} 天 · 保留券 {{ dashboard.gamification.profile.shields }}</div></div><div class="english-ui__text-right"><div class="english-ui__text-subtitle2">Lv. {{ dashboard.gamification.profile.level }} {{ dashboard.gamification.profile.title }}</div><div class="english-ui__text-caption english-ui__text-primary english-ui__q-mt-xs">{{ dashboard.gamification.profile.totalXp }} XP · 下一級 {{ xpToNext() }} XP</div></div></div>
    <EnglishProgress rounded size="8px" class="english-ui__q-mt-md" color="primary" :value="Math.min(1, dashboard.gamification.today.completedUnits / dashboard.gamification.today.requiredUnits)" />
    <EnglishList dense class="english-ui__q-mt-md"><EnglishItem v-for="task in dashboard.gamification.today.tasks" :key="task.kind" class="english-ui__q-px-none"><EnglishItemSection avatar><EnglishIcon :name="task.completed ? 'check_circle' : 'radio_button_unchecked'" :color="task.completed ? 'positive' : 'grey-6'" /></EnglishItemSection><EnglishItemSection>{{ task.label }}</EnglishItemSection><EnglishItemSection side>{{ task.progressCount }} / {{ task.targetCount }}</EnglishItemSection></EnglishItem></EnglishList>
  </EnglishSection></EnglishCard>
  <div class="english-ui__row english-ui__q-col-gutter-sm english-ui__q-mt-lg"><div v-for="stat in [{key:'new',label:'待熟悉'},{key:'learning',label:'正在變熟'},{key:'mastered',label:'已能使用'}]" :key="stat.key" class="english-ui__col-4"><EnglishCard flat class="english-card"><EnglishSection><div class="english-ui__text-caption english-ui__text-grey-5">{{ stat.label }}</div><div class="english-ui__text-h4 english-ui__q-mt-xs">{{ dashboard.counts[stat.key as 'new' | 'learning' | 'mastered'] }}</div></EnglishSection></EnglishCard></div></div>
  <EnglishCard flat class="english-card english-ui__q-mt-md"><EnglishSection><div class="english-ui__text-subtitle1">本週回顧</div><div class="english-ui__row english-ui__q-col-gutter-md english-ui__q-mt-sm"><div class="english-ui__col-4"><div class="english-ui__text-caption english-ui__text-grey-5">新收藏</div><div>{{ dashboard.weekly.saved }}</div></div><div class="english-ui__col-4"><div class="english-ui__text-caption english-ui__text-grey-5">完成複習</div><div>{{ dashboard.weekly.reviewed }}</div></div><div class="english-ui__col-4"><div class="english-ui__text-caption english-ui__text-grey-5">正確回答</div><div>{{ dashboard.weekly.correct }}</div></div></div><div v-if="dashboard.patterns.length" class="english-ui__text-caption english-ui__text-grey-6 english-ui__q-mt-md">最近常卡住：<span v-for="pattern in dashboard.patterns" :key="pattern.expression" class="english-ui__q-mr-sm">{{ pattern.expression }}（{{ pattern.misses }} 次）</span></div></EnglishSection></EnglishCard>

  <EnglishCard v-if="activeCard" flat class="english-card english-ui__q-mt-lg learning-review"><EnglishSection><div class="english-ui__row english-ui__justify-between english-ui__items-center"><EnglishBadge outline color="primary" :label="exerciseLabel" /><EnglishButton flat dense label="離開" @click="activeCard = null" /></div><div class="english-ui__text-overline english-ui__text-grey-5 english-ui__q-mt-lg">情境</div><div class="english-ui__text-h5 english-ui__q-mt-xs">{{ question }}</div><EnglishInput v-model="answer" class="english-ui__q-mt-lg" outlined type="textarea" autogrow label="你的英文答案" :disable="busy || Boolean(feedback)" @keydown.ctrl.enter.prevent="submit" /><div v-if="feedback" class="english-ui__q-mt-lg"><EnglishBanner rounded :class="feedback.communicativeSuccess ? 'english-ui__bg-positive english-ui__text-white' : 'english-ui__bg-orange-2 english-ui__text-dark'"><div class="english-ui__text-subtitle2">{{ feedback.message }}</div><div v-if="feedback.correction" class="english-ui__q-mt-sm">{{ feedback.correction }}</div></EnglishBanner><div v-if="feedback.rewards && (feedback.rewards.xp || feedback.rewards.abilityStage)" class="english-ui__q-mt-md english-ui__text-primary">{{ feedback.rewards.xp ? `+${feedback.rewards.xp} XP` : '' }}<span v-if="feedback.rewards.abilityStage"> · {{ stageLabel(feedback.rewards.abilityStage) }}</span></div><div class="english-ui__text-overline english-ui__text-grey-5 english-ui__q-mt-md">自然說法</div><div class="english-ui__text-body1">{{ feedback.naturalAnswer }}</div><EnglishButton class="english-ui__q-mt-lg" color="primary" label="下一題" @click="next" /></div><EnglishButton v-else class="english-ui__q-mt-md" color="primary" :loading="busy" :disable="!answer.trim()" label="檢查答案" @click="submit" /></EnglishSection></EnglishCard>

  <EnglishCard v-else flat class="english-card english-ui__q-mt-lg"><EnglishSection><div class="english-ui__row english-ui__justify-between english-ui__items-center"><div><div class="english-ui__text-h6">現在要練什麼？</div><div class="english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-xs">每題都從你的翻譯紀錄而來。</div></div><EnglishButton v-if="dashboard.due.length" color="primary" label="開始今天的練習" @click="dashboard.due[0] && start(dashboard.due[0])" /></div><div v-if="!dashboard.due.length" class="english-ui__q-mt-lg english-ui__text-grey-5">目前沒有到期項目。先在翻譯結果按「學這句」，明天就會有第一題。</div></EnglishSection></EnglishCard>

  <EnglishCard v-if="taskItems.length >= 2" flat class="english-card english-ui__q-mt-md"><EnglishSection><div class="english-ui__row english-ui__justify-between english-ui__items-center"><div><div class="english-ui__text-h6">情境任務</div><div class="english-ui__text-caption english-ui__text-grey-5">把已能變化的表達放進一段真的能用的英文。</div></div><EnglishButton v-if="taskUnlocked" flat color="primary" :label="taskOpen ? '收起' : '開始任務'" @click="taskOpen = !taskOpen" /></div><div v-if="taskOpen && taskUnlocked" class="english-ui__q-mt-md"><div>{{ taskPrompt }} 嘗試使用：</div><div class="english-ui__q-gutter-xs english-ui__q-mt-sm"><EnglishBadge v-for="item in taskItems" :key="item.id" outline color="primary" :label="item.focusExpression" /></div><EnglishInput v-model="taskAnswer" class="english-ui__q-mt-md" outlined type="textarea" autogrow label="你的英文訊息" :disable="busy || Boolean(taskFeedback)" /><EnglishButton v-if="!taskFeedback" class="english-ui__q-mt-sm" color="primary" :disable="!taskAnswer.trim()" :loading="busy" label="取得任務回饋" @click="submitTask" /><EnglishBanner v-else rounded class="english-ui__q-mt-md english-ui__bg-blue-1 english-ui__text-dark"><div class="english-ui__text-subtitle2">{{ taskFeedback.message }}</div><div v-if="taskFeedback.correction" class="english-ui__q-mt-sm">{{ taskFeedback.correction }}</div><div class="english-ui__q-mt-sm">{{ taskFeedback.naturalAnswer }}</div><div v-if="taskFeedback.rewards?.xp" class="english-ui__q-mt-sm english-ui__text-primary">+{{ taskFeedback.rewards.xp }} XP</div></EnglishBanner></div></EnglishSection></EnglishCard>

  <EnglishCard v-if="dashboard.gamification.abilityMap.length" flat class="english-card english-ui__q-mt-lg"><EnglishSection><div class="english-ui__text-overline english-ui__text-primary">能力地圖</div><div class="english-ui__text-h6">你正在練成的真實表達</div><div class="english-ui__q-gutter-sm english-ui__q-mt-md"><EnglishChip v-for="node in dashboard.gamification.abilityMap" :key="node.itemId" square :color="stageColor(node.stage)" english-ui__text-color="white" :label="`${node.expression} · ${stageLabel(node.stage)}`" /></div></EnglishSection></EnglishCard>
  <EnglishCard flat class="english-card english-ui__q-mt-md"><EnglishSection><div class="english-ui__row english-ui__justify-between english-ui__items-center"><div><div class="english-ui__text-overline english-ui__text-primary">里程碑</div><div class="english-ui__text-h6">{{ dashboard.gamification.achievements.filter((achievement) => achievement.unlockedAt).length }} / {{ dashboard.gamification.achievements.length }} 枚徽章</div></div><EnglishButton flat dense :label="dashboard.gamification.profile.streakEnabled ? '連續學習：開啟' : '連續學習：關閉'" @click="updatePreferences('streakEnabled', !dashboard.gamification.profile.streakEnabled)" /></div><div class="english-ui__q-gutter-sm english-ui__q-mt-md"><EnglishChip v-for="achievement in dashboard.gamification.achievements" :key="achievement.code" square :outline="!achievement.unlockedAt" :color="achievement.unlockedAt ? 'amber-8' : 'grey-6'" :english-ui__text-color="achievement.unlockedAt ? 'white' : undefined" :label="achievement.title"><EnglishTooltip>{{ achievement.description }}</EnglishTooltip></EnglishChip></div><EnglishChoice class="english-ui__q-mt-md" :model-value="dashboard.gamification.profile.reducedMotion" label="減少進度動畫" @update:model-value="updatePreferences('reducedMotion', $event)" /></EnglishSection></EnglishCard>
  <EnglishDialog v-model="completionOpen"><EnglishCard class="english-card"><EnglishSection><div class="english-ui__text-overline english-ui__text-primary">今天完成了</div><div class="english-ui__text-h5">你又讓自己的英文更靠近能直接使用。</div><div class="english-ui__text-body2 english-ui__text-grey-5 english-ui__q-mt-sm">連續第 {{ dashboard.gamification.profile.currentStreak }} 天 · 今天累積 {{ dashboard.gamification.today.xpEarned }} XP</div></EnglishSection><EnglishActions align="right"><EnglishButton flat color="primary" label="再練一題" @click="completionOpen = false; activeCard = dashboard.due[0] ?? null" /><EnglishButton unelevated color="primary" label="查看今天的進步" @click="completionOpen = false" /></EnglishActions></EnglishCard></EnglishDialog>

  <div class="english-ui__row english-ui__items-center english-ui__justify-between english-ui__q-mt-xl"><div><div class="english-ui__text-overline english-ui__text-primary">My expressions</div><div class="english-ui__text-h5">我的表達</div></div><EnglishChoice v-model="filter" dense unelevated toggle-color="primary" :options="[{label:'全部',value:'all'},{label:'待熟悉',value:'new'},{label:'變熟中',value:'learning'},{label:'已能使用',value:'mastered'}]" /></div>
  <EnglishList bordered separator class="english-ui__q-mt-md rounded-borders"><EnglishItem v-for="item in items" :key="item.id" class="english-ui__q-py-md"><EnglishItemSection><EnglishItemLabel>{{ item.targetEn }}</EnglishItemLabel><EnglishItemLabel caption class="english-ui__q-mt-xs">{{ item.promptZh }}</EnglishItemLabel><div class="english-ui__q-gutter-xs english-ui__q-mt-sm"><EnglishBadge outline color="primary" :label="stateLabel(item.state)" /><EnglishBadge v-for="tag in item.tags" :key="tag" outline color="grey-6" :label="tag" /></div></EnglishItemSection><EnglishItemSection side><EnglishButton flat dense color="negative" icon="delete_outline" @click="remove(item.id)" /></EnglishItemSection></EnglishItem><EnglishItem v-if="!items.length"><EnglishItemSection class="english-ui__text-grey-5">還沒有收藏的表達。</EnglishItemSection></EnglishItem></EnglishList>
  <div v-if="error" class="english-ui__text-negative english-ui__q-mt-md">{{ error }}</div>
</template>
