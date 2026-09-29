<script setup lang="ts">
import HelpTip from '@/components/ui/HelpTip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Card from '@/components/ui/Card.vue'
import { formatCurrency, formatSign, formatPercent } from '@/utils/formatters'
import type { Holding } from '@/types/market'

defineProps<{
  holdings: Holding[]
  loading: boolean
}>()
</script>

<template>
  <Card>
    <SectionHeader>
      <template #title>我的持倉<HelpTip termKey="portfolio.my-holdings" /></template>
      <template #actions>
        <RouterLink to="/trading/watchdog" class="btn btn--ghost">查看全部</RouterLink>
      </template>
    </SectionHeader>
    <template v-if="holdings.length">
      <table class="data-table">
        <thead>
          <tr>
            <th>代碼</th>
            <th>名稱</th>
            <th class="text-right">持有張數</th>
            <th class="text-right">均價</th>
            <th class="text-right">參考價</th>
            <th class="text-right">損益</th>
            <th class="text-right">報酬率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in holdings" :key="h.code">
            <td class="text-muted">{{ h.code }}</td>
            <td>{{ h.name }}</td>
            <td class="text-right">{{ formatCurrency(h.shares) }}</td>
            <td class="text-right text-secondary">{{ h.avgCost.toFixed(2) }}</td>
            <td class="text-right">{{ h.current == null ? '---' : h.current.toFixed(2) }}</td>
            <td class="text-right" :class="h.pnl == null ? '' : h.pnl >= 0 ? 'text-up' : 'text-down'">{{ h.pnl == null ? '---' : `${h.pnl >= 0 ? '▲' : '▼'} ${formatSign(h.pnl)}` }}</td>
            <td class="text-right" :class="h.pnlPercent == null ? '' : h.pnlPercent >= 0 ? 'text-up' : 'text-down'">{{ h.pnlPercent == null ? '---' : formatPercent(h.pnlPercent) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <EmptyState v-else :loading="loading" message="尚無持倉資料" />
  </Card>
</template>

<style scoped lang="scss">
// Holdings uses shared .data-table styles from global scope; no extra styles needed.
</style>
