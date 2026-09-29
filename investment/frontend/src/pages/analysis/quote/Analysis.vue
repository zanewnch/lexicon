<script setup lang="ts">
import { inject, computed } from 'vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import Card from '@/components/ui/Card.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import { useStockAnalysis } from '@/features/market/composables/useStockAnalysis'
import type { AnalysisCategory, StockSignal } from '@/types/market'

const marketData = inject<any>('marketData')!
const { stockDetail, technicals, detailAvailable, technicalsAvailable, isDummy } = marketData

const { analysis } = useStockAnalysis(stockDetail, technicals)

const categoryLabels: Record<AnalysisCategory, string> = {
  fundamental: '基本面',
  technical: '技術面',
  trend: '均線趨勢',
  volume: '量價',
}

const categoryOrder: AnalysisCategory[] = ['fundamental', 'technical', 'trend', 'volume']

const groupedSignals = computed(() => {
  const map = new Map<AnalysisCategory, StockSignal[]>()
  for (const cat of categoryOrder) {
    map.set(cat, [])
  }
  for (const s of analysis.value.signals) {
    map.get(s.category)?.push(s)
  }
  return map
})

const verdictLabel = computed(() => {
  const v = analysis.value.summary.verdict
  return v === 'bullish' ? '偏多' : v === 'bearish' ? '偏空' : '中性'
})

const verdictClass = computed(() => {
  return `analysis-summary__verdict--${analysis.value.summary.verdict}`
})
</script>

<template>
  <div class="analysis-view">
    <div v-if="!detailAvailable || !technicalsAvailable" class="text-muted">報價或技術指標尚未取得，暫無法計算綜合判定。</div>
    <template v-else>
    <!-- Summary -->
    <Card class="analysis-summary">
      <h2 class="analysis-summary__title">
        綜合判定
        <HelpTip text="根據基本面、技術面、均線趨勢與量價等規則，自動判讀目前個股的多空方向。僅供參考，不構成投資建議。" />
        <DummyBadge :show="isDummy" />
      </h2>
      <div class="analysis-summary__body">
        <span class="analysis-summary__verdict" :class="verdictClass">
          {{ verdictLabel }}
        </span>
        <div class="analysis-summary__stats">
          <div class="analysis-summary__stat">
            <span class="analysis-summary__stat-value text-up">{{ analysis.summary.bullish }}</span>
            <span class="analysis-summary__stat-label">偏多訊號</span>
          </div>
          <div class="analysis-summary__stat">
            <span class="analysis-summary__stat-value text-down">{{ analysis.summary.bearish }}</span>
            <span class="analysis-summary__stat-label">偏空訊號</span>
          </div>
          <div class="analysis-summary__stat">
            <span class="analysis-summary__stat-value">{{ analysis.summary.neutral }}</span>
            <span class="analysis-summary__stat-label">中性 / 警示</span>
          </div>
        </div>
      </div>
    </Card>

    <!-- Signal categories -->
    <div class="analysis-view__categories">
      <Card
        v-for="cat in categoryOrder"
        :key="cat"
        class="analysis-category"
      >
        <h3 class="analysis-category__title">{{ categoryLabels[cat] }}</h3>
        <div v-if="groupedSignals.get(cat)?.length" class="analysis-category__list">
          <div
            v-for="signal in groupedSignals.get(cat)"
            :key="signal.id"
            class="analysis-signal"
          >
            <span
              class="analysis-signal__indicator"
              :class="`analysis-signal__indicator--${signal.severity}`"
            />
            <div class="analysis-signal__content">
              <span class="analysis-signal__label">{{ signal.label }}</span>
              <span class="analysis-signal__description">{{ signal.description }}</span>
            </div>
          </div>
        </div>
        <p v-else class="analysis-category__empty">此分類無特殊訊號</p>
      </Card>
    </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.analysis-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.analysis-summary {
  padding: 16px;
  flex-shrink: 0;

  &__title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px;
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  &__verdict {
    font-size: 28px;
    font-weight: 800;
    padding: 4px 16px;
    border-radius: var(--radius-md);

    &--bullish {
      color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }

    &--bearish {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    &--neutral {
      color: var(--color-text-muted);
      background: var(--color-bg-hover);
    }
  }

  &__stats {
    display: flex;
    gap: 20px;
    margin-left: auto;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  &__stat-label {
    font-size: 11px;
    color: var(--color-text-muted);
  }
}

.analysis-view__categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  min-height: 0;
}

.analysis-category {
  padding: 14px;

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
    margin: 0 0 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__empty {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
    font-style: italic;
  }
}

.analysis-signal {
  display: flex;
  gap: 10px;
  align-items: flex-start;

  &__indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;

    &--up {
      background: #22c55e;
    }

    &--down {
      background: #ef4444;
    }

    &--warn {
      background: #f59e0b;
    }

    &--info {
      background: #3b82f6;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
  }

  &__description {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

@media (max-width: 800px) {
  .analysis-view__categories {
    grid-template-columns: 1fr;
  }

  .analysis-summary__body {
    flex-direction: column;
    align-items: flex-start;
  }

  .analysis-summary__stats {
    margin-left: 0;
  }
}
</style>
