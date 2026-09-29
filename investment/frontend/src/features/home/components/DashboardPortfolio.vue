<script setup lang="ts">
import HelpTip from '@/components/ui/HelpTip.vue'
import SummaryItem from '@/components/ui/SummaryItem.vue'
import Card from '@/components/ui/Card.vue'
import { formatCurrency, formatSign, formatPercent } from '@/utils/formatters'
import type { PortfolioSummary } from '@/types/market'

defineProps<{
  portfolio: PortfolioSummary
}>()
</script>

<template>
  <Card class="account-summary">
    <h2 class="section-title">帳戶摘要<HelpTip termKey="portfolio.account-summary" /></h2>
    <p v-if="portfolio.simulation" class="text-muted">券商模擬：持倉來自已確認成交；現金與總資產不可查，報價為參考快照。</p>
    <div class="account-summary__grid">
      <SummaryItem size="lg" :label="portfolio.simulation ? '持倉參考市值' : '總資產'" :value="portfolio.totalValue == null ? '---' : `$${formatCurrency(portfolio.totalValue)}`" class="account-summary__item" />
      <SummaryItem size="lg" label="總成本" :value="`$${formatCurrency(portfolio.totalCost)}`" value-class="text-secondary" class="account-summary__item" />
      <SummaryItem size="lg" label="今日損益" :value-class="portfolio.todayPnl == null ? '' : portfolio.todayPnl >= 0 ? 'text-up' : 'text-down'" class="account-summary__item">
        {{ portfolio.todayPnl == null ? '---' : `${portfolio.todayPnl >= 0 ? '▲' : '▼'} ${formatSign(portfolio.todayPnl)}` }}
        <small v-if="portfolio.todayPercent != null">{{ formatPercent(portfolio.todayPercent) }}</small>
      </SummaryItem>
      <SummaryItem size="lg" label="未實現損益" :value-class="portfolio.unrealizedPnl == null ? '' : portfolio.unrealizedPnl >= 0 ? 'text-up' : 'text-down'" class="account-summary__item">
        {{ portfolio.unrealizedPnl == null ? '---' : `${portfolio.unrealizedPnl >= 0 ? '▲' : '▼'} ${formatSign(portfolio.unrealizedPnl)}` }}
        <small v-if="portfolio.unrealizedPercent != null">{{ formatPercent(portfolio.unrealizedPercent) }}</small>
      </SummaryItem>
    </div>
  </Card>
</template>

<style scoped lang="scss">
.account-summary {
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);
    margin-top: var(--gap-lg);
  }

  &__item {
    padding: 12px 0;
    position: relative;

    // Subtle divider between items
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, var(--color-border) 0%, transparent 100%);
    }
  }
}
</style>
