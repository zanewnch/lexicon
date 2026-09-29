<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStockList, useTreemapData, useRankings, useSectors } from '@/features/explorer/composables/useExplorerData'
import type { RankingType } from '@/types/explorer'
import type { SortOrder } from '@/types/common'
import TabBar from '@/components/ui/TabBar.vue'
import ExplorerScreener from '@/features/explorer/components/ExplorerScreener.vue'
import ExplorerTreemap from '@/features/explorer/components/ExplorerTreemap.vue'
import ExplorerRankings from '@/features/explorer/components/ExplorerRankings.vue'
import ExplorerSectors from '@/features/explorer/components/ExplorerSectors.vue'
import ExplorerFunnel from '@/features/explorer/components/ExplorerFunnel.vue'
import HelpTip from '@/components/ui/HelpTip.vue'

const router = useRouter()

// ---- Tab state ----
const activeTab = ref<'screener' | 'treemap' | 'rankings' | 'sectors' | 'funnel'>('screener')
const tabs = [
  { key: 'screener' as const, label: '股票篩選', icon: '🔍' },
  { key: 'treemap' as const, label: '產業地圖', icon: '🗺' },
  { key: 'rankings' as const, label: '排行榜', icon: '🏆' },
  { key: 'sectors' as const, label: '類股比較', icon: '📊' },
  { key: 'funnel' as const, label: '選股漏斗', icon: '🔽' },
]

// ---- Screener ----
const { stocks, total, loading: screenerLoading, fetchStocks } = useStockList()

const sectorOptions = computed(() => {
  const seen = new Set<string>()
  stocks.value.forEach(s => seen.add(s.sector))
  return Array.from(seen).sort()
})

function handleScreenerSearch(params: {
  search: string
  exchange: string
  sector: string
  sort: string
  order: SortOrder
  limit: number
  offset: number
}) {
  fetchStocks(params)
}

// ---- Treemap ----
const { data: treemapData, loading: treemapLoading, fetchTreemap } = useTreemapData()

const treemapSectors = computed(() => {
  const groups: Record<string, { sector: string; items: NonNullable<typeof treemapData.value>; totalTurnover: number }> = {}
  for (const item of treemapData.value ?? []) {
    if (!groups[item.sector]) {
      groups[item.sector] = { sector: item.sector, items: [], totalTurnover: 0 }
    }
    groups[item.sector]!.items.push(item)
    groups[item.sector]!.totalTurnover += item.turnover
  }
  return Object.values(groups)
    .sort((a, b) => b.totalTurnover - a.totalTurnover)
    .slice(0, 15)
    .map(g => ({
      ...g,
      items: g.items.sort((a, b) => b.turnover - a.turnover).slice(0, 20),
    }))
})

// ---- Rankings ----
const { data: rankData, loading: rankLoading, rankType, fetchRankings } = useRankings()

function handleFetchRankings(type: RankingType) {
  fetchRankings(type)
}

// ---- Sectors ----
const { sectors, loading: sectorsLoading, fetchSectors } = useSectors()

// ---- Navigation ----
function goToStock(code: string) {
  router.push({ path: '/analysis/quote', query: { code } })
}

// ---- Init ----
onMounted(() => {
  fetchStocks({
    sort: 'turnover',
    order: 'desc',
    limit: 50,
    offset: 0,
  })
})

watch(activeTab, (tab) => {
  if (tab === 'treemap' && !treemapData.value?.length) fetchTreemap()
  if (tab === 'rankings' && !rankData.value?.length) fetchRankings()
  if (tab === 'sectors' && !sectors.value?.length) fetchSectors()
})
</script>

<template>
  <div class="explorer">
    <div class="explorer__header">
      <h1 class="explorer__title">
        台股全覽
        <HelpTip text="股票篩選表格，支援搜尋、排序、分頁、產業/市場篩選。&#10;&#10;【實作方式】&#10;前端 useStockList composable 呼叫 GET /api/stocks/?search=&amp;exchange=&amp;sector=&amp;sort=&amp;order=&amp;limit=&amp;offset= 取得分頁資料。後端 StockListView 透過 Shioaji api.snapshots() 批次取得全市場快照，快取 60 秒，支援排序與篩選。&#10;&#10;【關鍵檔案】&#10;• frontend/src/composables/data/useExplorerData.ts → useStockList (API 呼叫)&#10;• frontend/src/views/explorer/ExplorerScreener.vue → 表格 UI 元件&#10;• backend/market/views.py → StockListView (REST API)&#10;• backend/market/service.py → get_stock_list() (Shioaji 快照 + 快取)" />
      </h1>
      <span class="explorer__subtitle text-muted">上市 + 上櫃全部公司 · 即時資料</span>
    </div>

    <TabBar :tabs="tabs" v-model="activeTab" />

    <!-- Tab content -->
    <div class="explorer__content">
      <ExplorerScreener
        v-if="activeTab === 'screener'"
        :stocks="stocks"
        :total="total"
        :loading="screenerLoading"
        :sector-options="sectorOptions"
        @search="handleScreenerSearch"
        @go-to-stock="goToStock"
      />

      <ExplorerTreemap
        v-if="activeTab === 'treemap'"
        :treemap-sectors="treemapSectors"
        :loading="treemapLoading"
        @go-to-stock="goToStock"
      />

      <ExplorerRankings
        v-if="activeTab === 'rankings'"
        :rank-data="rankData"
        :loading="rankLoading"
        :rank-type="rankType"
        @fetch-rankings="handleFetchRankings"
        @go-to-stock="goToStock"
      />

      <ExplorerSectors
        v-if="activeTab === 'sectors'"
        :sectors="sectors ?? []"
        :loading="sectorsLoading"
        @go-to-stock="goToStock"
      />

      <ExplorerFunnel
        v-if="activeTab === 'funnel'"
        @go-to-stock="goToStock"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.explorer {
  height: calc(100vh - var(--header-height) - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: baseline;
    gap: var(--gap-md);
    margin-bottom: 20px;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
  }

  &__subtitle {
    font-size: var(--font-size-base);
  }

  &__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    animation: fadeIn 0.2s ease;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
