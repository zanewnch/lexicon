<script setup lang="ts">
import HelpTip from '@/components/ui/HelpTip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { RankItem } from '@/types/market'

defineProps<{
  topGainers: RankItem[]
  topLosers: RankItem[]
  loading: boolean
}>()
</script>

<template>
  <div class="rank-panels">
    <RouterLink to="/analysis/rankings?type=gainers" class="rank-panel rank-panel--clickable">
      <h2 class="section-title">漲幅排行<HelpTip termKey="analysis.gainers" /></h2>
      <ul v-if="topGainers.length" class="rank-list">
        <li v-for="(s, i) in topGainers" :key="s.code" class="rank-item">
          <span class="rank-item__pos">{{ i + 1 }}</span>
          <span class="rank-item__info">
            <span class="rank-item__name">{{ s.name }}</span>
            <span class="rank-item__code text-muted">{{ s.code }}</span>
          </span>
          <span class="rank-item__percent text-up">▲ +{{ s.percent.toFixed(2) }}%</span>
          <div class="rank-item__bar rank-item__bar--up" :style="{ width: `${(s.percent / 10) * 100}%` }"></div>
        </li>
      </ul>
      <EmptyState v-else :loading="loading" message="尚無漲幅排行資料" />
    </RouterLink>
    <RouterLink to="/analysis/rankings?type=losers" class="rank-panel rank-panel--clickable">
      <h2 class="section-title">跌幅排行<HelpTip termKey="analysis.losers" /></h2>
      <ul v-if="topLosers.length" class="rank-list">
        <li v-for="(s, i) in topLosers" :key="s.code" class="rank-item">
          <span class="rank-item__pos">{{ i + 1 }}</span>
          <span class="rank-item__info">
            <span class="rank-item__name">{{ s.name }}</span>
            <span class="rank-item__code text-muted">{{ s.code }}</span>
          </span>
          <span class="rank-item__percent text-down">▼ {{ s.percent.toFixed(2) }}%</span>
          <div class="rank-item__bar rank-item__bar--down" :style="{ width: `${(Math.abs(s.percent) / 10) * 100}%` }"></div>
        </li>
      </ul>
      <EmptyState v-else :loading="loading" message="尚無跌幅排行資料" />
    </RouterLink>
  </div>
</template>

<style scoped lang="scss">
.rank-panels {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.rank-panel {
  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 100%), var(--glass-bg, var(--color-bg-card));
  border: 1px solid var(--glass-border, var(--color-border));
  border-top-color: rgba(255, 255, 255, 0.08);
  border-left-color: rgba(255, 255, 255, 0.04);
  padding: 20px;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.04);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);

  .section-title {
    margin-bottom: 12px;
  }

  &--clickable {
    display: block;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.3s var(--ease-smooth),
      border-color 0.3s var(--ease-smooth),
      box-shadow 0.3s var(--ease-smooth);

    &:hover {
      transform: translateY(-3px) scale(1.005);
      border-color: var(--color-accent);
      box-shadow: var(--shadow-md), 0 0 16px var(--glow-accent);
    }
  }
}

.rank-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.rank-item {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 10px;
  padding: 8px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.2s var(--ease-smooth),
    transform 0.2s var(--ease-smooth);
  position: relative;

  &:hover {
    background: var(--color-bg-hover);
    cursor: pointer;
    transform: translateX(4px);
  }

  &__pos {
    grid-row: 1 / 3;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xs);
    font-weight: 800;
    color: var(--color-text-muted);
    background: var(--color-bg-hover);
    border-radius: 50%;
    text-align: center;
  }

  // Top 3 special styling
  &:nth-child(1) .rank-item__pos {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  &:nth-child(2) .rank-item__pos {
    background: var(--color-accent-soft);
    color: var(--color-accent);
    opacity: 0.8;
  }

  &:nth-child(3) .rank-item__pos {
    background: var(--color-accent-soft);
    color: var(--color-accent);
    opacity: 0.6;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  &__name {
    font-weight: 500;
    font-size: var(--font-size-sm);
  }

  &__code {
    font-size: var(--font-size-xs);
  }

  &__percent {
    font-weight: 700;
    font-size: var(--font-size-base);
    font-variant-numeric: tabular-nums;
  }

  &__bar {
    grid-column: 2;
    height: 3px;
    border-radius: 2px;
    margin-top: 4px;
    animation: bar-fill 0.8s var(--ease-smooth) both;

    &--up {
      background: linear-gradient(90deg, var(--color-up), var(--color-up-soft));
    }

    &--down {
      background: linear-gradient(90deg, var(--color-down), var(--color-down-soft));
    }
  }
}

@keyframes bar-fill {
  from { width: 0% !important; }
}
</style>
