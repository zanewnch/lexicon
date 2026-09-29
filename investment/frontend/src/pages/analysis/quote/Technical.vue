<script setup lang="ts">
import { ref, inject } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import SparkLine from '@/components/ui/SparkLine.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import { formatSign } from '@/utils/formatters'

const marketData = inject<any>('marketData')!
const { stockDetail, klineData, klineLabels, technicals, technicalsAvailable, isDummy, klineLoading, fetchKline } = marketData

const selectedPeriod = ref('日K')
const periods = ['日K', '週K', '月K', '5分K']

const periodMap: Record<string, { period: string; limit: number }> = {
  '日K': { period: 'Day', limit: 30 },
  '週K': { period: 'Week', limit: 26 },
  '月K': { period: 'Month', limit: 12 },
  '5分K': { period: '5Min', limit: 60 },
}

function onPeriodChange(p: string) {
  selectedPeriod.value = p
  const params = periodMap[p] ?? periodMap['日K']!
  fetchKline(params!.period, params!.limit)
}
</script>

<template>
  <div class="technical-view">
    <!-- Chart -->
    <Card class="technical-view__chart">
      <div class="technical-view__chart-header">
        <h2 class="technical-view__section-title">
          走勢圖
          <HelpTip text="K線圖是觀察股票價格走勢的核心工具。透過不同週期（日/週/月）可觀察短中長期趨勢。" />
          <DummyBadge :show="isDummy" />
        </h2>
        <div class="technical-view__chart-periods">
          <button
            v-for="p in periods"
            :key="p"
            class="technical-view__period-btn"
            :class="{ 'technical-view__period-btn--active': selectedPeriod === p }"
            @click="onPeriodChange(p)"
          >
            {{ p }}
          </button>
        </div>
      </div>
      <div class="technical-view__chart-body">
        <div v-if="klineLoading">K 線載入中…</div>
        <div v-else-if="!klineData.length">K 線資料暫時無法取得</div>
        <SparkLine
          v-else
          :data="klineData"
          :labels="klineLabels"
          :color="stockDetail.up ? '#22c55e' : '#ef4444'"
          :show-axes="true"
        />
      </div>
    </Card>

    <!-- Technicals -->
    <div v-if="!technicalsAvailable" class="technical-view__indicators text-muted">技術指標資料暫時無法取得</div>
    <div v-else class="technical-view__indicators">
      <Card class="technical-view__indicator-card">
        <h3 class="technical-view__indicator-title">
          移動平均線 (MA)
          <HelpTip text="均線是一段時間內的平均成交價。MA5 為 5 日均線，越短越敏感。股價站上均線通常視為多頭訊號。" />
        </h3>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">MA5</span>
          <span class="technical-view__indicator-value">{{ technicals.ma5.toFixed(2) }}</span>
        </div>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">MA10</span>
          <span class="technical-view__indicator-value">{{ technicals.ma10.toFixed(2) }}</span>
        </div>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">MA20</span>
          <span class="technical-view__indicator-value">{{ technicals.ma20.toFixed(2) }}</span>
        </div>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">MA60</span>
          <span class="technical-view__indicator-value">{{ technicals.ma60.toFixed(2) }}</span>
        </div>
      </Card>

      <Card class="technical-view__indicator-card">
        <h3 class="technical-view__indicator-title">
          KD 隨機指標
          <HelpTip text="KD 值介於 0~100。K > 80 為超買區（可能回跌），K < 20 為超賣區（可能反彈）。K 值向上穿越 D 值為黃金交叉。" />
        </h3>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">K</span>
          <span
            class="technical-view__indicator-value"
            :class="technicals.kd_k > 80 ? 'text-down' : technicals.kd_k < 20 ? 'text-up' : ''"
          >{{ technicals.kd_k.toFixed(1) }}</span>
        </div>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">D</span>
          <span class="technical-view__indicator-value">{{ technicals.kd_d.toFixed(1) }}</span>
        </div>
      </Card>

      <Card class="technical-view__indicator-card">
        <h3 class="technical-view__indicator-title">
          RSI
          <HelpTip text="RSI 衡量漲跌力道。RSI > 70 為超買（可能過熱），RSI < 30 為超賣（可能被低估）。" />
        </h3>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">RSI(14)</span>
          <span
            class="technical-view__indicator-value"
            :class="technicals.rsi14 > 70 ? 'text-down' : technicals.rsi14 < 30 ? 'text-up' : ''"
          >{{ technicals.rsi14.toFixed(1) }}</span>
        </div>
      </Card>

      <Card class="technical-view__indicator-card">
        <h3 class="technical-view__indicator-title">
          MACD
          <HelpTip text="MACD 用於判斷趨勢轉折。DIF 向上穿越 MACD 為買入訊號，柱狀體由負轉正代表多頭力道增強。" />
        </h3>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">DIF</span>
          <span class="technical-view__indicator-value">{{ technicals.macd.toFixed(2) }}</span>
        </div>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">MACD</span>
          <span class="technical-view__indicator-value">{{ technicals.signal.toFixed(2) }}</span>
        </div>
        <div class="technical-view__indicator-item">
          <span class="technical-view__indicator-label">柱狀</span>
          <span
            class="technical-view__indicator-value"
            :class="technicals.histogram > 0 ? 'text-up' : 'text-down'"
          >{{ formatSign(technicals.histogram) }}</span>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.technical-view {
  height: 100%;
  display: grid;
  grid-template-rows: 3fr 2fr;
  gap: 12px;
  overflow: hidden;

  &__chart {
    padding: 12px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  &__chart-periods {
    display: flex;
    gap: 4px;
  }

  &__chart-body {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }

  &__period-btn {
    padding: 4px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    transition: all 0.2s;

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }
  }

  &__indicators {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    min-height: 0;
  }

  &__indicator-card {
    padding: 12px;
    overflow-y: auto;
  }

  &__indicator-title {
    font-size: 12px;
    color: var(--color-text-muted);
    font-weight: 500;
    margin-bottom: 10px;
  }

  &__indicator-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
  }

  &__indicator-label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__indicator-value {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
}

@media (max-width: 1000px) {
  .technical-view {
    &__indicators {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 900px) {
  .technical-view {
    height: auto;
    overflow: visible;

    &__indicators {
      grid-template-columns: 1fr;
    }
  }
}
</style>
