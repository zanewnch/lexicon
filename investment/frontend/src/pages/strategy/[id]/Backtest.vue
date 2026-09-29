<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import EmptyState from '@/components/ui/EmptyState.vue'
import { CONDITION_LABELS } from '@/types/strategy'

interface BacktestSignal {
  date: string
  close: number
  volume: number
  conditions_met: string[]
}

interface BacktestStockResult {
  code: string
  name: string
  signals: BacktestSignal[]
  signal_count: number
  performance: {
    win_rate: number
    avg_return_pct: number
    best_return_pct: number
    worst_return_pct: number
  }
}

interface BacktestResult {
  strategy_id: string
  strategy_name: string
  days: number
  results: BacktestStockResult[]
  summary: {
    total_signals: number
    stocks_triggered: number
    stocks_tested: number
  }
}

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<BacktestResult | null>(null)
const days = ref(120)
const expandedStock = ref<string | null>(null)

async function runBacktest() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.post<BacktestResult>(`/strategies/${id}/backtest/`, { days: days.value })
    result.value = data
  } catch {
    error.value = '回測執行失敗'
  } finally {
    loading.value = false
  }
}

function toggleExpand(code: string) {
  expandedStock.value = expandedStock.value === code ? null : code
}

function condLabel(type: string) {
  return CONDITION_LABELS[type as keyof typeof CONDITION_LABELS] ?? type
}

function pctClass(val: number) {
  return val > 0 ? 'text-up' : val < 0 ? 'text-down' : ''
}

function formatPct(val: number) {
  const prefix = val > 0 ? '+' : ''
  return `${prefix}${val.toFixed(2)}%`
}

onMounted(runBacktest)
</script>

<template>
  <div class="backtest">
    <div class="backtest__top">
      <button class="backtest__back" @click="router.push(`/scanner/strategy/${id}`)">
        &larr; 返回策略
      </button>
      <h2 class="backtest__title">回測分析</h2>
      <span v-if="result" class="backtest__subtitle">{{ result.strategy_name }}</span>
    </div>

    <!-- 參數 -->
    <div class="backtest__params">
      <label class="backtest__param-label">回測天數</label>
      <select v-model.number="days" class="backtest__select">
        <option :value="30">30 天</option>
        <option :value="60">60 天</option>
        <option :value="120">120 天</option>
        <option :value="240">240 天</option>
        <option :value="365">365 天</option>
      </select>
      <button class="backtest__run-btn" :disabled="loading" @click="runBacktest">
        {{ loading ? '執行中...' : '執行回測' }}
      </button>
    </div>

    <div v-if="error" class="backtest__error">{{ error }}</div>

    <EmptyState v-if="loading && !result" :loading="true" message="回測分析中..." />

    <template v-if="result && !loading">
      <!-- 摘要 -->
      <div class="backtest__summary">
        <div class="backtest__summary-card">
          <span class="backtest__summary-label">測試股票數</span>
          <span class="backtest__summary-value">{{ result.summary.stocks_tested }}</span>
        </div>
        <div class="backtest__summary-card">
          <span class="backtest__summary-label">觸發股票數</span>
          <span class="backtest__summary-value">{{ result.summary.stocks_triggered }}</span>
        </div>
        <div class="backtest__summary-card">
          <span class="backtest__summary-label">總訊號數</span>
          <span class="backtest__summary-value">{{ result.summary.total_signals }}</span>
        </div>
        <div class="backtest__summary-card">
          <span class="backtest__summary-label">回測天數</span>
          <span class="backtest__summary-value">{{ result.days }}</span>
        </div>
      </div>

      <!-- 個股結果 -->
      <div class="backtest__results">
        <div
          v-for="stock in result.results.filter(r => r.signal_count > 0)"
          :key="stock.code"
          class="stock-result"
        >
          <div class="stock-result__header" @click="toggleExpand(stock.code)">
            <div class="stock-result__info">
              <span class="stock-result__code">{{ stock.code }}</span>
              <span class="stock-result__name">{{ stock.name }}</span>
              <span class="stock-result__count">{{ stock.signal_count }} 次觸發</span>
            </div>
            <div class="stock-result__perf">
              <span class="stock-result__metric">
                勝率 <strong>{{ stock.performance.win_rate }}%</strong>
              </span>
              <span class="stock-result__metric" :class="pctClass(stock.performance.avg_return_pct)">
                平均報酬 <strong>{{ formatPct(stock.performance.avg_return_pct) }}</strong>
              </span>
              <span class="stock-result__arrow" :class="{ 'stock-result__arrow--open': expandedStock === stock.code }">›</span>
            </div>
          </div>

          <!-- 展開明細 -->
          <div v-if="expandedStock === stock.code" class="stock-result__detail">
            <div class="stock-result__perf-detail">
              <span :class="pctClass(stock.performance.best_return_pct)">
                最佳 {{ formatPct(stock.performance.best_return_pct) }}
              </span>
              <span :class="pctClass(stock.performance.worst_return_pct)">
                最差 {{ formatPct(stock.performance.worst_return_pct) }}
              </span>
            </div>
            <table class="stock-result__table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>收盤價</th>
                  <th>成交量</th>
                  <th>觸發條件</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sig in stock.signals" :key="sig.date">
                  <td>{{ sig.date }}</td>
                  <td>{{ sig.close.toFixed(2) }}</td>
                  <td>{{ sig.volume.toLocaleString() }}</td>
                  <td>
                    <span v-for="c in sig.conditions_met" :key="c" class="stock-result__cond-tag">
                      {{ condLabel(c) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 無觸發 -->
        <div v-if="result.results.every(r => r.signal_count === 0)" class="backtest__empty">
          在過去 {{ result.days }} 天內，沒有任何股票觸發此策略的條件。
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.backtest {
  &__top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__back {
    font-size: 13px;
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: all var(--duration-fast);

    &:hover {
      color: var(--color-accent);
      background: var(--color-accent-soft);
    }
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
  }

  &__subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
  }

  &__params {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
  }

  &__param-label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__select {
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;

    &:focus {
      border-color: var(--color-accent);
    }
  }

  &__run-btn {
    padding: 6px 16px;
    border-radius: var(--radius-md);
    border: none;
    background: var(--color-accent);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-fast);

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__error {
    padding: 12px 16px;
    margin-bottom: var(--gap-md);
    border-radius: var(--radius-md);
    background: var(--color-down-soft);
    color: var(--color-down);
    font-size: 13px;
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--gap-md);
    margin-bottom: 20px;
  }

  &__summary-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
  }

  &__summary-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__summary-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }

  &__empty {
    padding: 48px 20px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }
}

.stock-result {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__info {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  &__code {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent);
    font-variant-numeric: tabular-nums;
  }

  &__name {
    font-size: 13px;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &__count {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
  }

  &__perf {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
  }

  &__metric {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);

    strong {
      font-weight: 700;
    }
  }

  &__arrow {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-muted);
    transition: transform var(--duration-fast);

    &--open {
      transform: rotate(90deg);
    }
  }

  &__detail {
    border-top: 1px solid var(--color-border);
    padding: 12px 16px;
  }

  &__perf-detail {
    display: flex;
    gap: 20px;
    font-size: var(--font-size-sm);
    margin-bottom: 12px;
    color: var(--color-text-secondary);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);

    th {
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
    }

    td {
      padding: 6px 8px;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      font-variant-numeric: tabular-nums;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__cond-tag {
    display: inline-block;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--color-bg-hover);
    color: var(--color-text-muted);
    margin-right: 4px;
  }
}

.text-up {
  color: var(--color-up);
}

.text-down {
  color: var(--color-down);
}
</style>
