<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { formatPercent, formatBigNumber } from '@/utils/formatters'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import { useTableSort } from '@/composables/useTableSort'
import type { SortOrder } from '@/types/common'
import type { StockListItem } from '@/types/explorer'
import { useStockSearch } from '@/features/market/composables/useStockSearch'

const props = defineProps<{
  stocks: StockListItem[]
  total: number
  loading: boolean
  sectorOptions: string[]
}>()

const emit = defineEmits<{
  search: [params: {
    search: string
    exchange: string
    sector: string
    sort: string
    order: SortOrder
    limit: number
    offset: number
  }]
  changePage: [page: number]
  goToStock: [code: string]
}>()

const searchQuery = ref('')
const {
  results: suggestions,
  isOpen: suggestionsOpen,
  selectedIndex,
  moveUp,
  moveDown,
  close: closeSuggestions,
} = useStockSearch(searchQuery)
const exchangeFilter = ref('')
const sectorFilter = ref('')
const { sortField, sortOrder, toggleSort, sortIcon } = useTableSort({ defaultField: 'turnover' })
const currentPage = ref(1)
const pageSize = 50
let searchTimer: ReturnType<typeof setTimeout> | undefined

const totalPages = computed(() => Math.ceil(props.total / pageSize))

function buildParams(page: number) {
  return {
    search: searchQuery.value,
    exchange: exchangeFilter.value,
    sector: sectorFilter.value,
    sort: sortField.value,
    order: sortOrder.value,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

function doSearch() {
  clearTimeout(searchTimer)
  currentPage.value = 1
  emit('search', buildParams(1))
}

watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 300)
})

onUnmounted(() => clearTimeout(searchTimer))

function changePage(page: number) {
  currentPage.value = page
  emit('changePage', page)
  emit('search', buildParams(page))
}

function handleSort(field: string) {
  toggleSort(field)
  doSearch()
}

function selectSuggestion(code: string) {
  closeSuggestions()
  emit('goToStock', code)
}

function handleSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && suggestionsOpen.value) {
    event.preventDefault()
    moveDown()
  } else if (event.key === 'ArrowUp' && suggestionsOpen.value) {
    event.preventDefault()
    moveUp()
  } else if (event.key === 'Escape') {
    closeSuggestions()
  } else if (event.key === 'Enter') {
    const selected = suggestions.value[selectedIndex.value]
    if (suggestionsOpen.value && selected) {
      event.preventDefault()
      selectSuggestion(selected.code)
    } else {
      doSearch()
    }
  }
}

function closeSuggestionsAfterBlur() {
  setTimeout(closeSuggestions, 200)
}
</script>

<template>
  <div class="explorer-screener">
    <div class="explorer-screener__controls">
      <div class="explorer-screener__search-wrap">
        <input
          v-model="searchQuery"
          class="explorer-screener__search"
          type="text"
          placeholder="搜尋代碼或公司名稱..."
          role="combobox"
          :aria-expanded="suggestionsOpen"
          aria-autocomplete="list"
          @keydown="handleSearchKeydown"
          @blur="closeSuggestionsAfterBlur"
        />
        <div v-if="suggestionsOpen" class="explorer-screener__suggestions" role="listbox">
          <button
            v-for="(item, index) in suggestions"
            :key="item.code"
            type="button"
            class="explorer-screener__suggestion"
            :class="{ 'explorer-screener__suggestion--active': selectedIndex === index }"
            role="option"
            :aria-selected="selectedIndex === index"
            @mousedown.prevent="selectSuggestion(item.code)"
          >
            <span class="explorer-screener__suggestion-code">{{ item.code }}</span>
            <span>{{ item.name }}</span>
          </button>
        </div>
      </div>
      <select v-model="exchangeFilter" class="explorer-screener__select" @change="doSearch">
        <option value="">全部市場</option>
        <option value="TSE">上市 (TSE)</option>
        <option value="OTC">上櫃 (OTC)</option>
      </select>
      <select v-model="sectorFilter" class="explorer-screener__select" @change="doSearch">
        <option value="">全部產業</option>
        <option v-for="s in sectorOptions" :key="s" :value="s">{{ s }}</option>
      </select>
      <button class="explorer-screener__btn" @click="doSearch">搜尋</button>
    </div>

    <div class="explorer-screener__info text-muted">
      共 {{ total }} 檔 · 第 {{ currentPage }} / {{ totalPages }} 頁
    </div>

    <Card class="explorer-screener__table-wrap" :loading="loading">
      <table class="data-table explorer-screener__table">
        <thead>
          <tr>
            <th class="data-table__sticky">代碼</th>
            <th class="data-table__sticky--second">名稱</th>
            <th class="text-right data-table__sortable" @click="handleSort('price')">
              股價 <HelpTip text="最近一次撮合成交的價格。盤中為即時價格，收盤後為當日收盤價。&#10;&#10;【實作】後端 GET /api/stocks/?sort=&amp;order= 回傳，資料來源為 Shioaji api.snapshots() 快照。" /> {{ sortIcon('price') }}
            </th>
            <th class="text-right data-table__sortable" @click="handleSort('changePercent')">
              漲跌% <HelpTip text="今日股價相對昨日收盤價的漲跌百分比。紅色為上漲，綠色為下跌。台股單日漲跌幅限制為 10%。&#10;&#10;【實作】後端從 snapshot 取得 change_price / close 計算，隨 stock list API 一併回傳。" /> {{ sortIcon('changePercent') }}
            </th>
            <th class="text-right data-table__sortable" @click="handleSort('volume')">
              成交量 <HelpTip term-key="quote.volume" /> {{ sortIcon('volume') }}
            </th>
            <th class="text-right data-table__sortable" @click="handleSort('turnover')">
              成交額 <HelpTip term-key="quote.turnover" /> {{ sortIcon('turnover') }}
            </th>
            <th class="text-right data-table__sortable" @click="handleSort('pe')">
              本益比 <HelpTip term-key="quote.pe" /> {{ sortIcon('pe') }}
            </th>
            <th class="text-right data-table__sortable" @click="handleSort('pb')">
              股淨比 <HelpTip term-key="quote.pb" /> {{ sortIcon('pb') }}
            </th>
            <th class="text-right data-table__sortable" @click="handleSort('dividendYield')">
              殖利率 <HelpTip term-key="quote.dividend-yield" /> {{ sortIcon('dividendYield') }}
            </th>
            <th>市場 <HelpTip text="上市 (TSE) 或上櫃 (OTC)。上市為主板市場，公司規模較大、流動性較好；上櫃為中小企業市場。" /></th>
            <th>產業 <HelpTip text="依台灣證交所分類的產業別。可用上方下拉選單篩選特定產業。" /></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in stocks"
            :key="s.code"
            class="explorer-screener__row"
            @click="emit('goToStock', s.code)"
          >
            <td class="data-table__sticky data-table__code">{{ s.code }}</td>
            <td class="data-table__sticky--second data-table__name">{{ s.name }}</td>
            <td class="text-right data-table__num">{{ s.price ? s.price.toFixed(2) : '-' }}</td>
            <td
              class="text-right data-table__num"
              :class="s.changePercent > 0 ? 'text-up' : s.changePercent < 0 ? 'text-down' : ''"
            >
              {{ s.changePercent ? formatPercent(s.changePercent) : '-' }}
            </td>
            <td class="text-right data-table__num">{{ s.volume ? formatBigNumber(s.volume) : '-' }}</td>
            <td class="text-right data-table__num">{{ s.turnover ? formatBigNumber(s.turnover) : '-' }}</td>
            <td class="text-right data-table__num">{{ s.pe ? s.pe.toFixed(1) : '-' }}</td>
            <td class="text-right data-table__num">{{ s.pb ? s.pb.toFixed(2) : '-' }}</td>
            <td
              class="text-right data-table__num"
              :class="s.dividendYield > 5 ? 'text-up' : ''"
            >
              {{ s.dividendYield ? s.dividendYield.toFixed(2) + '%' : '-' }}
            </td>
            <td>
              <span class="badge" :class="s.exchange === 'TSE' ? 'badge--tse' : 'badge--otc'">
                {{ s.exchange === 'TSE' ? '上市' : '上櫃' }}
              </span>
            </td>
            <td class="text-muted data-table__sector">{{ s.sector }}</td>
          </tr>
        </tbody>
      </table>
    </Card>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="explorer-screener__pagination">
      <button :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">← 上一頁</button>
      <template v-for="p in Math.min(totalPages, 10)" :key="p">
        <button
          class="explorer-screener__page-btn"
          :class="{ active: currentPage === p }"
          @click="changePage(p)"
        >
          {{ p }}
        </button>
      </template>
      <span v-if="totalPages > 10" class="text-muted">...</span>
      <button :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">下一頁 →</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.explorer-screener {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  &__controls {
    display: flex;
    gap: var(--gap-sm);
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  &__search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
  }

  &__search {
    width: 100%;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    outline: none;
    transition: border-color var(--duration-fast);

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__suggestions {
    position: absolute;
    z-index: 20;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    max-height: 320px;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--color-border-hover);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
    box-shadow: var(--shadow-lg);
  }

  &__suggestion {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    text-align: left;
    cursor: pointer;

    &:hover,
    &--active {
      background: var(--color-bg-hover);
    }
  }

  &__suggestion-code {
    min-width: 48px;
    color: var(--color-accent);
    font-weight: 600;
  }

  &__select {
    padding: 8px 12px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    cursor: pointer;
  }

  &__btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    background: var(--color-accent);
    color: #fff;
    font-weight: 600;
    font-size: var(--font-size-base);
    transition: opacity var(--duration-fast);

    &:hover {
      opacity: 0.9;
    }
  }

  &__info {
    font-size: var(--font-size-sm);
    margin-bottom: 8px;
  }

  &__table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &__table {
    min-width: 900px;
  }

  &__row {
    cursor: pointer;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-xs);
    margin-top: var(--gap-md);

    button {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      transition: all var(--duration-fast);

      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &.active {
        background: var(--color-accent-soft);
        color: var(--color-accent);
        font-weight: 600;
      }
    }
  }
}
</style>
