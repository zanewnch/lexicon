<script setup lang="ts">
import type { EarningsNewsData } from '../composables/useTsmcData'

defineProps<{
  earningsData: EarningsNewsData | null
  earningsLoading: boolean
  earningsError: string
}>()

const emit = defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="tsmc__section tsmc__section--wide">
    <div class="tsmc__earnings-meta">
      <div class="tsmc__highlight" style="flex:1">
        台積電每季法說會（1 月、4 月、7 月、10 月）。逐字稿需付費（Seeking Alpha），以下整理文來自鉅亨網，關鍵數字和引述對入門已夠用。
      </div>
      <button class="tsmc__refresh-btn" :disabled="earningsLoading" @click="emit('refresh')">
        {{ earningsLoading ? '載入中…' : '重新整理' }}
      </button>
    </div>

    <div class="tsmc__keyword-list">
      <div class="tsmc__keyword"><code>guidance</code><span>下季營收展望，最重要的數字</span></div>
      <div class="tsmc__keyword"><code>CoWoS</code><span>AI 晶片封裝需求，代表 NVIDIA 訂單狀況</span></div>
      <div class="tsmc__keyword"><code>advanced process</code><span>先進製程需求強不強</span></div>
      <div class="tsmc__keyword"><code>AI demand</code><span>AI 相關需求的描述</span></div>
    </div>

    <div v-if="earningsLoading" class="tsmc__status">載入中…</div>
    <div v-if="earningsError" class="tsmc__status tsmc__status--error">{{ earningsError }}</div>

    <template v-if="earningsData && !earningsLoading">
      <div class="tsmc__data-meta">
        <span class="tsmc__data-source">鉅亨網</span>
        <span class="tsmc__data-time">更新：{{ new Date(earningsData.fetched_at).toLocaleString('zh-TW') }}</span>
        <span class="tsmc__data-time">共 {{ earningsData.total }} 筆</span>
      </div>

      <div class="tsmc__news-list">
        <a
          v-for="item in earningsData.items"
          :key="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="tsmc__news-item"
        >
          <div class="tsmc__news-top">
            <span class="tsmc__news-source">{{ item.source_label }}</span>
            <span class="tsmc__news-date">{{ item.date }}</span>
          </div>
          <div class="tsmc__news-title">{{ item.title }}</div>
          <div v-if="item.summary" class="tsmc__news-summary">{{ item.summary }}</div>
        </a>
      </div>
    </template>
  </div>
</template>
