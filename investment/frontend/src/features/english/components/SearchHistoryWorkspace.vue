<script setup lang="ts">
import { englishApi } from '@/api/english'
import { EnglishBadge, EnglishButton, EnglishCard, EnglishInput, EnglishItem, EnglishItemLabel, EnglishItemSection, EnglishList, EnglishSection, EnglishSeparator } from '../ui'
import type { TranslationHistoryRecord } from '@/types/english'

import { computed, onMounted, ref } from 'vue'

const records = ref<TranslationHistoryRecord[]>([])
const query = ref('')
const loading = ref(false)
const selectedId = ref<number | null>(null)
const savingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const savedIds = ref(new Set<number>())
const status = ref('')

const filteredRecords = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return records.value
  return records.value.filter((record) => [record.sourceText, record.translatedText].some((value) => value.toLowerCase().includes(needle)))
})
const selectedRecord = computed(() => filteredRecords.value.find((record) => record.id === selectedId.value) ?? filteredRecords.value[0])

async function loadHistory(): Promise<void> {
  loading.value = true
  try {
    records.value = await englishApi.listTranslationHistory()
    if (!selectedId.value) selectedId.value = records.value[0]?.id ?? null
  } finally { loading.value = false }
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
function directionLabel(direction: TranslationHistoryRecord['direction']): string { return direction === 'zh-to-en' ? '中 → 英' : '英 → 中' }
async function learnSelectedRecord(): Promise<void> {
  if (!selectedRecord.value || savedIds.value.has(selectedRecord.value.id)) return
  savingId.value = selectedRecord.value.id
  status.value = ''
  try {
    await englishApi.createLearningFromRecord(selectedRecord.value.id)
    savedIds.value = new Set([...savedIds.value, selectedRecord.value.id])
    status.value = '已加入今日學習，完成複習可累積 XP。'
  } catch (error) {
    status.value = error instanceof Error ? error.message : '建立學習項目失敗'
  } finally { savingId.value = null }
}

async function deleteSelectedRecord(): Promise<void> {
  if (!selectedRecord.value || deletingId.value) return
  if (!window.confirm('刪除這筆翻譯嗎？若它已加入學習，也會一併刪除該學習項目與作答紀錄。此操作無法復原。')) return
  const recordId = selectedRecord.value.id
  deletingId.value = recordId
  status.value = ''
  try {
    await englishApi.deleteTranslationHistoryRecord(recordId)
    records.value = records.value.filter((record) => record.id !== recordId)
    savedIds.value = new Set([...savedIds.value].filter((id) => id !== recordId))
    selectedId.value = records.value[0]?.id ?? null
    status.value = '已刪除翻譯與相關學習資料。'
  } catch (error) {
    status.value = error instanceof Error ? error.message : '刪除翻譯紀錄失敗'
  } finally { deletingId.value = null }
}

onMounted(() => void loadHistory())
</script>

<template>
  <div class="english-ui__text-overline english-ui__text-primary">English learning · Search history</div>
  <div class="english-ui__row english-ui__items-start english-ui__justify-between english-ui__q-col-gutter-md"><div><div class="english-ui__text-h3">搜尋紀錄</div><div class="english-ui__text-body1 english-ui__text-grey-5 english-ui__q-mt-sm">保留你翻譯過的內容，方便回頭找詞句、再次學習。</div></div><EnglishButton flat color="primary" icon="refresh" label="重新整理" :loading="loading" @click="loadHistory" /></div>

  <div class="english-ui__row english-ui__q-col-gutter-md english-ui__q-mt-lg">
    <div class="english-ui__col-12 english-ui__col-md-5"><EnglishCard flat class="english-card"><EnglishSection><EnglishInput v-model="query" dense outlined clearable label="搜尋紀錄" placeholder="輸入原文或翻譯內容" /></EnglishSection><EnglishSeparator /><EnglishList separator class="ielts-topic-list"><EnglishItem v-for="record in filteredRecords" :key="record.id" clickable :active="record.id === selectedRecord?.id" active-class="ielts-topic-active" @click="selectedId = record.id"><EnglishItemSection><EnglishItemLabel lines="1">{{ record.sourceText }}</EnglishItemLabel><EnglishItemLabel caption>{{ directionLabel(record.direction) }} · {{ formatDate(record.createdAt) }}</EnglishItemLabel></EnglishItemSection></EnglishItem><EnglishItem v-if="!loading && !filteredRecords.length"><EnglishItemSection class="english-ui__text-grey-5">尚無符合條件的搜尋紀錄。</EnglishItemSection></EnglishItem></EnglishList></EnglishCard></div>
    <div class="english-ui__col-12 english-ui__col-md-7"><EnglishCard flat class="english-card ielts-detail-card"><EnglishSection v-if="selectedRecord"><div class="english-ui__row english-ui__justify-between english-ui__items-center"><EnglishBadge outline color="primary" :label="directionLabel(selectedRecord.direction)" /><div class="english-ui__text-caption english-ui__text-grey-5">{{ formatDate(selectedRecord.createdAt) }}</div></div><div class="english-ui__text-overline english-ui__text-grey-5 english-ui__q-mt-xl">原文</div><div class="english-ui__text-h6 english-ui__q-mt-sm history-text">{{ selectedRecord.sourceText }}</div><div class="english-ui__text-overline english-ui__text-grey-5 english-ui__q-mt-xl">翻譯</div><div class="english-ui__text-h6 english-ui__q-mt-sm history-text">{{ selectedRecord.translatedText }}</div><div class="english-ui__q-gutter-sm english-ui__q-mt-lg"><EnglishButton color="primary" :loading="savingId === selectedRecord.id" :disable="savedIds.has(selectedRecord.id)" :label="savedIds.has(selectedRecord.id) ? '已加入今日學習' : '把這句加入學習'" @click="learnSelectedRecord" /><EnglishButton flat color="negative" :loading="deletingId === selectedRecord.id" label="刪除這筆翻譯" @click="deleteSelectedRecord" /></div><div v-if="status" class="english-ui__text-caption english-ui__q-mt-sm" :class="status.includes('已加入') || status.includes('已刪除') ? 'english-ui__text-positive' : 'english-ui__text-negative'">{{ status }}</div></EnglishSection><EnglishSection v-else class="english-ui__text-grey-5">選擇一筆搜尋紀錄後，可查看完整內容。</EnglishSection></EnglishCard></div>
  </div>
</template>
