<script setup lang="ts">
import HelpTip from '@/components/ui/HelpTip.vue'
import { formatPercent, formatBigNumber } from '@/utils/formatters'

interface TreemapSectorGroup {
  sector: string
  totalTurnover: number
  items: {
    code: string
    name: string
    sector: string
    exchange: string
    price: number
    changePercent: number
    turnover: number
  }[]
}

defineProps<{
  treemapSectors: TreemapSectorGroup[]
  loading: boolean
}>()

const emit = defineEmits<{
  goToStock: [code: string]
}>()

function heatColor(pct: number): string {
  if (pct >= 5) return '#16a34a'
  if (pct >= 3) return '#22c55e'
  if (pct >= 1) return '#4ade80'
  if (pct >= 0.1) return '#86efac'
  if (pct > -0.1) return '#6b7280'
  if (pct > -1) return '#fca5a5'
  if (pct > -3) return '#f87171'
  if (pct > -5) return '#ef4444'
  return '#dc2626'
}
</script>

<template>
  <div class="explorer-treemap">
    <p class="text-muted explorer-treemap__hint">
      面積代表成交額（相對大小），顏色代表今日漲跌幅。點擊可查看個股行情。
      <HelpTip termKey="analysis.treemap" />
    </p>

    <div v-if="loading" class="explorer-treemap__placeholder">載入中...</div>

    <div v-else class="explorer-treemap__container">
      <div v-for="group in treemapSectors" :key="group.sector" class="explorer-treemap__sector">
        <div class="explorer-treemap__sector-label">{{ group.sector }}</div>
        <div class="explorer-treemap__grid">
          <div
            v-for="item in group.items"
            :key="item.code"
            class="explorer-treemap__cell"
            :style="{
              backgroundColor: heatColor(item.changePercent),
              flexGrow: Math.max(1, Math.log10(item.turnover + 1) - 5),
            }"
            :title="`${item.code} ${item.name}\n${item.price.toFixed(2)} (${formatPercent(item.changePercent)})\n成交額: ${formatBigNumber(item.turnover)}`"
            @click="emit('goToStock', item.code)"
          >
            <span class="explorer-treemap__code">{{ item.code }}</span>
            <span class="explorer-treemap__name">{{ item.name }}</span>
            <span class="explorer-treemap__pct">{{ formatPercent(item.changePercent) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.explorer-treemap {
  &__hint {
    margin-bottom: 16px;
  }

  &__placeholder {
    padding: 48px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  &__sector {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__sector-label {
    padding: var(--gap-sm) 14px;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    padding: 4px;
    gap: 3px;
  }

  &__cell {
    flex: 1 1 80px;
    min-width: 70px;
    max-width: 160px;
    padding: 8px 6px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    transition: transform var(--duration-fast), box-shadow var(--duration-fast);

    &:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-md);
      z-index: 1;
    }
  }

  &__code {
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
  }

  &__name {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &__pct {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
  }
}
</style>
