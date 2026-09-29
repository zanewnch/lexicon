<script setup lang="ts">
import { computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import RouterTabBar from '@/components/ui/RouterTabBar.vue'
import { useMarketData } from '@/features/market/composables/useMarketData'
import { formatSign, formatPercent } from '@/utils/formatters'

const route = useRoute()
const stockCode = computed(() => (route.query.code as string) || '2330')

const marketData = useMarketData(stockCode)
provide('marketData', marketData)
provide('loading', marketData.loading)

const tabs = [
  { path: '/analysis/quote', label: '報價' },
  { path: '/analysis/quote/technical', label: '技術' },
  { path: '/analysis/quote/institutional', label: '法人' },
  { path: '/analysis/quote/analysis', label: '分析' },
]
</script>

<template>
  <div class="market-layout">
    <div class="market-layout__stock-bar">
      <span class="market-layout__code">{{ marketData.stockDetail.value.code }}</span>
      <span class="market-layout__name">{{ marketData.stockDetail.value.name }}</span>
      <DummyBadge :show="marketData.isDummy.value" />
      <span class="market-layout__price">{{ marketData.stockDetail.value.price.toFixed(2) }}</span>
      <span
        class="market-layout__change"
        :class="marketData.stockDetail.value.up ? 'text-up' : 'text-down'"
      >
        {{ formatSign(marketData.stockDetail.value.change) }}
        ({{ formatPercent(marketData.stockDetail.value.percent) }})
      </span>
    </div>

    <RouterTabBar :tabs="tabs" :forward-query="true" class="market-layout__tabs" />

    <div class="market-layout__content">
      <router-view />
    </div>
  </div>
</template>

<style scoped lang="scss">
.market-layout {
  height: calc(100vh - var(--header-height) - 48px);
  display: flex;
  flex-direction: column;

  &__stock-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  &__code {
    font-size: 14px;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
  }

  &__price {
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    margin-left: auto;
  }

  &__change {
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__tabs {
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-height: 0;
  }
}
</style>
