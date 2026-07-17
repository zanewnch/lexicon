<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const query = ref('')
const articles = ref<NewsArticle[]>([])
const loading = ref(false)
const status = ref('')
const selected = ref<NewsArticle | null>(null)
const summary = ref('')
const summarizing = ref(false)

const hasResults = computed(() => articles.value.length > 0)

async function search(): Promise<void> {
  loading.value = true
  status.value = ''
  selected.value = null
  summary.value = ''
  try {
    articles.value = await window.api.searchNews(query.value)
    if (!articles.value.length) status.value = '找不到相符的新聞，試試其他關鍵字。'
  } catch (error) {
    status.value = error instanceof Error ? error.message : '無法取得新聞，請稍後再試'
  } finally { loading.value = false }
}

async function select(article: NewsArticle): Promise<void> {
  selected.value = article
  summary.value = ''
}

async function summarize(): Promise<void> {
  if (!selected.value) return
  summarizing.value = true
  status.value = ''
  try {
    summary.value = await window.api.summarizeNews(selected.value)
  } catch (error) {
    status.value = error instanceof Error ? error.message : '無法產生摘要'
  } finally { summarizing.value = false }
}

function openOriginal(): void {
  if (selected.value) void window.api.openNews(selected.value.url)
}

function formatPublishedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

onMounted(() => void search())
</script>

<template>
  <div class="text-overline text-primary">News · live search</div>
  <div class="text-h3">新聞</div>
  <div class="text-body1 text-grey-5 q-mt-sm">搜尋即時新聞，再用本機 Gemma 4 整理你選擇的報導。</div>

  <q-form class="row q-col-gutter-sm q-mt-lg" @submit.prevent="search">
    <div class="col"><q-input v-model="query" outlined dense placeholder="輸入關鍵字，例如：AI、台灣科技、IELTS" :disable="loading" /></div>
    <div class="col-auto"><q-btn unelevated color="primary" icon="search" label="搜尋" type="submit" :loading="loading" /></div>
  </q-form>
  <div class="text-caption text-grey-6 q-mt-sm">新聞由 Google News RSS 提供；摘要僅根據標題與來源提供的摘要產生。</div>
  <div v-if="status" class="lexicon-status-error q-mt-md">{{ status }}</div>

  <div v-if="hasResults" class="row q-col-gutter-lg q-mt-sm">
    <div class="col-12 col-md-7">
      <q-list bordered separator class="rounded-borders bg-surface">
        <q-item v-for="article in articles" :key="article.id" clickable :active="selected?.id === article.id" active-class="bg-primary text-white" @click="select(article)">
          <q-item-section>
            <q-item-label lines="2" class="text-weight-medium">{{ article.title }}</q-item-label>
            <q-item-label caption :class="{ 'text-white': selected?.id === article.id }">{{ article.source }} · {{ formatPublishedAt(article.publishedAt) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="col-12 col-md-5">
      <q-card v-if="selected" flat class="lexicon-card">
        <q-card-section>
          <div class="text-h6">{{ selected.title }}</div>
          <div class="text-caption text-grey-5 q-mt-sm">{{ selected.source }} · {{ formatPublishedAt(selected.publishedAt) }}</div>
          <div class="q-mt-md">{{ selected.description || '此來源沒有提供可供摘要的內容。' }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" icon="open_in_new" label="閱讀原文" @click="openOriginal" />
          <q-btn unelevated color="primary" icon="auto_awesome" label="本機 AI 摘要" :loading="summarizing" @click="summarize" />
        </q-card-actions>
        <q-card-section v-if="summary" class="news-summary"><div class="text-overline text-primary">Gemma 4 摘要</div><div class="q-mt-xs" style="white-space: pre-wrap">{{ summary }}</div></q-card-section>
      </q-card>
      <q-card v-else flat class="lexicon-card"><q-card-section class="text-grey-5">選一則新聞即可閱讀來源摘要、開啟原文或產生本機 AI 摘要。</q-card-section></q-card>
    </div>
  </div>
</template>
