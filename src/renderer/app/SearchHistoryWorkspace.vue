<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const records = ref<TranslationHistoryRecord[]>([])
const query = ref('')
const loading = ref(false)
const selectedId = ref<number | null>(null)

const filteredRecords = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return records.value
  return records.value.filter((record) => [record.sourceText, record.translatedText].some((value) => value.toLowerCase().includes(needle)))
})
const selectedRecord = computed(() => filteredRecords.value.find((record) => record.id === selectedId.value) ?? filteredRecords.value[0])

async function loadHistory(): Promise<void> {
  loading.value = true
  try {
    records.value = await window.api.listTranslationHistory()
    if (!selectedId.value) selectedId.value = records.value[0]?.id ?? null
  } finally { loading.value = false }
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
function directionLabel(direction: TranslationHistoryRecord['direction']): string { return direction === 'zh-to-en' ? '中 → 英' : '英 → 中' }

onMounted(() => void loadHistory())
</script>

<template>
  <div class="text-overline text-primary">English learning · Search history</div>
  <div class="row items-start justify-between q-col-gutter-md"><div><div class="text-h3">搜尋紀錄</div><div class="text-body1 text-grey-5 q-mt-sm">保留你翻譯過的內容，方便回頭找詞句、再次學習。</div></div><q-btn flat color="primary" icon="refresh" label="重新整理" :loading="loading" @click="loadHistory" /></div>

  <div class="row q-col-gutter-md q-mt-lg">
    <div class="col-12 col-md-5"><q-card flat class="lexicon-card"><q-card-section><q-input v-model="query" dense outlined clearable label="搜尋紀錄" placeholder="輸入原文或翻譯內容" /></q-card-section><q-separator /><q-list separator class="ielts-topic-list"><q-item v-for="record in filteredRecords" :key="record.id" clickable :active="record.id === selectedRecord?.id" active-class="ielts-topic-active" @click="selectedId = record.id"><q-item-section><q-item-label lines="1">{{ record.sourceText }}</q-item-label><q-item-label caption>{{ directionLabel(record.direction) }} · {{ formatDate(record.createdAt) }}</q-item-label></q-item-section></q-item><q-item v-if="!loading && !filteredRecords.length"><q-item-section class="text-grey-5">尚無符合條件的搜尋紀錄。</q-item-section></q-item></q-list></q-card></div>
    <div class="col-12 col-md-7"><q-card flat class="lexicon-card ielts-detail-card"><q-card-section v-if="selectedRecord"><div class="row justify-between items-center"><q-badge outline color="primary" :label="directionLabel(selectedRecord.direction)" /><div class="text-caption text-grey-5">{{ formatDate(selectedRecord.createdAt) }}</div></div><div class="text-overline text-grey-5 q-mt-xl">原文</div><div class="text-h6 q-mt-sm history-text">{{ selectedRecord.sourceText }}</div><div class="text-overline text-grey-5 q-mt-xl">翻譯</div><div class="text-h6 q-mt-sm history-text">{{ selectedRecord.translatedText }}</div></q-card-section><q-card-section v-else class="text-grey-5">選擇一筆搜尋紀錄後，可查看完整內容。</q-card-section></q-card></div>
  </div>
</template>
