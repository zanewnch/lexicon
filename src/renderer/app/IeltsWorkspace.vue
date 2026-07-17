<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import materials from './ielts/data/speaking-topics.json'

type SpeakingTopic = {
  id: string
  part: 'part_1' | 'part_2_3'
  part_label: string
  category: string
  category_label: string
  topic_name: string
  question_count: number
  sample_question: string
  recent_exam_count: number
  learner_count: string
  time_tag: string
  is_new: boolean
  priority: string
}
type StudyDirection = { id: number; title: string; focus: string; status: 'planning' | 'active' | 'done' }

const topics = materials.topics as SpeakingTopic[]
const priorities = ['New and high frequency', 'High frequency', 'New topic', 'Regular practice']
const query = ref('')
const part = ref('all')
const category = ref('all')
const priority = ref('all')
const newOnly = ref(false)
const selectedId = ref(topics[0]?.id ?? '')
const notes = ref('')
const directionTitle = ref('')
const directionFocus = ref('')
const directions = ref<StudyDirection[]>([])
const workspaceLoaded = ref(false)
const learningTopic = ref(false)
const learningStatus = ref('')
let notesTimer: number | undefined
let directionsTimer: number | undefined

const categories = computed(() => [...new Map(topics.map((topic) => [topic.category, topic.category_label])).entries()].sort((a, b) => a[1].localeCompare(b[1])))
const filteredTopics = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return topics.filter((topic) => (!needle || [topic.topic_name, topic.sample_question, topic.category_label].some((value) => value.toLowerCase().includes(needle)))
    && (part.value === 'all' || topic.part === part.value)
    && (category.value === 'all' || topic.category === category.value)
    && (priority.value === 'all' || topic.priority === priority.value)
    && (!newOnly.value || topic.is_new))
})
const selectedTopic = computed(() => filteredTopics.value.find((topic) => topic.id === selectedId.value) ?? filteredTopics.value[0])
const partOneCount = computed(() => filteredTopics.value.filter((topic) => topic.part === 'part_1').length)
const partTwoCount = computed(() => filteredTopics.value.filter((topic) => topic.part === 'part_2_3').length)
const newCount = computed(() => filteredTopics.value.filter((topic) => topic.is_new).length)
const partOptions = [{ label: '所有 Part', value: 'all' }, { label: 'Part 1', value: 'part_1' }, { label: 'Part 2/3', value: 'part_2_3' }]
const categoryOptions = computed(() => [{ label: '所有分類', value: 'all' }, ...categories.value.map(([value, label]) => ({ label, value }))])
const priorityOptions = [{ label: '所有優先度', value: 'all' }, ...priorities.filter((value) => topics.some((topic) => topic.priority === value)).map((value) => ({ label: value, value }))]

watch(filteredTopics, (visible) => { if (!visible.some((topic) => topic.id === selectedId.value)) selectedId.value = visible[0]?.id ?? '' })
watch(notes, (value) => {
  if (!workspaceLoaded.value) return
  if (notesTimer) clearTimeout(notesTimer)
  notesTimer = window.setTimeout(() => void window.api.saveIeltsNotes(value), 400)
})
watch(directions, (value) => {
  if (!workspaceLoaded.value) return
  if (directionsTimer) clearTimeout(directionsTimer)
  directionsTimer = window.setTimeout(() => void window.api.saveIeltsDirections(value), 400)
}, { deep: true })

onMounted(async () => {
  const workspace = await window.api.loadIeltsWorkspace({
    notes: readStorage('lexicon.ielts.notes'),
    directions: readDirections()
  })
  notes.value = workspace.notes
  directions.value = workspace.directions
  workspaceLoaded.value = true
})
onBeforeUnmount(() => {
  if (notesTimer) clearTimeout(notesTimer)
  if (directionsTimer) clearTimeout(directionsTimer)
})

function addDirection(): void {
  const title = directionTitle.value.trim()
  const focus = directionFocus.value.trim()
  if (!title && !focus) return
  directions.value.unshift({ id: Date.now(), title: title || '未命名方向', focus: focus || '先記下想法，之後再補上具體練習方式。', status: 'planning' })
  directionTitle.value = ''
  directionFocus.value = ''
}
function removeDirection(id: number): void { directions.value = directions.value.filter((direction) => direction.id !== id) }
function statusLabel(status: StudyDirection['status']): string { return status === 'active' ? '進行中' : status === 'done' ? '已完成' : '規劃中' }
function readDirections(): StudyDirection[] {
  try { const stored = JSON.parse(readStorage('lexicon.ielts.directions')) as unknown; if (Array.isArray(stored)) return stored as StudyDirection[] } catch { /* fall through */ }
  return [
    { id: 1, title: '建立 IELTS Speaking 自學節奏', focus: '每天固定選 1 個題目，先寫關鍵字，再錄音回答，最後補強句型和詞彙。', status: 'active' },
    { id: 2, title: '整理常用答案素材', focus: '把人物、地點、經驗、喜好、困難、改變等素材做成可重複使用的答案庫。', status: 'planning' },
    { id: 3, title: '追蹤弱點', focus: '每次練習後只記 1 到 2 個最需要改的地方，例如停頓、時態、連接詞或發音。', status: 'planning' }
  ]
}
function readStorage(key: string): string { try { return localStorage.getItem(key) ?? '' } catch { return '' } }
async function learnSelectedQuestion(): Promise<void> {
  if (!selectedTopic.value) return
  learningTopic.value = true; learningStatus.value = ''
  try {
    const translation = await window.api.translate(selectedTopic.value.sample_question)
    if (!translation.ok || translation.kind !== 'translation') throw new Error(translation.ok ? '此題無法建立學習項目' : translation.message)
    await window.api.createLearningFromRecord(translation.translationRecordId)
    learningStatus.value = '題目已加入我的表達，可到「今日學習」練習。'
  } catch (error) { learningStatus.value = error instanceof Error ? error.message : '建立學習項目失敗' }
  finally { learningTopic.value = false }
}
</script>

<template>
  <div class="text-overline text-primary">IELTS Speaking · Personal study workspace</div>
  <div class="row items-start justify-between q-col-gutter-md"><div><div class="text-h3">Speaking 題庫</div><div class="text-body1 text-grey-5 q-mt-sm">從近期題目開始，留下可重複使用的練習方向。</div></div><q-badge color="positive" outline label="106 topics" /></div>

  <div class="row q-col-gutter-sm q-mt-lg">
    <div v-for="stat in [{ label: '目前題目', value: filteredTopics.length }, { label: 'Part 1', value: partOneCount }, { label: 'Part 2/3', value: partTwoCount }, { label: '新題', value: newCount }]" :key="stat.label" class="col-6 col-sm-3"><q-card flat class="lexicon-card"><q-card-section><div class="text-caption text-grey-5">{{ stat.label }}</div><div class="text-h5 q-mt-xs">{{ stat.value }}</div></q-card-section></q-card></div>
  </div>

  <div class="row q-col-gutter-md q-mt-md">
    <div class="col-12 col-md-5"><q-card flat class="lexicon-card"><q-card-section class="q-gutter-sm"><q-input v-model="query" dense outlined label="搜尋題目" placeholder="Topic、question、category" clearable /><div class="row q-col-gutter-sm"><div class="col-6"><q-select v-model="part" dense outlined emit-value map-options :options="partOptions" label="Part" /></div><div class="col-6"><q-select v-model="category" dense outlined emit-value map-options :options="categoryOptions" label="分類" /></div><div class="col-12"><q-select v-model="priority" dense outlined emit-value map-options :options="priorityOptions" label="優先度" /></div></div><q-checkbox v-model="newOnly" dense label="只看新題" color="primary" /></q-card-section><q-separator /><q-list class="ielts-topic-list" separator><q-item v-for="topic in filteredTopics" :key="topic.id" clickable :active="topic.id === selectedTopic?.id" active-class="ielts-topic-active" @click="selectedId = topic.id"><q-item-section><q-item-label caption>{{ topic.part_label }} · {{ topic.category_label }}</q-item-label><q-item-label>{{ topic.topic_name }}</q-item-label><q-item-label caption>{{ topic.is_new ? 'New · ' : '' }}{{ topic.priority }}</q-item-label></q-item-section></q-item><q-item v-if="!filteredTopics.length"><q-item-section class="text-grey-5">沒有符合目前篩選條件的題目。</q-item-section></q-item></q-list></q-card></div>
    <div class="col-12 col-md-7"><q-card flat class="lexicon-card ielts-detail-card"><q-card-section v-if="selectedTopic"><div class="text-overline text-primary">{{ selectedTopic.part_label }} · {{ selectedTopic.category_label }}</div><div class="text-h4 q-mt-xs">{{ selectedTopic.topic_name }}</div><div class="q-gutter-xs q-mt-sm"><q-badge outline color="primary" :label="selectedTopic.priority" /><q-badge v-if="selectedTopic.is_new" color="positive" outline label="New topic" /></div><div class="text-overline text-grey-5 q-mt-xl">Sample question</div><div class="text-h6 q-mt-sm ielts-question">{{ selectedTopic.sample_question }}</div><q-btn class="q-mt-md" flat dense color="primary" :loading="learningTopic" label="翻譯並學這句" @click="learnSelectedQuestion" /><div v-if="learningStatus" class="text-caption q-mt-sm" :class="learningStatus.includes('已加入') ? 'text-positive' : 'text-negative'">{{ learningStatus }}</div><div class="row q-col-gutter-md q-mt-lg"><div class="col-6"><div class="text-caption text-grey-5">Recent exam reports</div><div>{{ selectedTopic.recent_exam_count }}</div></div><div class="col-6"><div class="text-caption text-grey-5">Questions</div><div>{{ selectedTopic.question_count }}</div></div><div class="col-6"><div class="text-caption text-grey-5">Season</div><div>{{ selectedTopic.time_tag || 'Unknown' }}</div></div><div class="col-6"><div class="text-caption text-grey-5">Learners</div><div>{{ selectedTopic.learner_count || '—' }}</div></div></div></q-card-section><q-card-section v-else class="text-grey-5">沒有符合目前篩選條件的題目。</q-card-section></q-card></div>
  </div>

  <div class="text-overline text-primary q-mt-xl">Self-study workspace</div><div class="text-h5 q-mt-xs">設計方向</div>
  <div class="row q-col-gutter-md q-mt-md"><div class="col-12 col-md-7"><q-card flat class="lexicon-card"><q-card-section><q-input v-model="notes" outlined type="textarea" autogrow label="即時紀錄" placeholder="想練什麼、卡在哪裡、今天的目標…" /><div class="text-caption text-grey-5 q-mt-sm">會自動儲存在這台電腦。</div></q-card-section></q-card></div><div class="col-12 col-md-5"><q-card flat class="lexicon-card"><q-card-section class="q-gutter-md"><q-input v-model="directionTitle" dense outlined label="方向名稱" placeholder="例如：Part 2 故事素材" /><q-input v-model="directionFocus" outlined type="textarea" autogrow label="練習重點" placeholder="下一步要補什麼？" /><q-btn color="primary" label="加入方向" @click="addDirection" /></q-card-section></q-card></div></div>
  <q-card v-for="direction in directions" :key="direction.id" flat class="lexicon-card q-mt-sm"><q-card-section class="row justify-between no-wrap q-gutter-md"><div><q-badge :color="direction.status === 'active' ? 'positive' : 'primary'" outline :label="statusLabel(direction.status)" /><div class="text-subtitle1 q-mt-sm">{{ direction.title }}</div><div class="text-body2 text-grey-5 q-mt-xs">{{ direction.focus }}</div></div><q-btn flat dense color="primary" label="刪除" @click="removeDirection(direction.id)" /></q-card-section></q-card>
</template>
