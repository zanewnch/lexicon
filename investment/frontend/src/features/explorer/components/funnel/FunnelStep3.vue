<script setup lang="ts">
import type { TechnicalResult } from '@/types/funnel'

defineProps<{
  results: TechnicalResult[]
  loading: boolean
  inputCount: number
}>()

const emit = defineEmits<{
  goToStock: [code: string]
}>()

function scoreLabel(score: number) {
  if (score >= 3) return '強勢'
  if (score >= 2) return '偏多'
  if (score >= 1) return '觀望'
  return '偏弱'
}

function scoreClass(score: number) {
  if (score >= 3) return 'funnel-step3__score--strong'
  if (score >= 2) return 'funnel-step3__score--good'
  if (score >= 1) return 'funnel-step3__score--neutral'
  return 'funnel-step3__score--weak'
}
</script>

<template>
  <div class="funnel-step3">
    <div class="funnel-step3__header">
      <h3 class="funnel-step3__title">Step 3 — 技術面進場（Entry Timing）</h3>
      <p class="funnel-step3__desc text-muted">
        對 {{ inputCount }} 檔股票進行技術面評分，找最佳進場點
      </p>
    </div>

    <div v-if="loading" class="funnel-step3__loading">
      <div class="funnel-step3__spinner" />
      <span class="text-muted">正在計算技術指標...</span>
    </div>

    <div v-else-if="results.length === 0" class="funnel-step3__empty text-muted">
      尚無結果
    </div>

    <table v-else class="funnel-step3__table">
      <thead>
        <tr>
          <th>代號</th>
          <th>均線多頭</th>
          <th>帶量突破</th>
          <th>RSI(14)</th>
          <th>KD</th>
          <th>MACD</th>
          <th>MA5</th>
          <th>MA10</th>
          <th>MA20</th>
          <th>綜合評分</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in results"
          :key="r.code"
          class="funnel-step3__row"
          @click="emit('goToStock', r.code)"
        >
          <td class="funnel-step3__code">{{ r.code }}</td>
          <td>
            <span :class="r.maAligned ? 'color-up' : 'color-down'">
              {{ r.maAligned ? '&#10003;' : '&#10007;' }}
            </span>
          </td>
          <td>
            <span :class="r.volumeBreakout ? 'color-up' : 'color-down'">
              {{ r.volumeBreakout ? '&#10003;' : '&#10007;' }}
            </span>
          </td>
          <td :class="{
            'color-up': r.rsi14 >= 40 && r.rsi14 <= 70,
            'color-down': r.rsi14 > 80 || r.rsi14 < 20,
          }">
            {{ r.rsi14.toFixed(1) }}
          </td>
          <td class="text-muted">
            {{ r.kd_k.toFixed(1) }} / {{ r.kd_d.toFixed(1) }}
          </td>
          <td :class="r.macd >= 0 ? 'color-up' : 'color-down'">
            {{ r.macd.toFixed(2) }}
          </td>
          <td class="text-muted">{{ r.ma5.toFixed(2) }}</td>
          <td class="text-muted">{{ r.ma10.toFixed(2) }}</td>
          <td class="text-muted">{{ r.ma20.toFixed(2) }}</td>
          <td>
            <span class="funnel-step3__score" :class="scoreClass(r.score)">
              {{ r.score }}/3 {{ scoreLabel(r.score) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.funnel-step3 {
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

  &__loading {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
    padding: 40px;
    justify-content: center;
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__empty {
    padding: 40px;
    text-align: center;
    font-size: var(--font-size-base);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    overflow-x: auto;

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

  &__score {
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: var(--font-size-xs);

    &--strong {
      background: rgba(34, 197, 94, 0.15);
      color: rgb(34, 197, 94);
    }

    &--good {
      background: rgba(59, 130, 246, 0.15);
      color: rgb(59, 130, 246);
    }

    &--neutral {
      background: rgba(245, 158, 11, 0.15);
      color: rgb(245, 158, 11);
    }

    &--weak {
      background: rgba(239, 68, 68, 0.15);
      color: rgb(239, 68, 68);
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
