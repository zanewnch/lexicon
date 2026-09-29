<script setup lang="ts">
/**
 * RankingsView — 股票排行榜頁面
 *
 * 支援七種排行類型（透過 Tab 切換）：
 * - 漲幅榜、跨幅榜、成交量、成交額、高殖利率、低/高本益比
 *
 * 局部筛選功能：市場、產業、股價區間、漲跠方向
 * 局部排序：點擊表頭切換升/降序，再次點擊重置
 * URL Query：`?type=gainers` 等，支援分享連結 / 瀏覽器左右鍵實現
 *
 * 資料來源：`useRankings()` composable。
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import TabBar from '@/components/ui/TabBar.vue'
import { useRankings } from '@/features/explorer/composables/useExplorerData'
import { useTableSort, useSortedData } from '@/composables/useTableSort'
import { formatBigNumber, formatPercent } from '@/utils/formatters'
import type { RankingType } from '@/types/explorer'

const route = useRoute()
const router = useRouter()

const { data, loading, rankType, fetchRankings } = useRankings()

// ---- Sort ----
const { sortField, sortOrder, toggleSort, sortIcon } = useTableSort({ resetable: true })

// ---- Filters ----
const exchangeFilter = ref('')
const sectorFilter = ref('')
const priceRange = ref('')
const changeDir = ref('')

const sectorOptions = computed(() => {
  const seen = new Set<string>()
  data.value.forEach(s => { if (s.sector) seen.add(s.sector) })
  return Array.from(seen).sort()
})

const filteredData = computed(() => {
  return data.value.filter(s => {
    if (exchangeFilter.value && s.exchange !== exchangeFilter.value) return false
    if (sectorFilter.value && s.sector !== sectorFilter.value) return false
    if (changeDir.value) {
      if (changeDir.value === 'up' && s.changePercent <= 0) return false
      if (changeDir.value === 'down' && s.changePercent >= 0) return false
      if (changeDir.value === 'flat' && s.changePercent !== 0) return false
    }
    if (priceRange.value) {
      const p = s.price
      if (priceRange.value === 'under50' && p >= 50) return false
      if (priceRange.value === '50to200' && (p < 50 || p > 200)) return false
      if (priceRange.value === '200to500' && (p < 200 || p > 500)) return false
      if (priceRange.value === 'over500' && p <= 500) return false
    }
    return true
  })
})

const sortedData = useSortedData(filteredData, { sortField, sortOrder, toggleSort, sortIcon })

function resetFilters() {
  exchangeFilter.value = ''
  sectorFilter.value = ''
  priceRange.value = ''
  changeDir.value = ''
  sortField.value = ''
  sortOrder.value = 'desc'
}

const rankTabs: { key: RankingType; label: string; desc: string }[] = [
  { key: 'gainers', label: '漲幅榜', desc: '今日漲幅最大的個股' },
  { key: 'losers', label: '跌幅榜', desc: '今日跌幅最大的個股' },
  { key: 'volume', label: '成交量', desc: '今日成交量最高的個股' },
  { key: 'turnover', label: '成交額', desc: '今日成交額最高的個股' },
  { key: 'yield', label: '高殖利率', desc: '殖利率最高的個股' },
  { key: 'pe_low', label: '低本益比', desc: '本益比最低的個股（價值型）' },
  { key: 'pe_high', label: '高本益比', desc: '本益比最高的個股（成長型）' },
]

function switchTab(type: RankingType) {
  resetFilters()
  router.replace({ query: { type } })
  fetchRankings(type, 200)
}

function goToStock(code: string) {
  router.push({ path: '/market', query: { code } })
}

onMounted(() => {
  const type = (route.query.type as RankingType) || 'gainers'
  fetchRankings(type, 200)
})

watch(() => route.query.type, (newType) => {
  if (newType && newType !== rankType.value) {
    fetchRankings(newType as RankingType, 200)
  }
})
</script>

<template>
  <div class="rankings">
    <PageHeader title="排行榜">
      <template #subtitle>
        {{ rankTabs.find(t => t.key === rankType)?.desc }}
        <HelpTip termKey="analysis.rankings" />
      </template>
    </PageHeader>

    <TabBar
      :tabs="rankTabs"
      :model-value="rankType"
      variant="pill"
      tab-padding="8px 18px"
      mb="16px"
      @update:model-value="(k) => switchTab(k as RankingType)"
    />

    <!-- Filters -->
    <div class="rankings__filters">
      <select v-model="exchangeFilter" class="form-select">
        <option value="">全部市場</option>
        <option value="TSE">上市 (TSE)</option>
        <option value="OTC">上櫃 (OTC)</option>
      </select>
      <select v-model="sectorFilter" class="form-select">
        <option value="">全部產業</option>
        <option v-for="s in sectorOptions" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="priceRange" class="form-select">
        <option value="">全部股價</option>
        <option value="under50">50 以下</option>
        <option value="50to200">50 ~ 200</option>
        <option value="200to500">200 ~ 500</option>
        <option value="over500">500 以上</option>
      </select>
      <select v-model="changeDir" class="form-select">
        <option value="">全部漲跌</option>
        <option value="up">上漲</option>
        <option value="down">下跌</option>
        <option value="flat">平盤</option>
      </select>
    </div>

    <!-- Info -->
    <div class="rankings__info text-muted">
      共 {{ sortedData.length }} 檔
    </div>

    <!-- Table -->
    <Card class="rankings__table-wrap" :class="{ 'rankings--loading': loading }">
      <table class="data-table">
        <thead>
          <tr>
            <th class="data-table__col--rank">#</th>
            <th>代碼</th>
            <th>名稱</th>
            <th class="text-right sortable" @click="toggleSort('price')">股價 {{ sortIcon('price') }}</th>
            <th class="text-right sortable" @click="toggleSort('changePercent')">漲跌% {{ sortIcon('changePercent') }}</th>
            <th class="text-right" v-if="rankType === 'yield'">殖利率</th>
            <th class="text-right" v-if="rankType === 'pe_low' || rankType === 'pe_high'">本益比</th>
            <th class="text-right" v-if="rankType === 'volume'">成交量</th>
            <th class="text-right" v-if="rankType === 'turnover'">成交額</th>
            <th>市場</th>
            <th>產業</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(s, i) in sortedData"
            :key="s.code"
            class="rankings__row"
            @click="goToStock(s.code)"
          >
            <td class="data-table__col--rank data-table__rank">{{ i + 1 }}</td>
            <td class="data-table__code">{{ s.code }}</td>
            <td class="data-table__name">{{ s.name }}</td>
            <td class="text-right data-table__num">{{ s.price ? s.price.toFixed(2) : '-' }}</td>
            <td
              class="text-right data-table__num"
              :class="s.changePercent > 0 ? 'text-up' : s.changePercent < 0 ? 'text-down' : ''"
            >
              {{ s.changePercent > 0 ? '▲' : s.changePercent < 0 ? '▼' : '' }} {{ formatPercent(s.changePercent) }}
            </td>
            <td class="text-right data-table__num text-up" v-if="rankType === 'yield'">
              {{ s.dividendYield.toFixed(2) }}%
            </td>
            <td class="text-right data-table__num" v-if="rankType === 'pe_low' || rankType === 'pe_high'">
              {{ s.pe.toFixed(1) }}
            </td>
            <td class="text-right data-table__num" v-if="rankType === 'volume'">
              {{ formatBigNumber(s.volume) }}
            </td>
            <td class="text-right data-table__num" v-if="rankType === 'turnover'">
              {{ formatBigNumber(s.turnover) }}
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

      <div v-if="!loading && filteredData.length === 0" class="rankings__empty">
        {{ data.length ? '沒有符合篩選條件的結果' : '尚無排行資料' }}
      </div>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.rankings {
  height: calc(100vh - var(--header-height) - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__filters {
    display: flex;
    gap: var(--gap-sm);
    margin-bottom: 12px;
    flex-wrap: wrap;
  }


  &__info {
    font-size: var(--font-size-sm);
    margin-bottom: 8px;
  }

  &__table-wrap {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }

  &__row {
    cursor: pointer;
  }

  &--loading {
    opacity: 0.5;
    pointer-events: none;
  }

  &__empty {
    padding: 48px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .rankings {
    &__title {
      font-size: var(--font-size-lg);
    }

    &__table-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    &__select {
      font-size: var(--font-size-sm);
      padding: 5px 8px;
    }
  }
}

// ---- Responsive: 480px ----
@media (max-width: 480px) {
  .rankings {
    &__header {
      flex-direction: column;
      gap: var(--gap-xs);
    }

    &__title {
      font-size: var(--font-size-md);
    }

    &__empty {
      padding: 24px;
    }
  }
}
</style>
