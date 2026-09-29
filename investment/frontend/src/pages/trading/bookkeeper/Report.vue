<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { BookText, RefreshCw, TrendingUp, TrendingDown, Target } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { useTradingData } from '@/features/trade/composables/useTradingData'
import { formatSign } from '@/utils/formatters'

const { report, refreshAll, loading, venue } = useTradingData()

onMounted(() => {
  refreshAll()
})

const equityPath = computed(() => {
  const curve = report.value?.equityCurve ?? []
  if (curve.length < 2) return ''
  const values = curve.map((p) => p.equity)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const range = max - min || 1
  const w = 800
  const h = 200
  return curve
    .map((p, i) => {
      const x = (i / (curve.length - 1)) * w
      const y = h - ((p.equity - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const zeroY = computed(() => {
  const curve = report.value?.equityCurve ?? []
  if (curve.length < 2) return 200
  const values = curve.map((p) => p.equity)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const range = max - min || 1
  return 200 - ((0 - min) / range) * 200
})
</script>

<template>
  <div class="report">
    <PageHeader subtitle="累積損益、勝率、風險指標、權益曲線" align="center">
      <template #title>
        <BookText :size="24" />
        Bookkeeper · 報表
      </template>
      <template #actions>
        <select v-model="venue" @change="refreshAll">
          <option value="paper">紙上交易</option>
          <option value="broker_simulation">券商模擬</option>
          <option value="broker_production">正式交易</option>
        </select>
        <button class="btn btn--ghost" :disabled="loading" @click="refreshAll">
          <RefreshCw :size="16" />
          刷新
        </button>
      </template>
    </PageHeader>

    <Card v-if="!report" class="report__empty">
      {{ loading ? '載入中…' : '尚無交易紀錄' }}
    </Card>

    <template v-else>
      <!-- KPI 四卡 -->
      <div class="report__kpi-grid">
        <Card class="report__kpi">
          <div class="report__kpi-label">
            <TrendingUp :size="16" />
            總損益
          </div>
          <div
            class="report__kpi-value"
            :class="{ 'text-up': report.totalPnl > 0, 'text-down': report.totalPnl < 0 }"
          >
            {{ formatSign(report.totalPnl) }}
          </div>
        </Card>
        <Card class="report__kpi">
          <div class="report__kpi-label">
            <Target :size="16" />
            勝率
          </div>
          <div class="report__kpi-value">{{ report.winRate.toFixed(1) }}%</div>
          <div class="report__kpi-sub">
            {{ report.wins }} 勝 / {{ report.losses }} 敗
          </div>
        </Card>
        <Card class="report__kpi">
          <div class="report__kpi-label">期望值</div>
          <div
            class="report__kpi-value"
            :class="{ 'text-up': report.expectancy > 0, 'text-down': report.expectancy < 0 }"
          >
            {{ formatSign(report.expectancy) }}
          </div>
          <div class="report__kpi-sub">每筆平均</div>
        </Card>
        <Card class="report__kpi">
          <div class="report__kpi-label">
            <TrendingDown :size="16" />
            最大回撤
          </div>
          <div class="report__kpi-value text-down">
            -{{ report.maxDrawdown.toFixed(0) }}
          </div>
          <div class="report__kpi-sub">{{ report.maxDrawdownPct.toFixed(2) }}%</div>
        </Card>
      </div>

      <!-- 權益曲線 -->
      <Card class="report__card">
        <h2 class="report__card-title">權益曲線</h2>
        <div v-if="report.equityCurve.length < 2" class="report__empty">
          成交筆數不足以繪製曲線
        </div>
        <svg v-else class="report__chart" viewBox="0 0 800 200" preserveAspectRatio="none">
          <line
            :x1="0" :x2="800" :y1="zeroY" :y2="zeroY"
            stroke="var(--color-border)" stroke-dasharray="4 4" stroke-width="1"
          />
          <path
            :d="`${equityPath} L800,${zeroY} L0,${zeroY} Z`"
            fill="var(--color-accent-soft)"
            opacity="0.4"
          />
          <path :d="equityPath" fill="none" stroke="var(--color-accent)" stroke-width="2" />
        </svg>
        <div class="report__chart-meta">
          <span>起點</span>
          <span>{{ report.closedTrades }} 筆已平倉 · {{ report.totalTrades }} 筆總計</span>
        </div>
      </Card>

      <!-- 風險指標 -->
      <Card class="report__card">
        <h2 class="report__card-title">風險指標</h2>
        <div class="report__metrics">
          <div class="report__metric">
            <span class="report__metric-label">Sharpe</span>
            <span class="report__metric-value">{{ report.sharpe.toFixed(3) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">Sortino</span>
            <span class="report__metric-value">{{ report.sortino.toFixed(3) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">Calmar</span>
            <span class="report__metric-value">{{ report.calmar.toFixed(3) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">Profit Factor</span>
            <span class="report__metric-value">{{ report.profitFactor.toFixed(2) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">平均獲利</span>
            <span class="report__metric-value text-up">{{ formatSign(report.avgWin) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">平均虧損</span>
            <span class="report__metric-value text-down">-{{ report.avgLoss.toFixed(0) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">總獲利</span>
            <span class="report__metric-value text-up">{{ formatSign(report.grossProfit) }}</span>
          </div>
          <div class="report__metric">
            <span class="report__metric-label">總虧損</span>
            <span class="report__metric-value text-down">-{{ report.grossLoss.toFixed(0) }}</span>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>

<style scoped lang="scss">
.report {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);


  &__empty {
    padding: var(--gap-lg);
    text-align: center;
    color: var(--color-text-muted);
  }

  &__kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--gap-md);
  }

  &__kpi {
    padding: var(--gap-md);
    display: flex;
    flex-direction: column;
    gap: 8px;

    &-label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    &-value {
      font-size: 28px;
      font-weight: 700;
      font-family: var(--font-mono, monospace);
      color: var(--color-text-primary);
    }

    &-sub {
      color: var(--color-text-muted);
      font-size: 12px;
    }
  }

  &__card {
    padding: var(--gap-lg);
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  &__card-title {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 600;
  }

  &__chart {
    width: 100%;
    height: 240px;
    display: block;
  }

  &__chart-meta {
    display: flex;
    justify-content: space-between;
    color: var(--color-text-muted);
    font-size: 12px;
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--gap-md);
  }

  &__metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);

    &-label {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    &-value {
      font-size: var(--font-size-md);
      font-weight: 600;
      font-family: var(--font-mono, monospace);
    }
  }
}
</style>
