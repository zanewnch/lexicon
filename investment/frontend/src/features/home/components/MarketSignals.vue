<script setup lang="ts">
/**
 * MarketSignals — 市場訊號展示元件
 *
 * 接受 `signals` prop（`MarketSignal[]`）並渲染列表。
 * 訊號來自 `useMarketSignals()` composable，
 * 積分此元件僅負責顯示，分析邏輯在 composable 中處理。
 *
 * 每個訊號顯示為卡片，含：
 * - 彩色圓點（up/down/warn/info）
 * - 標題（`label`）
 * - 詳細說明（`description`）
 */
import type { MarketSignal } from '@/types/market'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'

defineProps<{
  signals: MarketSignal[]
}>()
</script>

<template>
  <Card class="market-signals">
    <h2 class="section-title">
      市場訊號
      <HelpTip termKey="index.market-signals" />
    </h2>
    <div v-if="signals.length" class="market-signals__list">
      <div
        v-for="s in signals"
        :key="s.id"
        class="signal-chip"
        :class="`signal-chip--${s.severity}`"
      >
        <span class="signal-chip__dot"></span>
        <div class="signal-chip__content">
          <span class="signal-chip__label">{{ s.label }}</span>
          <span class="signal-chip__desc">{{ s.description }}</span>
        </div>
      </div>
    </div>
    <div v-else class="market-signals__empty">
      市場平穩，無特別訊號
    </div>
  </Card>
</template>

<style scoped lang="scss">
.market-signals {
  .section-title {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin-bottom: 14px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }

  &__empty {
    font-size: 13px;
    color: var(--color-text-muted);
    padding: 12px 0;
  }
}

.signal-chip {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-sm);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: transform var(--duration-fast) var(--ease-default), border-color var(--duration-fast) var(--ease-default);

  &:hover {
    transform: translateX(4px);
  }

  &--up:hover {
    border-color: var(--color-up);
  }

  &--down:hover {
    border-color: var(--color-down);
  }

  &--warn:hover {
    border-color: var(--color-warn);
  }

  &--info:hover {
    border-color: var(--color-accent);
  }

  &--up {
    background: var(--color-up-soft);
  }

  &--down {
    background: var(--color-down-soft);
  }

  &--warn {
    background: var(--color-warn-soft);
  }

  &--info {
    background: var(--color-accent-soft);
  }

  &__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 5px;
  }

  &--up &__dot {
    background: var(--color-up);
  }

  &--down &__dot {
    background: var(--color-down);
  }

  &--warn &__dot {
    background: var(--color-warn);
  }

  &--info &__dot {
    background: var(--color-accent);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__label {
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  &--up &__label {
    color: var(--color-up);
  }

  &--down &__label {
    color: var(--color-down);
  }

  &--warn &__label {
    color: var(--color-warn);
  }

  &--info &__label {
    color: var(--color-accent);
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }
}
</style>
