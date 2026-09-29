<script setup lang="ts">
import { formatPercent, formatBigNumber } from '@/utils/formatters'
import type { FunnelStock, Layer2Filters, FilterPreset } from '@/types/funnel'

const props = defineProps<{
  results: FunnelStock[]
  loading: boolean
  filters: Layer2Filters
  activePreset: FilterPreset
  inputCount: number
}>()

const emit = defineEmits<{
  'update:filters': [filters: Layer2Filters]
  applyPreset: [preset: FilterPreset]
  run: []
  goToStock: [code: string]
}>()

function updateFilter(key: keyof Layer2Filters, value: string) {
  const num = value === '' ? null : Number(value)
  emit('update:filters', { ...props.filters, [key]: num })
}
</script>

<template>
  <div class="funnel-step2">
    <div class="funnel-step2__header">
      <h3 class="funnel-step2__title">Step 2 — 基本面篩選（Quantitative Filter）</h3>
      <p class="funnel-step2__desc text-muted">從 {{ inputCount }} 檔中篩選財務體質優良的標的</p>
    </div>

    <div class="funnel-step2__body">
      <!-- Filter panel -->
      <div class="funnel-step2__panel">
        <!-- Preset toggle -->
        <div class="funnel-step2__presets">
          <button
            class="funnel-step2__preset"
            :class="{ 'funnel-step2__preset--active': activePreset === 'conservative' }"
            @click="emit('applyPreset', 'conservative')"
          >穩健派</button>
          <button
            class="funnel-step2__preset"
            :class="{ 'funnel-step2__preset--active': activePreset === 'aggressive' }"
            @click="emit('applyPreset', 'aggressive')"
          >積極派</button>
        </div>

        <div class="funnel-step2__filters">
          <label class="funnel-step2__field">
            <span class="funnel-step2__label">
              本益比上限 (PE)
              <span class="funnel-step2__badge funnel-step2__badge--actual">實際</span>
            </span>
            <input
              type="number"
              class="funnel-step2__input"
              :value="filters.pe_max"
              @input="updateFilter('pe_max', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="funnel-step2__field">
            <span class="funnel-step2__label">
              股價淨值比上限 (PB)
              <span class="funnel-step2__badge funnel-step2__badge--actual">實際</span>
            </span>
            <input
              type="number"
              class="funnel-step2__input"
              :value="filters.pb_max"
              step="0.5"
              @input="updateFilter('pb_max', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="funnel-step2__field">
            <span class="funnel-step2__label">
              月營收 MoM 最低 (%)
              <span class="funnel-step2__badge funnel-step2__badge--actual">實際</span>
            </span>
            <input
              type="number"
              class="funnel-step2__input"
              :value="filters.mom_pct_min"
              @input="updateFilter('mom_pct_min', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="funnel-step2__field">
            <span class="funnel-step2__label">
              月營收 YoY 最低 (%)
              <span class="funnel-step2__badge funnel-step2__badge--actual">實際</span>
            </span>
            <input
              type="number"
              class="funnel-step2__input"
              :value="filters.yoy_pct_min"
              @input="updateFilter('yoy_pct_min', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="funnel-step2__field">
            <span class="funnel-step2__label">
              法人淨買超 (張)
              <span class="funnel-step2__badge funnel-step2__badge--actual">實際</span>
            </span>
            <input
              type="number"
              class="funnel-step2__input"
              :value="filters.inst_net_min ?? ''"
              placeholder="不限"
              @input="updateFilter('inst_net_min', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>

        <button class="funnel-step2__run" @click="emit('run')">
          執行篩選
        </button>
      </div>

      <!-- Results table -->
      <div class="funnel-step2__results">
        <div v-if="loading" class="funnel-step2__loading">
          <div v-for="i in 8" :key="i" class="funnel-step2__skeleton-row" />
        </div>

        <div v-else-if="results.length === 0" class="funnel-step2__empty text-muted">
          尚無結果，請調整條件後執行篩選
        </div>

        <table v-else class="funnel-step2__table">
          <thead>
            <tr>
              <th>代號</th>
              <th>名稱</th>
              <th>股價</th>
              <th>漲跌%</th>
              <th>PE</th>
              <th>PB</th>
              <th>MoM%</th>
              <th>YoY%</th>
              <th>法人淨買</th>
              <th>成交額</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in results"
              :key="s.code"
              class="funnel-step2__row"
              @click="emit('goToStock', s.code)"
            >
              <td class="funnel-step2__code">{{ s.code }}</td>
              <td>{{ s.name }}</td>
              <td>{{ s.price.toFixed(2) }}</td>
              <td :class="s.changePercent >= 0 ? 'color-up' : 'color-down'">
                {{ formatPercent(s.changePercent) }}
              </td>
              <td>{{ s.pe > 0 ? s.pe.toFixed(1) : '--' }}</td>
              <td>{{ s.pb > 0 ? s.pb.toFixed(2) : '--' }}</td>
              <td :class="(s.momPct ?? 0) >= 0 ? 'color-up' : 'color-down'">
                {{ s.momPct != null ? s.momPct.toFixed(1) + '%' : '--' }}
              </td>
              <td :class="(s.yoyPct ?? 0) >= 0 ? 'color-up' : 'color-down'">
                {{ s.yoyPct != null ? s.yoyPct.toFixed(1) + '%' : '--' }}
              </td>
              <td :class="(s.instNet ?? 0) >= 0 ? 'color-up' : 'color-down'">
                {{ s.instNet != null ? s.instNet.toLocaleString() : '--' }}
              </td>
              <td class="text-muted">{{ formatBigNumber(s.turnover) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="results.length > 0" class="funnel-step2__footer text-muted">
          共 {{ results.length }} 檔通過篩選
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.funnel-step2 {
  &__header {
    margin-bottom: var(--gap-lg);
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: var(--font-size-sm);
  }

  &__body {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: var(--gap-lg);

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  &__presets {
    display: flex;
    gap: var(--gap-xs);
  }

  &__preset {
    flex: 1;
    padding: 8px;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    transition: all var(--duration-fast);

    &:hover {
      border-color: var(--color-accent);
    }

    &--active {
      background: var(--color-accent);
      color: #fff;
      border-color: var(--color-accent);
    }
  }

  &__filters {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 500;

    &--actual {
      background: rgba(34, 197, 94, 0.15);
      color: rgb(34, 197, 94);
    }

    &--proxy {
      background: rgba(245, 158, 11, 0.15);
      color: rgb(245, 158, 11);
    }
  }

  &__input {
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-input, var(--color-bg-card));
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);

    &:focus {
      outline: none;
      border-color: var(--color-accent);
    }
  }

  &__run {
    padding: 10px;
    border-radius: var(--radius-md);
    font-weight: 600;
    background: var(--color-accent);
    color: #fff;
    margin-top: var(--gap-sm);

    &:hover {
      opacity: 0.9;
    }
  }

  &__results {
    min-width: 0;
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);

    th {
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--color-border-light, var(--color-border));
      white-space: nowrap;
    }
  }

  &__row {
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__code {
    font-weight: 600;
    color: var(--color-accent);
  }

  &__footer {
    padding: 12px 10px;
    font-size: var(--font-size-sm);
  }

  &__empty {
    padding: 40px;
    text-align: center;
    font-size: var(--font-size-base);
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: var(--gap-xs);
  }

  &__skeleton-row {
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-hover);
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
