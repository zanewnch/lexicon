<script setup lang="ts">
import { formatPercent, formatBigNumber } from '@/utils/formatters'
import type { StockListItem, RankingType } from '@/types/explorer'
import Card from '@/components/ui/Card.vue'

defineProps<{
  rankData: StockListItem[]
  loading: boolean
  rankType: RankingType
}>()

const emit = defineEmits<{
  fetchRankings: [type: RankingType]
  goToStock: [code: string]
}>()

const rankTabs: { key: RankingType; label: string }[] = [
  { key: 'yield', label: '高殖利率' },
  { key: 'pe_low', label: '低本益比' },
  { key: 'gainers', label: '漲幅榜' },
  { key: 'losers', label: '跌幅榜' },
  { key: 'volume', label: '成交量' },
  { key: 'turnover', label: '成交額' },
]
</script>

<template>
  <div class="explorer-rankings">
    <div class="explorer-rankings__tabs">
      <button
        v-for="rt in rankTabs"
        :key="rt.key"
        class="explorer-rankings__tab"
        :class="{ 'explorer-rankings__tab--active': rankType === rt.key }"
        @click="emit('fetchRankings', rt.key)"
      >
        {{ rt.label }}
      </button>
    </div>

    <Card :loading="loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>代碼</th>
            <th>名稱</th>
            <th class="text-right">股價</th>
            <th class="text-right">漲跌%</th>
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
            v-for="(s, i) in rankData"
            :key="s.code"
            class="explorer-rankings__row"
            @click="emit('goToStock', s.code)"
          >
            <td class="data-table__rank">{{ i + 1 }}</td>
            <td class="data-table__code">{{ s.code }}</td>
            <td class="data-table__name">{{ s.name }}</td>
            <td class="text-right data-table__num">{{ s.price ? s.price.toFixed(2) : '-' }}</td>
            <td
              class="text-right data-table__num"
              :class="s.changePercent > 0 ? 'text-up' : s.changePercent < 0 ? 'text-down' : ''"
            >
              {{ formatPercent(s.changePercent) }}
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
            <td class="text-muted">{{ s.sector }}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.explorer-rankings {
  &__tabs {
    display: flex;
    gap: var(--gap-xs);
    margin-bottom: var(--gap-md);
    flex-wrap: wrap;
  }

  &__tab {
    padding: 6px 16px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--color-text-muted);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }
  }

  &__row {
    cursor: pointer;
  }
}
</style>
