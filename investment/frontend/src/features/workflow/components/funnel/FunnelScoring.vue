<script setup lang="ts">
import { computed } from 'vue'
import FunnelIndicators from './FunnelIndicators.vue'

// ── 型別定義 ──────────────────────────────────────────────────
interface DimensionScore {
  score: number
  note: string
  updatedAt: string
}

interface FunnelScores {
  policy: DimensionScore
  tech: DimensionScore
  cycle: DimensionScore
  quarter: string
}

interface Indicator {
  id: string
  name: string
  category: string
  unit: string
  desc: string
  latest: number | null
  latest_date: string | null
  chg_1m: number | null
  chg_3m: number | null
  history: { date: string; close: number }[]
}

const props = defineProps<{
  scores: FunnelScores
  indicators: Indicator[]
  indicatorsLoading: boolean
  indicatorsError: string
}>()

const emit = defineEmits<{
  (e: 'update:score', dim: 'policy' | 'tech' | 'cycle', val: number): void
  (e: 'update:note', dim: 'policy' | 'tech' | 'cycle', val: string): void
  (e: 'refresh-indicators'): void
}>()

const totalScore = computed(() =>
  props.scores.policy.score + props.scores.tech.score + props.scores.cycle.score
)

const totalLabel = computed(() => {
  if (totalScore.value >= 8) return { text: '強烈做多', cls: 'label--bullish' }
  if (totalScore.value >= 6) return { text: '偏多觀察', cls: 'label--watch' }
  return { text: '保守等待', cls: 'label--bearish' }
})
</script>

<template>
  <div class="funnel-scoring">
    <!-- Header -->
    <div class="funnel-scoring__header">
      <div class="funnel-scoring__header-left">
        <h2 class="funnel-scoring__title">賽道漏斗</h2>
        <span class="funnel-scoring__quarter">{{ scores.quarter }}</span>
      </div>
      <div class="funnel-scoring__total" :class="totalLabel.cls">
        <span class="funnel-scoring__total-score">{{ totalScore }}/9</span>
        <span class="funnel-scoring__total-label">{{ totalLabel.text }}</span>
      </div>
    </div>

    <!-- 三個評分維度 -->
    <div class="funnel-scoring__dimensions">

      <!-- 政策導向 -->
      <div class="funnel-scoring__dim">
        <div class="funnel-scoring__dim-header">
          <div class="funnel-scoring__dim-badge funnel-scoring__dim-badge--policy">政策</div>
          <div class="funnel-scoring__dim-title">政策導向</div>
          <div class="funnel-scoring__dim-stars">
            <button
              v-for="n in 3"
              :key="n"
              class="funnel-scoring__star"
              :class="{ 'funnel-scoring__star--active': scores.policy.score >= n }"
              @click="emit('update:score', 'policy', n)"
            >★</button>
          </div>
        </div>
        <div class="funnel-scoring__dim-hint">政府預算、補貼、法案流向哪些產業？</div>
        <textarea
          class="funnel-scoring__note"
          placeholder="記錄本季政策觀察..."
          :value="scores.policy.note"
          @input="emit('update:note', 'policy', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
        />
        <div class="funnel-scoring__dim-examples">
          <span class="funnel-scoring__tag">綠能補貼</span>
          <span class="funnel-scoring__tag">半導體本土化</span>
          <span class="funnel-scoring__tag">國防預算</span>
          <span class="funnel-scoring__tag">AI算力</span>
        </div>
      </div>

      <!-- 技術變革 -->
      <div class="funnel-scoring__dim">
        <div class="funnel-scoring__dim-header">
          <div class="funnel-scoring__dim-badge funnel-scoring__dim-badge--tech">技術</div>
          <div class="funnel-scoring__dim-title">技術變革</div>
          <div class="funnel-scoring__dim-stars">
            <button
              v-for="n in 3"
              :key="n"
              class="funnel-scoring__star"
              :class="{ 'funnel-scoring__star--active': scores.tech.score >= n }"
              @click="emit('update:score', 'tech', n)"
            >★</button>
          </div>
        </div>
        <div class="funnel-scoring__dim-hint">哪些技術的滲透率正在快速拉升？大廠 Capex 往哪投？</div>
        <textarea
          class="funnel-scoring__note"
          placeholder="記錄本季技術觀察..."
          :value="scores.tech.note"
          @input="emit('update:note', 'tech', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
        />
        <div class="funnel-scoring__dim-examples">
          <span class="funnel-scoring__tag">AI 伺服器</span>
          <span class="funnel-scoring__tag">低軌衛星</span>
          <span class="funnel-scoring__tag">矽光子</span>
          <span class="funnel-scoring__tag">車用電子</span>
        </div>
      </div>

      <!-- 週期反轉 -->
      <div class="funnel-scoring__dim">
        <div class="funnel-scoring__dim-header">
          <div class="funnel-scoring__dim-badge funnel-scoring__dim-badge--cycle">週期</div>
          <div class="funnel-scoring__dim-title">週期反轉</div>
          <div class="funnel-scoring__dim-stars">
            <button
              v-for="n in 3"
              :key="n"
              class="funnel-scoring__star"
              :class="{ 'funnel-scoring__star--active': scores.cycle.score >= n }"
              @click="emit('update:score', 'cycle', n)"
            >★</button>
          </div>
        </div>
        <div class="funnel-scoring__dim-hint">報價連續回升 + 庫存天數下降 = 反轉訊號</div>
        <textarea
          class="funnel-scoring__note"
          placeholder="記錄本季週期觀察..."
          :value="scores.cycle.note"
          @input="emit('update:note', 'cycle', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
        />

        <!-- 自動抓取的指標 -->
        <FunnelIndicators
          :indicators="indicators"
          :loading="indicatorsLoading"
          :error="indicatorsError"
          @refresh="emit('refresh-indicators')"
        />
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
.funnel-scoring {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    &-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  &__quarter {
    font-size: 12px;
    color: var(--color-text-muted);
    background: var(--color-bg-hover);
    padding: 2px 8px;
    border-radius: 10px;
  }

  &__total {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);

    &-score {
      font-size: 18px;
      font-weight: 800;
    }

    &-label {
      font-size: 12px;
      font-weight: 600;
    }

    &.label--bullish {
      border-color: var(--color-up);
      .funnel-scoring__total-score,
      .funnel-scoring__total-label { color: var(--color-up); }
    }

    &.label--watch {
      border-color: #f59e0b;
      .funnel-scoring__total-score,
      .funnel-scoring__total-label { color: #f59e0b; }
    }

    &.label--bearish {
      border-color: var(--color-down);
      .funnel-scoring__total-score,
      .funnel-scoring__total-label { color: var(--color-down); }
    }
  }

  &__dimensions {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    flex: 1;
    overflow: hidden;
  }

  &__dim {
    padding: 16px;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;

    &:last-child {
      border-right: none;
    }

    &-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      flex-shrink: 0;

      &--policy {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }

      &--tech {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }

      &--cycle {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }
    }

    &-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-primary);
      flex: 1;
    }

    &-stars {
      display: flex;
      gap: 2px;
    }

    &-hint {
      font-size: 11px;
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    &-examples {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }

  &__star {
    font-size: 18px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-border);
    padding: 0 1px;
    transition: color 0.15s;

    &--active {
      color: #f59e0b;
    }

    &:hover {
      color: #f59e0b;
      opacity: 0.8;
    }
  }

  &__note {
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 12px;
    line-height: 1.6;
    resize: vertical;
    font-family: inherit;
    box-sizing: border-box;
    outline: none;

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__tag {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
  }
}
</style>
