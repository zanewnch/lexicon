<script setup lang="ts">
import { inject } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import StockKlineChart from '@/features/market/components/StockKlineChart.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import { formatCurrency, formatBigNumber } from '@/utils/formatters'

const marketData = inject<any>('marketData')!
const { stockDetail, klineBars, orderBook, ticks, isDummy, loading, klineLoading, fetchKline } = marketData
</script>

<template>
  <div class="quote-view">
    <!-- Row 1: K 線圖 + 報價卡 -->
    <div class="quote-view__row1">
      <Card class="quote-view__chart">
        <StockKlineChart
          :bars="klineBars"
          :loading="klineLoading"
          :name="stockDetail.name"
          :code="stockDetail.code"
          @period-change="(period, limit, keepPrevious) => fetchKline(period, limit, keepPrevious)"
        />
      </Card>
      <Card class="quote-view__details">
        <!-- Skeleton: 報價卡 -->
        <div v-if="loading" class="quote-view__detail-grid">
          <div v-for="n in 12" :key="n" class="quote-view__detail-item">
            <SkeletonBlock width="36px" height="14px" />
            <SkeletonBlock width="60px" height="14px" />
          </div>
        </div>
        <div v-else class="quote-view__detail-grid">
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">開盤 <HelpTip term-key="quote.open" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.open.toFixed(2) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">最高 <HelpTip term-key="quote.high" /></span>
            <span class="quote-view__detail-value text-up">{{ stockDetail.high.toFixed(2) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">最低 <HelpTip term-key="quote.low" /></span>
            <span class="quote-view__detail-value text-down">{{ stockDetail.low.toFixed(2) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">昨收 <HelpTip term-key="quote.prev-close" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.prevClose.toFixed(2) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">成交量 <HelpTip term-key="quote.volume" /></span>
            <span class="quote-view__detail-value">{{ formatCurrency(stockDetail.volume) }} 張</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">成交額 <HelpTip term-key="quote.turnover" /></span>
            <span class="quote-view__detail-value">{{ formatBigNumber(stockDetail.turnover) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">振幅 <HelpTip term-key="quote.amplitude"
              supplement="怎麼看：先和同一檔股票過去約 20 個交易日常見的日振幅比。假設平常約 1%，今天 3% 就算放大；若平常約 4%，今天 3% 則不特別大。振幅只看當天高低價差，不代表收漲或收跌；再看收盤靠近最高或最低價，以及成交量有沒有變多。" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.amplitude.toFixed(2) }}%</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">本益比 <HelpTip term-key="quote.pe"
              supplement="怎麼看：先和這家公司過去的本益比、營運相近的同業比，再看獲利有沒有成長。倍數低可能是市場擔心未來獲利，不一定是便宜；公司虧損時也不適合用本益比判斷。" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.pe.toFixed(1) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">股淨比 <HelpTip term-key="quote.pb"
              supplement="怎麼看：先和這家公司過去的股淨比、營運相近的同業比，再看公司用資產賺錢的能力。股淨比偏低時，要確認公司是否持續賺錢、帳面資產是否可靠；偏高時，要看獲利能否支撐價格。" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.pb.toFixed(1) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">市值 <HelpTip term-key="quote.market-cap" /></span>
            <span class="quote-view__detail-value">{{ formatBigNumber(stockDetail.marketCap) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">EPS <HelpTip term-key="quote.eps" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.eps.toFixed(2) }}</span>
          </div>
          <div class="quote-view__detail-item">
            <span class="quote-view__detail-label">殖利率 <HelpTip term-key="quote.dividend-yield" /></span>
            <span class="quote-view__detail-value">{{ stockDetail.dividendYield.toFixed(2) }}%</span>
          </div>
        </div>
      </Card>

    </div>

    <!-- Row 2: 五檔 + 成交明細 -->
    <div class="quote-view__row2">
      <Card class="quote-view__orderbook">
        <h2 class="quote-view__section-title">
          五檔報價
          <HelpTip text="五檔報價顯示尚未成交的最高 5 個委買價、最低 5 個委賣價，以及各價位等待成交的張數。委買是有人想買的價格，委賣是有人想賣的價格；這些掛單可能變動或撤銷，不代表已經成交。" />
          <DummyBadge :show="isDummy" />
        </h2>
        <!-- Skeleton: 五檔 -->
        <div v-if="loading" class="orderbook">
          <div class="orderbook__side">
            <div v-for="n in 5" :key="'sa' + n" class="orderbook__row">
              <SkeletonBlock width="70px" height="14px" />
              <SkeletonBlock width="40px" height="14px" />
            </div>
          </div>
          <div class="orderbook__divider"></div>
          <div class="orderbook__side">
            <div v-for="n in 5" :key="'sb' + n" class="orderbook__row">
              <SkeletonBlock width="70px" height="14px" />
              <SkeletonBlock width="40px" height="14px" />
            </div>
          </div>
        </div>
        <div v-else-if="orderBook.asks.length === 0 && orderBook.bids.length === 0" class="orderbook orderbook--empty">
          <span class="text-muted">休市中，暫無報價資料</span>
        </div>
        <div v-else class="orderbook">
          <div class="orderbook__side">
            <div class="orderbook__header">
              <span>委賣價</span>
              <span>委賣量</span>
            </div>
            <div v-for="(ask, i) in orderBook.asks" :key="'a' + i" class="orderbook__row">
              <span class="text-down">{{ ask.price.toFixed(2) }}</span>
              <span>{{ ask.volume }}</span>
              <div class="orderbook__bar orderbook__bar--ask" :style="{ width: `${(ask.volume / 400) * 100}%` }"></div>
            </div>
          </div>
          <div class="orderbook__divider"></div>
          <div class="orderbook__side">
            <div class="orderbook__header">
              <span>委買價</span>
              <span>委買量</span>
            </div>
            <div v-for="(bid, i) in orderBook.bids" :key="'b' + i" class="orderbook__row">
              <span class="text-up">{{ bid.price.toFixed(2) }}</span>
              <span>{{ bid.volume }}</span>
              <div class="orderbook__bar orderbook__bar--bid" :style="{ width: `${(bid.volume / 400) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </Card>

      <Card class="quote-view__ticks">
        <h2 class="quote-view__section-title">
          成交明細
          <HelpTip text="成交明細列出最近已成交交易的時間、價格和張數。它和五檔報價不同：這裡是成交紀錄，五檔則是尚未成交的委託。可用來觀察交易是否活躍，但單筆成交不能判定後續漲跌。" />
          <DummyBadge :show="isDummy" />
        </h2>
        <div class="tick-list">
          <div class="tick-list__header">
            <span>時間</span>
            <span>價格</span>
            <span>張數</span>
          </div>
          <!-- Skeleton: 成交明細 -->
          <div v-if="loading" class="tick-list__body">
            <div v-for="n in 8" :key="'st' + n" class="tick-list__row">
              <SkeletonBlock width="56px" height="14px" />
              <SkeletonBlock width="64px" height="14px" />
              <SkeletonBlock width="32px" height="14px" />
            </div>
          </div>
          <div v-else-if="ticks.length === 0" class="tick-list__body tick-list__body--empty">
            <span class="text-muted">休市中，暫無成交資料</span>
          </div>
          <div v-else class="tick-list__body">
            <div v-for="(tick, i) in ticks" :key="i" class="tick-list__row">
              <span class="text-muted">{{ tick.time }}</span>
              <span :class="tick.up ? 'text-up' : 'text-down'">{{ tick.price.toFixed(2) }}</span>
              <span>{{ tick.volume }}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>

</template>

<style scoped lang="scss">
.quote-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;

  &__row1 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 12px;
    min-height: 560px;
  }

  &__row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    min-height: 240px;
  }

  &__details {
    padding: 12px;
    overflow-y: auto;
  }

  &__detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  &__detail-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 4px;
    border-bottom: 1px solid var(--color-border);
  }

  &__detail-label {
    font-size: 12px;
    color: var(--color-text-muted);

  }

  &__detail-value {
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  &__chart {
    padding: 12px;
    min-height: 0;
    overflow: hidden;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  &__orderbook {
    padding: 12px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__ticks {
    padding: 12px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

// ---- Order Book ----
.orderbook {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--color-text-muted);
    padding: 4px 0;
    margin-bottom: 4px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    position: relative;
  }

  &__bar {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    opacity: 0.1;
    border-radius: 2px;

    &--ask {
      background: var(--color-down);
    }

    &--bid {
      background: var(--color-up);
    }
  }

  &__divider {
    height: 1px;
    background: var(--color-border);
    margin: 6px 0;
  }

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }
}

// ---- Tick List ----
.tick-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &__header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    font-size: 11px;
    color: var(--color-text-muted);
    padding: 4px 0;
    margin-bottom: 4px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    &--empty {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 4px 0;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }
}

@media (max-width: 1100px) {
  .quote-view {
    &__row1 {
      grid-template-columns: 1fr;
      min-height: 0;
    }

    &__chart {
      height: 560px;
    }
  }
}

@media (max-width: 900px) {
  .quote-view {
    height: auto;
    overflow: visible;

    &__row2 {
      grid-template-columns: 1fr;
    }
  }
}
</style>
