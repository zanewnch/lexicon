<script setup lang="ts">
import { computed, ref } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import Card from '@/components/ui/Card.vue'
import Badge, { type BadgeVariant } from '@/components/ui/Badge.vue'
import SimulationBanner from '@/components/layout/SimulationBanner.vue'
import { useMarketStore } from '@/store/market'
import { formatCurrency } from '@/utils/formatters'
import type { Order } from '@/types/account'

const props = defineProps<{
  orders: Order[]
  isDummy: boolean
  cancelLoading: boolean
}>()
const emit = defineEmits<{
  (event: 'cancel-order', payload: { orderId: string; tradePin: string }): void
}>()

const cancelPin = ref('')
const hasCancelableOrders = computed(() => props.orders.some((order) => order.cancelable))

function requestCancel(orderId: string) {
  if (!cancelPin.value.trim()) return
  emit('cancel-order', { orderId, tradePin: cancelPin.value })
}

const app = useMarketStore()

function orderVariant(status: string): BadgeVariant {
  if (status === '委託中') return 'pending'
  if (status === '部分成交') return 'accent'
  if (status === '已取消') return 'cancelled'
  return 'muted'
}
</script>

<template>
  <Card>
    <h2 class="section-title">今日委託<DummyBadge :show="isDummy" /><HelpTip termKey="trade.today-orders" /></h2>
    <SimulationBanner v-if="app.isSimulation" inline message="此處顯示券商模擬帳戶的當日委託回報。" />
    <div v-if="hasCancelableOrders" class="order-history__cancel-controls">
      <label for="cancel-trade-pin">取消委託確認碼</label>
      <input id="cancel-trade-pin" v-model="cancelPin" type="password" autocomplete="off" />
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th>時間</th>
          <th>股票</th>
          <th>方向</th>
          <th class="text-right">價格</th>
          <th class="text-right">委/成</th>
          <th>狀態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in orders" :key="o.id">
          <td class="text-muted">{{ o.time }}</td>
          <td>{{ o.name }}</td>
          <td>
            <span class="trade-tag" :class="o.side === 'buy' ? 'trade-tag--buy' : 'trade-tag--sell'">
              {{ o.side === 'buy' ? '買' : '賣' }}
            </span>
          </td>
          <td class="text-right">{{ o.type === '市價' ? '市價' : o.price.toFixed(2) }}</td>
          <td class="text-right">{{ formatCurrency(o.shares) }}/{{ formatCurrency(o.filled) }}</td>
          <td>
            <Badge :variant="orderVariant(o.status)" size="md">{{ o.status }}</Badge>
          </td>
          <td><button v-if="o.cancelable" class="order-history__cancel-button" :disabled="cancelLoading || !cancelPin.trim()" @click="requestCancel(o.id)">取消委託</button></td>
        </tr>
        <tr v-if="orders.length === 0"><td colspan="7" class="text-muted">目前沒有當日委託</td></tr>
      </tbody>
    </table>
  </Card>
</template>

<style scoped lang="scss">
.order-history {
  &__cancel-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;

    input { max-width: 180px; }
  }

  &__cancel-button {
    cursor: pointer;
  }
}
</style>
