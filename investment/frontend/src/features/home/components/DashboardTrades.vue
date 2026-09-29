<script setup lang="ts">
import HelpTip from '@/components/ui/HelpTip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import { formatCurrency } from '@/utils/formatters'
import type { Trade } from '@/types/market'

defineProps<{
  recentTrades: Trade[]
  loading: boolean
}>()
</script>

<template>
  <Card>
    <SectionHeader>
      <template #title>近期交易<HelpTip termKey="trade.recent" /></template>
      <template #actions>
        <RouterLink to="/trading/bookkeeper" class="btn btn--ghost">查看全部</RouterLink>
      </template>
    </SectionHeader>
    <template v-if="recentTrades.length">
      <table class="data-table">
        <thead>
          <tr>
            <th>時間</th>
            <th>代碼</th>
            <th>名稱</th>
            <th>方向</th>
            <th class="text-right">價格</th>
            <th class="text-right">股數</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, i) in recentTrades" :key="i">
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
            <td><Badge variant="muted" size="md">{{ t.status }}</Badge></td>
          </tr>
        </tbody>
      </table>
    </template>
    <EmptyState v-else :loading="loading" message="尚無交易紀錄" />
  </Card>
</template>

<style scoped lang="scss">
.trade-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-sm);
  font-weight: 600;

  &--buy {
    background: rgba(34, 197, 94, 0.15);
    color: var(--color-up);
  }

  &--sell {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-down);
  }
}
</style>
