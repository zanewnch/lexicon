<script setup lang="ts">
import { computed } from 'vue'
import type { PipelineStock, SizingState } from '@/types/pipeline'

const props = defineProps<{
  stocks: PipelineStock[]
  sizing: SizingState
  prices: Record<string, number>
}>()

interface Row {
  symbol: string
  name?: string
  price: number
  shares: number
  amount: number
  stopLoss: number
  takeProfit: number
}

const rows = computed<Row[]>(() => {
  const perStockBudget = (props.sizing.capital * props.sizing.perStockPct) / 100
  const usable = Math.min(props.stocks.length, props.sizing.maxPositions)
  return props.stocks.slice(0, usable).map((s) => {
    const price = props.prices[s.symbol] ?? 0
    const lots = price > 0 ? Math.floor(perStockBudget / (price * 1000)) : 0
    const shares = lots * 1000
    return {
      symbol: s.symbol,
      name: s.name,
      price,
      shares,
      amount: shares * price,
      stopLoss: +(price * (1 - props.sizing.stopLossPct / 100)).toFixed(2),
      takeProfit: +(price * (1 + props.sizing.takeProfitPct / 100)).toFixed(2),
    }
  })
})

const totalAmount = computed(() => rows.value.reduce((s, r) => s + r.amount, 0))
</script>

<template>
  <div class="sizing-table">
    <table>
      <thead>
        <tr>
          <th>代碼</th>
          <th>現價</th>
          <th>股數</th>
          <th>預估金額</th>
          <th>停損價</th>
          <th>停利價</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.symbol">
          <td>
            <strong>{{ r.symbol }}</strong>
            <span v-if="r.name" class="sizing-table__name">{{ r.name }}</span>
          </td>
          <td>{{ r.price ? r.price.toFixed(2) : '—' }}</td>
          <td>{{ r.shares.toLocaleString() }}</td>
          <td>${{ r.amount.toLocaleString() }}</td>
          <td class="sizing-table__sl">{{ r.stopLoss }}</td>
          <td class="sizing-table__tp">{{ r.takeProfit }}</td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="6" class="sizing-table__empty">尚未選股</td>
        </tr>
      </tbody>
      <tfoot v-if="rows.length">
        <tr>
          <td colspan="3"><strong>總計</strong></td>
          <td colspan="3"><strong>${{ totalAmount.toLocaleString() }}</strong> / ${{ sizing.capital.toLocaleString() }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped lang="scss">
.sizing-table {
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--glass-border);
  }

  th {
    background: var(--color-bg-hover);
    font-size: 13px;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  &__name {
    margin-left: 6px;
    color: var(--color-text-muted);
    font-size: 12px;
  }

  &__sl { color: #ef4444; }
  &__tp { color: #10b981; }

  &__empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--gap-lg);
  }

  tfoot td {
    background: var(--color-bg-hover);
  }
}
</style>
