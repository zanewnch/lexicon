<script setup lang="ts">
import HelpTip from '@/components/ui/HelpTip.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import Card from '@/components/ui/Card.vue'
import type { TradeOrderBook } from '@/types/account'

defineProps<{
  orderBook: TradeOrderBook
  source: 'snapshot' | 'stream'
  isDummy: boolean
}>()

const emit = defineEmits<{
  (e: 'select-price', price: number): void
}>()
</script>

<template>
  <Card>
    <h2 class="section-title">{{ source === 'stream' ? '五檔報價' : '最佳買賣價（快照）' }}<DummyBadge :show="isDummy" /><HelpTip termKey="trade.orderbook" /></h2>
    <div class="orderbook">
      <p v-if="!orderBook.asks.length && !orderBook.bids.length" class="orderbook__empty">目前無買賣報價</p>
      <div class="orderbook__header">
        <span>委賣價</span>
        <span>委賣量</span>
      </div>
      <div v-for="(ask, i) in orderBook.asks" :key="'a' + i" class="orderbook__row" @click="emit('select-price', ask.price)">
        <span class="text-down">{{ ask.price.toFixed(2) }}</span>
        <span>{{ ask.volume }}</span>
        <div class="orderbook__bar orderbook__bar--ask" :style="{ width: `${(ask.volume / 400) * 100}%` }"></div>
      </div>
      <div class="orderbook__divider"></div>
      <div class="orderbook__header">
        <span>委買價</span>
        <span>委買量</span>
      </div>
      <div v-for="(bid, i) in orderBook.bids" :key="'b' + i" class="orderbook__row" @click="emit('select-price', bid.price)">
        <span class="text-up">{{ bid.price.toFixed(2) }}</span>
        <span>{{ bid.volume }}</span>
        <div class="orderbook__bar orderbook__bar--bid" :style="{ width: `${(bid.volume / 400) * 100}%` }"></div>
      </div>
    </div>
  </Card>
</template>

<style scoped lang="scss">
.orderbook {
  &__empty {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  &__header {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    padding: 4px 0;
    margin-bottom: 4px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: var(--font-size-base);
    font-variant-numeric: tabular-nums;
    position: relative;
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__bar {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    opacity: 0.1;
    border-radius: 2px;

    &--ask {
      background: var(--color-down);
    }

    &--bid {
      background: var(--color-up);
    }
  }

  &__divider {
    height: 1px;
    background: var(--color-border);
    margin: 8px 0;
  }
}
</style>
