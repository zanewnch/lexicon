<script setup lang="ts">
import {
  ShoppingCart, Eye, LogOut, BookText, Workflow,
  TrendingUp, Activity,
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import HomeFeatureCard from '@/features/home/components/HomeFeatureCard.vue'
</script>

<template>
  <div class="trading-home">
    <div class="trading-home__header anim-fade-in">
      <h1 class="trading-home__title">交易執行中心</h1>
      <p class="trading-home__subtitle">管理下單、持倉監控、出場與帳務紀錄</p>
    </div>

    <div class="trading-home__grid anim-fade-in">
      <HomeFeatureCard
        :icon="ShoppingCart"
        icon-color="#ef4444"
        title="下單交易"
        description="市價・限價委託・五檔報價"
        to="/trading/trader"
      />
      <HomeFeatureCard
        :icon="Eye"
        icon-color="#f97316"
        title="持倉監控"
        description="即時浮動損益・產業配置"
        to="/trading/watchdog"
      />
      <HomeFeatureCard
        :icon="Activity"
        icon-color="#f97316"
        title="Pipeline 狀態"
        description="五模組即時執行狀態"
        to="/trading/watchdog/pipeline"
      />
      <HomeFeatureCard
        :icon="LogOut"
        icon-color="#ec4899"
        title="出場管理"
        description="停損停利・待處理訊號・平倉"
        to="/trading/exiter"
      />
      <HomeFeatureCard
        :icon="BookText"
        icon-color="#14b8a6"
        title="交易紀錄"
        description="歷史成交明細・損益查詢"
        to="/trading/bookkeeper"
      />
      <HomeFeatureCard
        :icon="TrendingUp"
        icon-color="#14b8a6"
        title="績效報表"
        description="勝率・Sharpe・權益曲線"
        to="/trading/bookkeeper/report"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.trading-home {
  padding: var(--gap-xl);
  max-width: 960px;
  margin: 0 auto;

  &__header {
    margin-bottom: var(--gap-xl);
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--gap-xs);
  }

  &__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--gap-md);
  }
}
</style>
