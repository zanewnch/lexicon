<script setup lang="ts">
/**
 * NewsView — 市場快訊頁面
 *
 * 展示股市新聞，來源從後端聞取並合併兩種來源：
 * - **鎒亨網** (anue) — 台股新聞 JSON API
 * - **ETtoday** — 財經雲 RSS feed
 *
 * 功能包含：
 * - 來源切換 Tab（全部 / 鎒亨網 / ETtoday）
 * - 關鍵字搜尋（debounce 400ms）
 * - 分頁導航（每頁 15 筆）
 * - Hover 頁面標題可門資料來源說明浮層
 *
 * 資料來源：`useNewsData()`。
 * 後端每 10 分鐘快取。
 */
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import TabBar from '@/components/ui/TabBar.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useNewsData } from '@/features/news/composables/useNewsData'

const showHint = ref(false)

const {
  items,
  loading,
  error,
  total,
  source,
  currentPage,
  totalPages,
  fetchNews,
  setSource,
  setSearch,
  goToPage,
  visiblePages: getVisiblePages,
} = useNewsData()

const visiblePages = computed(() => getVisiblePages())

const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    setSearch(searchInput.value)
  }, 400)
}

const sourceTabs = [
  { key: 'all' as const, label: '全部' },
  { key: 'anue' as const, label: '鉅亨網' },
  { key: 'ettoday' as const, label: 'ETtoday' },
]

function sourceLabel(s: string) {
  return s === 'anue' ? '鉅亨' : 'ETtoday'
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div class="news-page">
    <PageHeader>
      <template #title>
        <span
          class="news-page__title-inner"
          @mouseenter="showHint = true"
          @mouseleave="showHint = false"
        >
          市場快訊
          <Transition name="hint-fade">
            <div v-if="showHint" class="news-page__hint">
              <div class="news-page__hint-title">資料來源</div>
              <ul class="news-page__hint-list">
                <li><strong>鉅亨網</strong> — cnyes JSON API（台股新聞）</li>
                <li><strong>ETtoday</strong> — RSS feed（財經雲）</li>
              </ul>
              <div class="news-page__hint-detail">
                後端每 <strong>10 分鐘</strong>快取，兩來源合併後依時間降序排列，支援關鍵字搜尋與分頁載入。
              </div>
            </div>
          </Transition>
        </span>
      </template>
      <template #actions>
        <span class="news-page__total" v-if="total > 0">共 {{ total }} 筆</span>
      </template>
    </PageHeader>

    <div class="news-page__toolbar">
      <TabBar
        :tabs="sourceTabs"
        :model-value="source"
        variant="segment"
        mb="0"
        tab-padding="6px 16px"
        active-bg="var(--color-accent-soft)"
        active-color="var(--color-accent)"
        @update:model-value="(k) => setSource(k as typeof source)"
      />
      <div class="news-page__search">
        <input
          v-model="searchInput"
          type="text"
          placeholder="搜尋關鍵字..."
          class="news-page__search-input"
          @input="onSearchInput"
        />
      </div>
    </div>

    <div v-if="error" class="news-page__error">{{ error }}</div>

    <ul v-if="items.length" class="news-list">
      <li v-for="item in items" :key="item.id" class="news-list__item">
        <div class="news-list__header">
          <span class="news-list__time">{{ item.date }} {{ item.time }}</span>
          <span
            class="news-list__source"
            :class="item.source === 'anue' ? 'news-list__source--anue' : 'news-list__source--ettoday'"
          >
            {{ sourceLabel(item.source) }}
          </span>
          <span class="news-list__category">{{ item.category }}</span>
        </div>
        <a :href="item.url" target="_blank" rel="noopener" class="news-list__title">
          {{ item.title }}
        </a>
        <div class="news-list__summary" v-if="item.summary">{{ item.summary }}</div>
        <div class="news-list__tags" v-if="item.stocks.length || item.keywords.length">
          <span v-for="code in item.stocks" :key="code" class="news-list__stock-tag">{{ code }}</span>
          <span v-for="kw in item.keywords.slice(0, 3)" :key="kw" class="news-list__keyword-tag">{{ kw }}</span>
        </div>
      </li>
    </ul>

    <EmptyState v-else-if="!loading" :loading="false" message="尚無市場快訊" />
    <EmptyState v-else :loading="true" message="載入中..." />

    <nav v-if="totalPages > 1" class="news-page__pagination">
      <button
        class="news-page__page-btn"
        :disabled="currentPage === 1 || loading"
        @click="goToPage(currentPage - 1)"
      >
        &lsaquo;
      </button>
      <template v-for="(page, idx) in visiblePages" :key="idx">
        <span v-if="page === -1" class="news-page__page-ellipsis">&hellip;</span>
        <button
          v-else
          class="news-page__page-btn"
          :class="{ 'news-page__page-btn--active': page === currentPage }"
          :disabled="loading"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>
      <button
        class="news-page__page-btn"
        :disabled="currentPage === totalPages || loading"
        @click="goToPage(currentPage + 1)"
      >
        &rsaquo;
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.news-page {
  display: flex;
  flex-direction: column;
  // 固定頁面高度：viewport - header(56px) - content padding(24px * 2)
  // 讓新聞列表在內部捲動，header/toolbar/pagination 固定不動
  height: calc(100vh - var(--header-height) - 48px);
  overflow: hidden;

  &__title-inner {
    position: relative;
    cursor: default;
  }

  &__hint {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    z-index: 100;
    width: 360px;
    padding: 16px 20px;
    border-radius: var(--radius-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    font-size: var(--font-size-base);
    font-weight: 400;
    line-height: 1.6;
    color: var(--color-text-secondary);
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 20px;
      width: 12px;
      height: 12px;
      background: var(--color-bg-secondary);
      border-top: 1px solid var(--color-border);
      border-left: 1px solid var(--color-border);
      transform: rotate(45deg);
    }
  }

  &__hint-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  &__hint-list {
    list-style: none;
    padding: 0;
    margin: 0 0 10px;
    display: flex;
    flex-direction: column;
    gap: var(--gap-xs);

    li {
      padding-left: 12px;
      position: relative;

      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--color-accent);
      }

      strong {
        color: var(--color-text-primary);
      }
    }
  }

  &__hint-detail {
    padding-top: var(--gap-sm);
    border-top: 1px solid var(--color-border);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);

    strong {
      color: var(--color-text-secondary);
    }
  }

  &__total {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--gap-md);
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  &__search {
    flex: 1;
    max-width: 320px;
  }

  &__search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    outline: none;
    transition: border-color var(--duration-fast);

    &::placeholder {
      color: var(--color-text-muted);
    }

    &:focus {
      border-color: var(--color-accent);
    }
  }

  &__error {
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: var(--radius-md);
    background: var(--color-down-soft);
    color: var(--color-down);
    font-size: var(--font-size-base);
  }

  &__pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--gap-xs);
    padding: 16px 0 4px;
  }

  &__page-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--duration-fast);

    &:hover:not(:disabled):not(&--active) {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
      border-color: var(--color-text-muted);
    }

    &--active {
      background: var(--color-accent);
      color: #fff;
      border-color: var(--color-accent);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__page-ellipsis {
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }
}

.news-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px 0;
    border-bottom: 1px solid var(--color-border);

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  &__time {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__source {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 500;

    &--anue {
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }

    &--ettoday {
      background: var(--color-up-soft);
      color: var(--color-up);
    }
  }

  &__category {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__title {
    font-size: var(--font-size-base);
    font-weight: 500;
    line-height: 1.5;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color var(--duration-fast);

    &:hover {
      color: var(--color-accent);
    }
  }

  &__summary {
    font-size: var(--font-size-base);
    line-height: 1.5;
    color: var(--color-text-secondary);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-xs);
    margin-top: 2px;
  }

  &__stock-tag {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__keyword-tag {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-bg-hover);
    color: var(--color-text-secondary);
  }
}
</style>
