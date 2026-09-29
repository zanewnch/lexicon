<script setup lang="ts">
/**
 * SimulationBanner — 模擬模式警示橫幅
 *
 * 只有在 `useMarketStore().isSimulation` 為 true 時才會顯示。
 * 支援兩種顯示模式：
 * - `inline: false`（預設）— 黃色邊框橫幅警示列
 * - `inline: true` — 透明小字提示，適合小區塊內嵌入
 *
 * `message` prop 可褶蓋預設文字。
 */
import { useMarketStore } from '@/store/market'

defineProps<{
  message?: string
  inline?: boolean
}>()

const app = useMarketStore()
</script>

<template>
  <div v-if="app.isSimulation" class="sim-banner" :class="{ 'sim-banner--inline': inline }">
    <span class="sim-banner__icon">⚠</span>
    <span class="sim-banner__text">
      {{ message || (inline ? '模擬模式下此功能無法使用' : '目前為模擬模式，部分帳戶功能（如帳戶餘額、交割資訊）無法使用，顯示的資料可能不完整。') }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.sim-banner {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: 10px var(--gap-md);
  margin-bottom: var(--gap-md);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.25);
  color: var(--text-secondary, #94a3b8);

  &--inline {
    justify-content: center;
    margin-bottom: 0;
    min-height: 60px;
    border: none;
    background: transparent;
    color: var(--color-text-muted, #64748b);
    font-size: 13px;
  }

  &__icon {
    flex-shrink: 0;
    font-size: var(--font-size-md);
    color: #f59e0b;
  }

  &--inline &__icon {
    font-size: 14px;
  }

  &__text {
    flex: 1;
  }
}
</style>
