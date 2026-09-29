<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTsmcData } from '@/features/tsmc/composables/useTsmcData'
import TsmcBusiness from '@/features/tsmc/components/TsmcBusiness.vue'
import TsmcFinancials from '@/features/tsmc/components/TsmcFinancials.vue'
import TsmcEarnings from '@/features/tsmc/components/TsmcEarnings.vue'
import TsmcPrice from '@/features/tsmc/components/TsmcPrice.vue'
import TsmcSupplyChain from '@/features/tsmc/components/TsmcSupplyChain.vue'

type Section = 'business' | 'financials' | 'earnings' | 'price' | 'supplychain'
const active = ref<Section>('business')
const tabs: { key: Section; label: string }[] = [
  { key: 'business',    label: '商業模式' },
  { key: 'financials',  label: '財務健康' },
  { key: 'earnings',    label: '法說會' },
  { key: 'price',       label: '股價籌碼' },
  { key: 'supplychain', label: '供應鏈延伸' },
]

const {
  loading, error, fundData, latestProfit, fetchFundamental,
  earningsLoading, earningsError, earningsData, fetchEarningsNews,
} = useTsmcData()

onMounted(() => {
  fetchFundamental()
  fetchEarningsNews()
})
</script>

<template>
  <div class="tsmc">
    <div class="tsmc__header">
      <div class="tsmc__header-main">
        <span class="tsmc__badge">2330</span>
        <h1 class="tsmc__title">台積電分析</h1>
      </div>
      <p class="tsmc__subtitle">從台積電出發，學會分析，再觸類旁通</p>
    </div>

    <div class="tsmc__flow">
      <div v-for="(tab, i) in tabs" :key="tab.key" class="tsmc__flow-item">
        <div
          class="tsmc__flow-step"
          :class="{ 'tsmc__flow-step--active': active === tab.key }"
          @click="active = tab.key"
        >
          <span class="tsmc__flow-num">{{ i + 1 }}</span>
          <span class="tsmc__flow-label">{{ tab.label }}</span>
        </div>
        <span v-if="i < tabs.length - 1" class="tsmc__flow-arrow">→</span>
      </div>
    </div>

    <div class="tsmc__body">
      <TsmcBusiness v-if="active === 'business'" />
      <TsmcFinancials
        v-if="active === 'financials'"
        :fund-data="fundData"
        :latest-profit="latestProfit"
        :loading="loading"
        :error="error"
        @retry="fetchFundamental"
      />
      <TsmcEarnings
        v-if="active === 'earnings'"
        :earnings-data="earningsData"
        :earnings-loading="earningsLoading"
        :earnings-error="earningsError"
        @refresh="fetchEarningsNews"
      />
      <TsmcPrice v-if="active === 'price'" />
      <TsmcSupplyChain v-if="active === 'supplychain'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.tsmc {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &__header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__header-main {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__badge {
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__subtitle {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0;
  }

  &__flow {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    overflow-x: auto;
  }

  &__flow-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__flow-step {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: all 0.15s;
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);

    &:hover {
      border-color: var(--color-accent);
      color: var(--color-text-primary);
    }

    &--active {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
  }

  &__flow-num {
    font-size: 10px;
    font-weight: 800;
    opacity: 0.7;
  }

  &__flow-label {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  &__flow-arrow {
    color: var(--color-text-muted);
    font-size: 14px;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
}
</style>

<!-- Shared styles consumed by child section components (not scoped) -->
<style lang="scss">
.tsmc {
  &__section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 800px;
    &--wide { max-width: 100%; }
  }

  &__tip {
    padding: 10px 14px;
    background: rgba(34, 197, 94, 0.08);
    border-left: 3px solid #22c55e;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-size: 12px;
    color: #22c55e;
    font-weight: 600;
  }

  &__highlight {
    padding: 12px 16px;
    background: rgba(59, 130, 246, 0.08);
    border-left: 3px solid var(--color-accent);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-size: 13px;
    color: var(--color-text-primary);
    font-weight: 500;
    line-height: 1.6;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  &__card {
    padding: 14px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-secondary);

    &-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    &-text {
      font-size: 13px;
      color: var(--color-text-primary);
      line-height: 1.5;
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__metric {
    padding: 14px 16px;
    text-align: center;
    border-right: 1px solid var(--color-border);

    &:last-child { border-right: none; }

    &-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 4px;
    }

    &-value {
      font-size: 15px;
      font-weight: 800;
      color: var(--color-text-primary);
      margin-bottom: 4px;
      &--up { color: var(--color-up); }
    }

    &-desc {
      font-size: 10px;
      color: var(--color-text-muted);
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;

    th {
      padding: 8px 14px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-muted);
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
    }

    td {
      padding: 8px 14px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: var(--color-bg-hover); }
  }

  &__table-wrap { overflow-x: auto; }
  &__th-r { text-align: right !important; }
  &__th-tip {
    cursor: help;
    border-bottom: 1px dashed var(--color-text-muted);
    padding-bottom: 1px;
  }

  &__fin-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
  }

  &__fin-tab {
    padding: 8px 18px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;

    &:hover { color: var(--color-text-primary); }
    &--active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
  }

  &__data-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }

  &__data-source {
    padding: 1px 7px;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    font-weight: 700;
    font-size: 10px;
  }

  &__data-time { color: var(--color-text-muted); }

  &__status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px 20px;
    font-size: 13px;
    color: var(--color-text-muted);
    &--loading { color: var(--color-text-muted); }
    &--error   { color: var(--color-down); }
  }

  &__spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: tsmc-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes tsmc-spin { to { transform: rotate(360deg); } }

  &__empty {
    padding: 32px 20px;
    text-align: center;
    font-size: 12px;
    color: var(--color-text-muted);
    line-height: 1.6;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    margin: 8px 0;
  }

  &__num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    &--accent { color: var(--color-accent); }
    &--bold   { font-weight: 800; }
    &.up   { color: var(--color-up); }
    &.down { color: var(--color-down); }
  }

  &__earnings-meta {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  &__refresh-btn {
    padding: 6px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;

    &:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__news-list { display: flex; flex-direction: column; gap: 8px; }

  &__news-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-secondary);
    text-decoration: none;
    transition: all 0.15s;

    &:hover { border-color: var(--color-accent); background: var(--color-bg-hover); }
  }

  &__news-top { display: flex; align-items: center; gap: 8px; }

  &__news-source {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }

  &__news-date { font-size: 11px; color: var(--color-text-muted); }
  &__news-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }
  &__news-summary {
    font-size: 11px;
    color: var(--color-text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__keyword-list { display: flex; flex-direction: column; gap: 8px; }
  &__keyword {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 8px 14px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 13px;

    code {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-accent);
      background: rgba(59, 130, 246, 0.1);
      padding: 1px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    span { color: var(--color-text-secondary); }
  }

  &__question { color: var(--color-accent); font-weight: 600; }
  &__targets   { font-weight: 700; color: var(--color-text-primary); }

  &__how {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 10px 14px;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--color-text-secondary);

    &-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }
  }
}
</style>
