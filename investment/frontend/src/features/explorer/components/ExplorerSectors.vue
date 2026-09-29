<script setup lang="ts">
import { ref } from 'vue'
import { formatPercent, formatBigNumber } from '@/utils/formatters'
import type { SectorSummary } from '@/types/explorer'
import Card from '@/components/ui/Card.vue'

defineProps<{
  sectors: SectorSummary[]
  loading: boolean
}>()

const emit = defineEmits<{
  goToStock: [code: string]
}>()

const expandedSector = ref<string | null>(null)

function toggleSector(name: string) {
  expandedSector.value = expandedSector.value === name ? null : name
}
</script>

<template>
  <div class="explorer-sectors">
    <div v-if="loading" class="explorer-sectors__placeholder">載入中...</div>

    <div v-else class="explorer-sectors__list">
      <Card
        v-for="sector in sectors"
        :key="sector.name"
        class="explorer-sectors__card"
        @click="toggleSector(sector.name)"
      >
        <div class="explorer-sectors__card-header">
          <div>
            <span class="explorer-sectors__card-name">{{ sector.name }}</span>
            <span class="text-muted explorer-sectors__card-count">{{ sector.stockCount }} 檔</span>
          </div>
          <div class="explorer-sectors__card-stats">
            <span
              class="explorer-sectors__card-change"
              :class="sector.up ? 'text-up' : 'text-down'"
            >
              平均 {{ formatPercent(sector.avgChange) }}
            </span>
            <span class="text-muted">成交額 {{ formatBigNumber(sector.totalTurnover) }}</span>
          </div>
        </div>

        <!-- Top movers -->
        <div class="explorer-sectors__movers">
          <div v-if="sector.topGainers.length" class="explorer-sectors__mover-group">
            <span class="text-muted explorer-sectors__mover-label">漲</span>
            <span
              v-for="g in sector.topGainers"
              :key="g.code"
              class="explorer-sectors__mover-chip text-up"
              @click.stop="emit('goToStock', g.code)"
            >
              {{ g.name }} {{ formatPercent(g.changePercent) }}
            </span>
          </div>
          <div v-if="sector.topLosers.length" class="explorer-sectors__mover-group">
            <span class="text-muted explorer-sectors__mover-label">跌</span>
            <span
              v-for="l in sector.topLosers"
              :key="l.code"
              class="explorer-sectors__mover-chip text-down"
              @click.stop="emit('goToStock', l.code)"
            >
              {{ l.name }} {{ formatPercent(l.changePercent) }}
            </span>
          </div>
        </div>

        <!-- Expanded: all stocks in sector -->
        <div v-if="expandedSector === sector.name" class="explorer-sectors__expanded">
          <table class="data-table">
            <thead>
              <tr>
                <th>代碼</th>
                <th>名稱</th>
                <th class="text-right">股價</th>
                <th class="text-right">漲跌%</th>
                <th class="text-right">成交量</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="st in sector.stocks"
                :key="st.code"
                class="explorer-sectors__stock-row"
                @click.stop="emit('goToStock', st.code)"
              >
                <td class="data-table__code">{{ st.code }}</td>
                <td class="data-table__name">{{ st.name }}</td>
                <td class="text-right data-table__num">{{ st.price.toFixed(2) }}</td>
                <td
                  class="text-right data-table__num"
                  :class="st.changePercent > 0 ? 'text-up' : st.changePercent < 0 ? 'text-down' : ''"
                >
                  {{ formatPercent(st.changePercent) }}
                </td>
                <td class="text-right data-table__num">{{ formatBigNumber(st.volume) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.explorer-sectors {
  &__placeholder {
    padding: 48px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  &__card {
    cursor: pointer;
    transition: border-color var(--duration-fast);

    &:hover {
      border-color: var(--color-border-hover);
    }
  }

  &__card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__card-name {
    font-size: var(--font-size-md);
    font-weight: 600;
  }

  &__card-count {
    font-size: var(--font-size-sm);
    margin-left: 8px;
  }

  &__card-stats {
    display: flex;
    gap: var(--gap-md);
    align-items: center;
    font-size: var(--font-size-base);
  }

  &__card-change {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__movers {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__mover-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__mover-label {
    font-size: var(--font-size-xs);
    font-weight: 600;
    width: 16px;
  }

  &__mover-chip {
    font-size: var(--font-size-sm);
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-hover);
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover {
      background: var(--color-bg-secondary);
    }
  }

  &__expanded {
    margin-top: 12px;
    border-top: 1px solid var(--color-border);
    padding-top: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  &__stock-row {
    cursor: pointer;
  }
}
</style>
