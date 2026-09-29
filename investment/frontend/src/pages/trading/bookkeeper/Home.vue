<script setup lang="ts">
/**
 * HistoryView — 交易紀錄頁面
 *
 * 顯示所有成交紀錄並提供績效統計。
 *
 * 功能包含：
 * - 績效統計卡片（總次數、勝率、已實現損益、最大獲利/虧損）
 * - 日期 / 方向 / 股票三維筛選器
 * - 交易明細表格（方向、價格、舂數、手續費、稅、損益）
 *
 * 資料來源：`useHistoryData()`， 它將資料映射自 `/account/trades/` API。
 */
import { ref, computed } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import SimulationBanner from '@/components/layout/SimulationBanner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { useHistoryData } from '@/features/bookkeeper/composables/useHistoryData'
import { formatCurrency, formatSign } from '@/utils/formatters'

// ---- Filter State ----
const filterDateFrom = ref('2025-12-01')
const filterDateTo = ref('2026-03-08')
const filterSide = ref('全部')
const filterStock = ref('')

const { trades, isDummy } = useHistoryData()

const filteredTrades = computed(() => {
  return trades.value.filter(t => {
    if (filterSide.value === '買進' && t.side !== 'buy') return false
    if (filterSide.value === '賣出' && t.side !== 'sell') return false
    if (filterStock.value && !t.code.includes(filterStock.value) && !t.name.includes(filterStock.value)) return false
    return true
  })
})

// 績效統計
const stats = computed(() => {
  const allTrades = trades.value
  const sellTrades = allTrades.filter(t => t.side === 'sell' && t.pnl !== null)
  const wins = sellTrades.filter(t => (t.pnl ?? 0) > 0)
  const totalPnl = sellTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
  const totalFees = allTrades.reduce((sum, t) => sum + t.fee + t.tax, 0)
  const maxWin = sellTrades.length ? Math.max(...sellTrades.map(t => t.pnl ?? 0)) : 0
  const maxLoss = sellTrades.length ? Math.min(...sellTrades.map(t => t.pnl ?? 0)) : 0

  return {
    totalTrades: allTrades.length,
    buyCount: allTrades.filter(t => t.side === 'buy').length,
    sellCount: sellTrades.length,
    winRate: sellTrades.length ? ((wins.length / sellTrades.length) * 100).toFixed(1) : '0.0',
    totalPnl,
    avgPnl: sellTrades.length ? Math.round(totalPnl / sellTrades.length) : 0,
    maxWin,
    maxLoss,
    totalFees,
  }
})

</script>

<template>
  <div class="history">
    <PageHeader title="交易紀錄" />

    <SimulationBanner message="目前為模擬模式，歷史交易紀錄可能不完整。" />

    <!-- 績效統計 -->
    <h2 class="section-title section-title--stats">績效統計<DummyBadge :show="isDummy" /></h2>
    <div class="history__stats">
      <StatCard label="總交易次數" :value="stats.totalTrades" :sub="`買 ${stats.buyCount} / 賣 ${stats.sellCount}`" />
      <StatCard :value-class="Number(stats.winRate) >= 50 ? 'text-up' : 'text-down'" :value="`${stats.winRate}%`">
        <template #label>勝率<HelpTip termKey="trade.win-rate" /></template>
      </StatCard>
      <StatCard label="已實現損益" :value="`$${formatSign(stats.totalPnl)}`" :value-class="stats.totalPnl >= 0 ? 'text-up' : 'text-down'" />
      <StatCard label="平均損益" :value="`$${formatSign(stats.avgPnl)}`" :value-class="stats.avgPnl >= 0 ? 'text-up' : 'text-down'" />
      <StatCard label="最大獲利" :value="`$${formatCurrency(stats.maxWin)}`" value-class="text-up" />
      <StatCard label="最大虧損" :value="`$${formatSign(stats.maxLoss)}`" value-class="text-down" />
      <StatCard label="總手續費+稅" :value="`$${formatCurrency(stats.totalFees)}`" value-class="text-secondary" />
    </div>

    <!-- 篩選器 -->
    <Card class="filters">
      <div class="filters__group">
        <label class="filters__label">日期範圍</label>
        <input type="date" v-model="filterDateFrom" />
        <span class="text-muted">~</span>
        <input type="date" v-model="filterDateTo" />
      </div>
      <div class="filters__group">
        <label class="filters__label">方向</label>
        <select v-model="filterSide" class="form-select">
          <option>全部</option>
          <option>買進</option>
          <option>賣出</option>
        </select>
      </div>
      <div class="filters__group">
        <label class="filters__label">股票</label>
        <input type="text" v-model="filterStock" placeholder="代碼或名稱" />
      </div>
    </Card>

    <!-- 交易紀錄表 -->
    <Card>
      <h2 class="section-title">交易明細 ({{ filteredTrades.length }} 筆)<DummyBadge :show="isDummy" /><HelpTip termKey="trade.history" /></h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>時間</th>
            <th>代碼</th>
            <th>名稱</th>
            <th>方向</th>
            <th class="text-right">價格</th>
            <th class="text-right">股數</th>
            <th class="text-right">手續費</th>
            <th class="text-right">稅</th>
            <th class="text-right">損益</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, i) in filteredTrades" :key="i">
            <td class="text-muted">{{ t.date }}</td>
            <td class="text-muted">{{ t.time }}</td>
            <td class="text-muted">{{ t.code }}</td>
            <td>{{ t.name }}</td>
            <td>
              <span class="trade-tag" :class="t.side === 'buy' ? 'trade-tag--buy' : 'trade-tag--sell'">
                {{ t.side === 'buy' ? '買進' : '賣出' }}
              </span>
            </td>
            <td class="text-right">{{ t.price.toFixed(2) }}</td>
            <td class="text-right">{{ formatCurrency(t.shares) }}</td>
            <td class="text-right text-secondary">{{ formatCurrency(t.fee) }}</td>
            <td class="text-right text-secondary">{{ t.tax > 0 ? formatCurrency(t.tax) : '-' }}</td>
            <td class="text-right" :class="t.pnl !== null ? (t.pnl >= 0 ? 'text-up' : 'text-down') : ''">
              {{ t.pnl !== null ? formatSign(t.pnl) : '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.history {
  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--gap-md);
    margin-bottom: 20px;
  }
}

.section-title--stats {
  margin-bottom: 12px;
}

// ---- Filters ----

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-md);
  align-items: flex-end;
  margin-bottom: 20px;

  &__group {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__group input,
  &__group select {
    min-width: 0;
  }
}

</style>
