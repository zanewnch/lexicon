<script setup lang="ts">
/**
 * PortalView — 應用程式入口頁面（Portal）
 *
 * 作為使用者登入後的第一眼胡展示頁，包含：
 * 1. **大盤狀態列** — 前四大指數加權/OTC/期貨） + 市場開盤/休市狀態
 * 2. **Hero 區塊** — 歡迎處、總資產、今日損益、未實現損益、持股數
 * 3. **功能卡片 Grid** — 12 個功能入口卡片（行情、選股、策略、Workflow 等）
 * 4. **自選股快覽列** — 水平捧動的即時報價標簽列
 *
 * 資料來源：`useHomeData()` + `useMarketStatus()`。
 */
import { computed } from 'vue'
import {
  Radar, ShoppingCart, Eye, LogOut, BookText,
  GitBranch, Newspaper, NotebookText, BookOpen,
  Trophy, TrendingUp, Crosshair, Cpu, ClipboardList,
} from 'lucide-vue-next'
import HomeFeatureCard from '@/features/home/components/HomeFeatureCard.vue'
import Card from '@/components/ui/Card.vue'
import { useHomeData } from '@/features/home/composables/useHomeData'
import { useMarketStatus } from '@/features/market/composables/useMarketStatus'
import { formatCurrency, formatPercent, formatSign } from '@/utils/formatters'

const { indices, portfolio, watchlist, holdings } = useHomeData()
const { taiwanDate, isOpen } = useMarketStatus()

const topIndices = computed(() => indices.value.slice(0, 4))

const holdingCount = computed(() => holdings.value.length)

const totalAssets = computed(() => (
  portfolio.value.simulation
    ? portfolio.value.totalValue
    : portfolio.value.totalAssets ?? (portfolio.value.totalValue ?? 0) + (portfolio.value.accBalance ?? 0)
))

const pnlHighlight = computed(() => {
  const pnl = portfolio.value.todayPnl
  if (pnl == null || pnl === 0) return undefined
  const sign = pnl >= 0 ? '▲' : '▼'
  return `今日 ${sign} ${formatSign(pnl)} (${formatPercent(portfolio.value.todayPercent ?? 0)})`
})

const pnlColor = computed(() =>
  (portfolio.value.todayPnl ?? 0) >= 0 ? 'positive' : 'negative'
)
</script>

<template>
  <div class="portal">
    <!-- 大盤狀態列 -->
    <div class="portal__status-bar anim-fade-in">
      <div class="portal__indices">
        <span
          v-for="idx in topIndices"
          :key="idx.name"
          class="portal__index-chip"
          :class="idx.up ? 'portal__index-chip--up' : 'portal__index-chip--down'"
        >
          <span class="portal__index-name">{{ idx.name }}</span>
          <span class="portal__index-val">{{ idx.value }}</span>
          <span class="portal__index-pct">{{ idx.up ? '▲' : '▼' }}{{ idx.percent }}</span>
        </span>
        <span v-if="!topIndices.length" class="text-muted" style="font-size: var(--font-size-sm)">載入大盤資料中…</span>
      </div>
      <span class="portal__market-status" :class="isOpen ? 'portal__market-status--open' : 'portal__market-status--closed'">
        <span class="portal__market-dot"></span>
        {{ isOpen ? '開盤中' : '休市' }}
      </span>
    </div>

    <!-- Hero：帳戶摘要 -->
    <Card class="portal__hero anim-fade-in">
      <div class="portal__hero-left">
        <p class="portal__greeting">歡迎回來 · {{ taiwanDate }}</p>
        <p class="portal__total-label">{{ portfolio.simulation ? '模擬持倉參考市值' : '總資產' }}</p>
        <p class="portal__total-value">
          {{ totalAssets ? `$${formatCurrency(totalAssets)}` : '---' }}
        </p>
      </div>
      <div class="portal__hero-stats">
        <div class="portal__stat">
          <span class="portal__stat-label">今日損益</span>
          <span
            class="portal__stat-value"
            :class="portfolio.todayPnl == null ? '' : portfolio.todayPnl >= 0 ? 'text-up' : 'text-down'"
          >
            {{ portfolio.todayPnl ? `${portfolio.todayPnl >= 0 ? '▲' : '▼'} ${formatSign(portfolio.todayPnl)}` : '---' }}
            <small v-if="portfolio.todayPercent">{{ formatPercent(portfolio.todayPercent) }}</small>
          </span>
        </div>
        <div class="portal__stat">
          <span class="portal__stat-label">未實現損益</span>
          <span
            class="portal__stat-value"
            :class="portfolio.unrealizedPnl == null ? '' : portfolio.unrealizedPnl >= 0 ? 'text-up' : 'text-down'"
          >
            {{ portfolio.unrealizedPnl ? `${portfolio.unrealizedPnl >= 0 ? '▲' : '▼'} ${formatSign(portfolio.unrealizedPnl)}` : '---' }}
            <small v-if="portfolio.unrealizedPercent">{{ formatPercent(portfolio.unrealizedPercent) }}</small>
          </span>
        </div>
        <div class="portal__stat">
          <span class="portal__stat-label">持股</span>
          <span class="portal__stat-value">{{ holdingCount ? `${holdingCount} 檔` : '---' }}</span>
        </div>
      </div>
    </Card>

    <!-- 五大模組 Pipeline -->
    <div class="portal__modules anim-stagger">
      <!-- Scanner -->
      <section class="portal__module-section">
        <h2 class="portal__module-heading">
          <Radar :size="18" color="#8b5cf6" />
          <span>Scanner</span>
          <small>選股 · 過濾條件產生候選清單</small>
        </h2>
        <div class="portal__module-grid">
          <HomeFeatureCard :icon="Radar" icon-color="#8b5cf6" title="台股全覽" description="選股漏斗・市值樹圖" to="/analysis/explorer" />
          <HomeFeatureCard :icon="TrendingUp" icon-color="#22c55e" title="行情" description="即時報價・技術分析・籌碼" to="/analysis/quote" />
          <HomeFeatureCard :icon="Trophy" icon-color="#f59e0b" title="排行榜" description="漲跌幅・成交量・本益比" to="/analysis/rankings" />
          <HomeFeatureCard :icon="Crosshair" icon-color="#ec4899" title="策略" description="選股邏輯・進場條件・回測" to="/strategy" />
          <HomeFeatureCard :icon="Cpu" icon-color="#3b82f6" title="台積電分析" description="深度個股範例" to="/analysis/tsmc" />
        </div>
      </section>

      <!-- Trader -->
      <section class="portal__module-section">
        <h2 class="portal__module-heading">
          <ShoppingCart :size="18" color="#ef4444" />
          <span>Trader</span>
          <small>進場 · 等權重分配 → 市價單</small>
        </h2>
        <div class="portal__module-grid">
          <HomeFeatureCard :icon="ClipboardList" icon-color="#ef4444" title="下單" description="市價・限價委託・五檔報價" to="/trading/trader" />
        </div>
      </section>

      <!-- Watchdog -->
      <section class="portal__module-section">
        <h2 class="portal__module-heading">
          <Eye :size="18" color="#f97316" />
          <span>Watchdog</span>
          <small>監控 · 即時價 vs 持倉 → 出場訊號</small>
        </h2>
        <div class="portal__module-grid">
          <HomeFeatureCard
            :icon="Eye" icon-color="#f97316" title="持倉" description="持股明細・損益・配置"
            to="/trading/watchdog"
            :badge="holdingCount || undefined"
            :highlight="pnlHighlight"
            :highlight-color="pnlColor"
          />
          <HomeFeatureCard :icon="TrendingUp" icon-color="#10b981" title="Pipeline" description="五模組即時執行狀態" to="/trading/watchdog/pipeline" />
        </div>
      </section>

      <!-- Exiter -->
      <section class="portal__module-section">
        <h2 class="portal__module-heading">
          <LogOut :size="18" color="#ec4899" />
          <span>Exiter</span>
          <small>出場 · 收到訊號 → 市價清倉</small>
        </h2>
        <div class="portal__module-grid">
          <HomeFeatureCard :icon="LogOut" icon-color="#ec4899" title="出場" description="待處理訊號・停損停利・紀錄" to="/trading/exiter" />
        </div>
      </section>

      <!-- Bookkeeper -->
      <section class="portal__module-section">
        <h2 class="portal__module-heading">
          <BookText :size="18" color="#14b8a6" />
          <span>Bookkeeper</span>
          <small>記帳 · 成交明細 → 總損益・勝率</small>
        </h2>
        <div class="portal__module-grid">
          <HomeFeatureCard :icon="ClipboardList" icon-color="#64748b" title="交易紀錄" description="歷史成交明細・損益查詢" to="/trading/bookkeeper" />
          <HomeFeatureCard :icon="BookText" icon-color="#14b8a6" title="報表" description="總損益・勝率・權益曲線" to="/trading/bookkeeper/report" />
        </div>
      </section>

      <!-- 輔助 -->
      <section class="portal__module-section">
        <h2 class="portal__module-heading portal__module-heading--aux">
          <span>輔助工具</span>
        </h2>
        <div class="portal__module-grid">
          <HomeFeatureCard :icon="GitBranch" icon-color="#10b981" title="操盤 Workflow" description="漏斗・看板・SOP・日誌・復盤" to="/analysis/workflow" />
          <HomeFeatureCard :icon="Newspaper" icon-color="#06b6d4" title="市場快訊" description="鉅亨・ETtoday 新聞聚合" to="/analysis/news" />
          <HomeFeatureCard :icon="NotebookText" icon-color="#f59e0b" title="筆記" description="Markdown・分類・標籤" to="/analysis/notes" />
          <HomeFeatureCard :icon="BookOpen" icon-color="#14b8a6" title="教學指南" description="術語・指標・交易概念" to="/guide" />
        </div>
      </section>
    </div>

    <!-- 自選股快覽列 -->
    <div v-if="watchlist.length" class="portal__watchlist-bar anim-fade-in">
      <span class="portal__watchlist-label">自選股</span>
      <div class="portal__watchlist-chips">
        <RouterLink
          v-for="s in watchlist"
          :key="s.code"
          :to="`/scanner/market?code=${s.code}`"
          class="portal__watchlist-chip"
          :class="s.up ? 'portal__watchlist-chip--up' : 'portal__watchlist-chip--down'"
        >
          <span class="portal__watchlist-chip-name">{{ s.name }}</span>
          <span class="portal__watchlist-chip-price">{{ s.price.toFixed(1) }}</span>
          <span class="portal__watchlist-chip-pct">{{ s.up ? '▲' : '▼' }}{{ formatPercent(s.percent) }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.portal {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);

  // 頂部光暈
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: var(--sidebar-width, 240px);
    right: 0;
    height: 300px;
    background: radial-gradient(
      ellipse 80% 60% at 50% 0%,
      var(--glow-accent) 0%,
      transparent 70%
    );
    opacity: 0.25;
    pointer-events: none;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }

  // ── 狀態列 ──
  &__status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
    flex-wrap: wrap;
  }

  &__indices {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }

  &__index-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 99px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;

    &--up .portal__index-pct { color: var(--color-up); }
    &--down .portal__index-pct { color: var(--color-down); }
  }

  &__index-name {
    color: var(--color-text-muted);
    font-weight: 500;
  }

  &__index-val {
    font-weight: 700;
  }

  &__index-pct {
    font-weight: 600;
    font-size: var(--font-size-xs);
  }

  &__market-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-sm);
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 99px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);

    &--open { color: var(--color-up); }
    &--closed { color: var(--color-text-muted); }
  }

  &__market-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;

    .portal__market-status--open & {
      animation: dot-pulse 1.5s ease-in-out infinite;
    }
  }

  // ── Hero ──
  &__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-xl);
    flex-wrap: wrap;
    padding: var(--gap-xl);
  }

  &__hero-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__greeting {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }

  &__total-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__total-value {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1px;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  &__hero-stats {
    display: flex;
    gap: var(--gap-xl);
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 120px;
  }

  &__stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;

    small {
      font-size: var(--font-size-sm);
      font-weight: 600;
      margin-left: 4px;
      opacity: 0.8;
    }
  }

  // ── 五模組 ──
  &__modules {
    display: flex;
    flex-direction: column;
    gap: var(--gap-xl);
  }

  &__module-section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }

  &__module-heading {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 700;
    color: var(--color-text-primary);

    small {
      font-size: 12px;
      color: var(--color-text-muted);
      font-weight: 500;
      margin-left: 4px;
    }

    &--aux {
      color: var(--color-text-muted);
      border-top: 1px dashed var(--color-border);
      padding-top: var(--gap-md);
      margin-top: var(--gap-sm);
    }
  }

  &__module-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--gap-md);

    @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 480px)  { grid-template-columns: 1fr; }
  }

  // ── Watchlist Bar ──
  &__watchlist-bar {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
    padding: var(--gap-md) var(--gap-lg);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }
  }

  &__watchlist-label {
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__watchlist-chips {
    display: flex;
    gap: var(--gap-sm);
    flex-wrap: nowrap;
  }

  &__watchlist-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 99px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
    text-decoration: none;
    color: inherit;
    white-space: nowrap;
    transition: border-color 0.2s, background 0.2s;

    &:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-accent);
    }

    &--up .portal__watchlist-chip-pct { color: var(--color-up); }
    &--down .portal__watchlist-chip-pct { color: var(--color-down); }
  }

  &__watchlist-chip-name {
    font-weight: 600;
  }

  &__watchlist-chip-price {
    color: var(--color-text-secondary);
  }

  &__watchlist-chip-pct {
    font-weight: 700;
    font-size: var(--font-size-xs);
  }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}
</style>
