<script setup lang="ts">
import { ref } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Card from '@/components/ui/Card.vue'
import MarketSignals from '@/features/home/components/MarketSignals.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DashboardIndices from '@/features/home/components/DashboardIndices.vue'
import DashboardRankings from '@/features/home/components/DashboardRankings.vue'
import DashboardPortfolio from '@/features/home/components/DashboardPortfolio.vue'
import DashboardHoldings from '@/features/home/components/DashboardHoldings.vue'
import DashboardTrades from '@/features/home/components/DashboardTrades.vue'
import { useHomeData } from '@/features/home/composables/useHomeData'
import { useMarketStatus } from '@/features/market/composables/useMarketStatus'
import { useMarketSignals } from '@/features/home/composables/useMarketSignals'
import { formatPercent, formatSign, formatCurrency } from '@/utils/formatters'

const {
  indices,
  portfolio,
  watchlist,
  topGainers,
  topLosers,
  holdings,
  recentTrades,
  news,
  sectorPerformance,
  loading,
} = useHomeData()

const { taiwanDate } = useMarketStatus()
const { signals } = useMarketSignals(indices)
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header anim-fade-in">
      <h1 class="dashboard__title">市場總覽</h1>
      <span class="dashboard__date text-muted">{{ taiwanDate }}</span>
    </div>

    <!-- Row 1: 指數 + 類股表現 -->
    <div class="dashboard__top anim-stagger">
      <DashboardIndices :indices="indices" :loading="loading" />

      <Card class="sectors">
        <h2 class="section-title">類股表現<HelpTip termKey="index.sector-performance" /></h2>
        <ul v-if="sectorPerformance.length" class="sector-list">
          <li v-for="sec in sectorPerformance" :key="sec.name" class="sector-item">
            <span class="sector-item__name">{{ sec.name }}</span>
            <div class="sector-item__bar-wrap">
              <div
                class="sector-item__bar"
                :class="sec.up ? 'sector-item__bar--up' : 'sector-item__bar--down'"
                :style="{ width: `${Math.min(Math.abs(sec.percent) * 30, 100)}%` }"
              ></div>
            </div>
            <span class="sector-item__percent" :class="sec.up ? 'text-up' : 'text-down'">
              {{ sec.up ? '▲' : '▼' }} {{ formatPercent(sec.percent) }}
            </span>
          </li>
        </ul>
        <EmptyState v-else :loading="loading" message="尚無類股表現資料" />
      </Card>
    </div>

    <!-- 市場訊號 -->
    <MarketSignals v-if="indices.length" :signals="signals" class="anim-fade-in" style="margin-bottom: var(--gap-md);" />

    <!-- Row 2: 漲跌排行 + 市場快訊 -->
    <div class="dashboard__row2 anim-stagger">
      <DashboardRankings :top-gainers="topGainers" :top-losers="topLosers" :loading="loading" />

      <Card class="news">
        <h2 class="section-title">市場快訊<HelpTip termKey="analysis.news" /><DummyBadge :show="true" /></h2>
        <ul v-if="news.length" class="news__list">
          <li v-for="(n, i) in news" :key="i" class="news__item">
            <div class="news__meta">
              <span class="news__time">{{ n.time }}</span>
              <span class="news__tag">{{ n.source === 'anue' ? '鉅亨' : 'ETtoday' }}</span>
            </div>
            <span class="news__title">{{ n.title }}</span>
          </li>
        </ul>
        <EmptyState v-else :loading="loading" message="尚無市場快訊" />
      </Card>
    </div>

    <!-- Row 3: 帳戶摘要 + 自選股 -->
    <div class="dashboard__row3 anim-stagger">
      <DashboardPortfolio :portfolio="portfolio" />

      <Card class="watchlist">
        <SectionHeader>
          <template #title>自選股<HelpTip termKey="portfolio.watchlist" /></template>
          <template #actions>
            <button class="btn btn--ghost">+ 新增</button>
          </template>
        </SectionHeader>
        <template v-if="watchlist.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>代碼</th>
                <th>名稱</th>
                <th class="text-right">股價</th>
                <th class="text-right">漲跌</th>
                <th class="text-right">漲跌幅</th>
                <th class="text-right">成交量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in watchlist" :key="s.code">
                <td class="text-muted">{{ s.code }}</td>
                <td>{{ s.name }}</td>
                <td class="text-right">{{ s.price.toFixed(2) }}</td>
                <td class="text-right" :class="s.up ? 'text-up' : 'text-down'">{{ s.up ? '▲' : '▼' }} {{ formatSign(s.change) }}</td>
                <td class="text-right" :class="s.up ? 'text-up' : 'text-down'">{{ formatPercent(s.percent) }}</td>
                <td class="text-right text-secondary">{{ formatCurrency(s.volume) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <EmptyState v-else :loading="loading" message="尚無自選股資料" />
      </Card>
    </div>

    <!-- Row 4: 持倉 + 近期交易 -->
    <div class="dashboard__row4 anim-stagger">
      <DashboardHoldings :holdings="holdings" :loading="loading" />
      <DashboardTrades :recent-trades="recentTrades" :loading="loading" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  position: relative;

  // Subtle radial gradient background accent
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: var(--sidebar-width, 240px);
    right: 0;
    height: 400px;
    background: radial-gradient(
      ellipse 80% 50% at 50% 0%,
      var(--glow-accent) 0%,
      transparent 70%
    );
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--gap-lg);
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  &__date {
    font-size: var(--font-size-base);
    font-variant-numeric: tabular-nums;
  }

  &__top {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-md);
    margin-bottom: var(--gap-md);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }

  &__row2 {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: var(--gap-md);
    margin-bottom: var(--gap-md);

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }

  &__row3 {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--gap-md);
    margin-bottom: var(--gap-md);

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }

  &__row4 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-md);

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }
}

// ---- Sectors ----

.sector-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  margin-top: var(--gap-md);
}

.sector-item {
  display: grid;
  grid-template-columns: 90px 1fr 70px;
  align-items: center;
  gap: var(--gap-sm);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s var(--ease-smooth),
    transform 0.2s var(--ease-smooth);

  &:hover {
    background: var(--color-bg-hover);
    transform: translateX(4px);
  }

  &__name {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  &__bar-wrap {
    height: 6px;
    background: var(--color-bg-hover);
    border-radius: 3px;
    overflow: hidden;
  }

  &__bar {
    height: 100%;
    border-radius: 3px;
    animation: bar-fill 1s var(--ease-smooth) both;

    &--up {
      background: linear-gradient(90deg, var(--color-up), var(--color-up-soft));
    }

    &--down {
      background: linear-gradient(90deg, var(--color-down), var(--color-down-soft));
    }
  }

  &__percent {
    text-align: right;
    font-size: var(--font-size-sm);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
}

@keyframes bar-fill {
  from { width: 0% !important; }
}

// ---- News ----

.news {
  .section-title {
    margin-bottom: 16px;
  }

  &__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: background var(--duration-fast);

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:hover .news__title {
      color: var(--color-accent);
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__tag {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-bg-hover);
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  &__title {
    font-size: var(--font-size-sm);
    line-height: 1.5;
    transition: color var(--duration-fast);
  }
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .dashboard {
    padding: 0;

    &__title {
      font-size: var(--font-size-lg);
    }

    &__header {
      margin-bottom: var(--gap-sm);
    }
  }

  .sector-item {
    grid-template-columns: 70px 1fr 60px;
  }
}

// ---- Responsive: 480px ----
@media (max-width: 480px) {
  .dashboard {
    &__title {
      font-size: var(--font-size-md);
    }

    &__top,
    &__row2,
    &__row3,
    &__row4 {
      gap: var(--gap-sm);
      margin-bottom: var(--gap-sm);
    }
  }

  .sector-item {
    grid-template-columns: 60px 1fr 55px;
    font-size: var(--font-size-xs);
  }
}
</style>
