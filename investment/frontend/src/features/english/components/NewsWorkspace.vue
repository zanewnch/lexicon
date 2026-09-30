<script setup lang="ts">
import { englishApi } from '@/api/english'
import { EnglishActions, EnglishButton, EnglishCard, EnglishForm, EnglishInput, EnglishItem, EnglishItemLabel, EnglishItemSection, EnglishList, EnglishSection } from '../ui'
import type { NewsArticle } from '@/types/english'

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
    articles.value = await englishApi.searchNews(query.value)
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
    summary.value = await englishApi.summarizeNews(selected.value)
  } catch (error) {
    status.value = error instanceof Error ? error.message : '無法產生摘要'
  } finally { summarizing.value = false }
}

function openOriginal(): void {
  if (selected.value) void englishApi.openNews(selected.value.url)
}

function formatPublishedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

onMounted(() => void search())
</script>

<template>
  <div class="english-ui__text-overline english-ui__text-primary">News · live search</div>
  <div class="english-ui__text-h3">新聞</div>
  <div class="english-ui__text-body1 english-ui__text-grey-5 english-ui__q-mt-sm">搜尋即時新聞，再用本機 Gemma 4 整理你選擇的報導。</div>

  <EnglishForm class="english-ui__row english-ui__q-col-gutter-sm english-ui__q-mt-lg" @submit.prevent="search">
    <div class="english-ui__col"><EnglishInput v-model="query" outlined dense placeholder="輸入關鍵字，例如：AI、台灣科技、IELTS" :disable="loading" /></div>
    <div class="english-ui__col-auto"><EnglishButton unelevated color="primary" icon="search" label="搜尋" type="submit" :loading="loading" /></div>
  </EnglishForm>
  <div class="english-ui__text-caption english-ui__text-grey-6 english-ui__q-mt-sm">新聞由 Google News RSS 提供；摘要僅根據標題與來源提供的摘要產生。</div>
  <div v-if="status" class="english-status-error english-ui__q-mt-md">{{ status }}</div>

  <div v-if="hasResults" class="english-ui__row english-ui__q-col-gutter-lg english-ui__q-mt-sm">
    <div class="english-ui__col-12 english-ui__col-md-7">
      <EnglishList bordered separator class="rounded-borders english-ui__bg-surface">
        <EnglishItem v-for="article in articles" :key="article.id" clickable :active="selected?.id === article.id" active-class="english-ui__bg-primary english-ui__text-white" @click="select(article)">
          <EnglishItemSection>
            <EnglishItemLabel lines="2" class="english-ui__text-weight-medium">{{ article.title }}</EnglishItemLabel>
            <EnglishItemLabel caption :class="{ 'english-ui__text-white': selected?.id === article.id }">{{ article.source }} · {{ formatPublishedAt(article.publishedAt) }}</EnglishItemLabel>
          </EnglishItemSection>
        </EnglishItem>
      </EnglishList>
    </div>
    <div class="english-ui__col-12 english-ui__col-md-5">
      <EnglishCard v-if="selected" flat class="english-card">
        <EnglishSection>
          <div class="english-ui__text-h6">{{ selected.title }}</div>
          <div class="english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-sm">{{ selected.source }} · {{ formatPublishedAt(selected.publishedAt) }}</div>
          <div class="english-ui__q-mt-md">{{ selected.description || '此來源沒有提供可供摘要的內容。' }}</div>
        </EnglishSection>
        <EnglishActions align="right">
          <EnglishButton flat color="primary" icon="open_in_new" label="閱讀原文" @click="openOriginal" />
          <EnglishButton unelevated color="primary" icon="auto_awesome" label="本機 AI 摘要" :loading="summarizing" @click="summarize" />
        </EnglishActions>
        <EnglishSection v-if="summary" class="news-summary"><div class="english-ui__text-overline english-ui__text-primary">Gemma 4 摘要</div><div class="english-ui__q-mt-xs" style="white-space: pre-wrap">{{ summary }}</div></EnglishSection>
      </EnglishCard>
      <EnglishCard v-else flat class="english-card"><EnglishSection class="english-ui__text-grey-5">選一則新聞即可閱讀來源摘要、開啟原文或產生本機 AI 摘要。</EnglishSection></EnglishCard>
    </div>
  </div>
</template>
