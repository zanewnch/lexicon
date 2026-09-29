<script setup lang="ts">
import { formatBigNumber, formatPercent } from '@/utils/formatters'
import HelpTip from '@/components/ui/HelpTip.vue'
import type { FunnelSector } from '@/types/funnel'

const props = defineProps<{
  themes: FunnelSector[]
  industries: FunnelSector[]
  selectedSectors: string[]
  loading: boolean
}>()

const emit = defineEmits<{
  toggle: [name: string]
  proceed: []
}>()

function isSelected(name: string) {
  return props.selectedSectors.includes(name)
}
</script>

<template>
  <div class="funnel-step1">
    <div class="funnel-step1__header">
      <h3 class="funnel-step1__title">Step 1 — 產業趨勢（Top-Down）</h3>
      <p class="funnel-step1__desc text-muted">選擇你看好的產業或主題概念，可多選</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="funnel-step1__skeleton">
      <div v-for="i in 6" :key="i" class="funnel-step1__skeleton-card" />
    </div>

    <template v-else>
      <!-- Theme cards -->
      <div v-if="themes.length" class="funnel-step1__section">
        <h4 class="funnel-step1__section-label">
          主題概念股
          <HelpTip text="主題概念股為人工整理的靜態分類，涵蓋當前市場熱門題材（AI、半導體、綠能等）。主題名稱與成份股需定期手動更新，卡片上的漲跌幅與成交額為即時市場數據。" />
        </h4>
        <div class="funnel-step1__grid funnel-step1__grid--themes">
          <button
            v-for="t in themes"
            :key="t.name"
            class="funnel-step1__card funnel-step1__card--theme"
            :class="{ 'funnel-step1__card--selected': isSelected(t.name) }"
            @click="emit('toggle', t.name)"
          >
            <span class="funnel-step1__card-name">{{ t.name }}</span>
            <span class="funnel-step1__card-count">
              {{ t.stockCount }} 檔
              <HelpTip text="該主題涵蓋的成份股數量" />
            </span>
            <span
              class="funnel-step1__card-change"
              :class="t.up ? 'color-up' : 'color-down'"
            >
              {{ formatPercent(t.avgChange) }}
              <HelpTip text="主題內所有成份股的平均漲跌幅" />
            </span>
            <span class="funnel-step1__card-turnover text-muted">
              {{ formatBigNumber(t.totalTurnover) }}
              <HelpTip text="主題內所有成份股的總成交金額" />
            </span>
          </button>
        </div>
      </div>

      <!-- Industry cards -->
      <div class="funnel-step1__section">
        <h4 class="funnel-step1__section-label">
          產業分類
          <HelpTip text="依據證交所（TWSE）與櫃買中心（TPEx）官方產業分類，資料每日自動更新。" />
        </h4>
        <div class="funnel-step1__grid funnel-step1__grid--industries">
          <button
            v-for="s in industries"
            :key="s.name"
            class="funnel-step1__card funnel-step1__card--industry"
            :class="{ 'funnel-step1__card--selected': isSelected(s.name) }"
            @click="emit('toggle', s.name)"
          >
            <span class="funnel-step1__card-name">{{ s.name }}</span>
            <span class="funnel-step1__card-count">
              {{ s.stockCount }} 檔
              <HelpTip text="該產業的上市櫃公司數量" />
            </span>
            <span
              class="funnel-step1__card-change"
              :class="s.up ? 'color-up' : 'color-down'"
            >
              {{ formatPercent(s.avgChange) }}
              <HelpTip text="產業內所有股票的平均漲跌幅" />
            </span>
          </button>
        </div>
      </div>
    </template>

    <div class="funnel-step1__actions">
      <button
        class="funnel-step1__btn"
        :disabled="selectedSectors.length === 0"
        @click="emit('proceed')"
      >
        進入第二關 — 基本面篩選
      </button>
      <span v-if="selectedSectors.length" class="funnel-step1__selected-info text-muted">
        已選 {{ selectedSectors.length }} 個類別
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.funnel-step1 {
  &__header {
    margin-bottom: var(--gap-lg);
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: var(--font-size-sm);
  }

  &__section {
    margin-bottom: var(--gap-lg);
  }

  &__section-label {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin-bottom: var(--gap-sm);
    color: var(--color-text-secondary);
  }

  &__grid {
    display: grid;
    gap: var(--gap-sm);

    &--themes {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }

    &--industries {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    text-align: left;
    cursor: pointer;
    transition: all var(--duration-fast);

    &:hover {
      border-color: var(--color-accent);
      background: var(--color-bg-hover);
    }

    &--selected {
      border-color: var(--color-accent);
      background: var(--color-accent-soft, rgba(var(--accent-rgb, 99, 102, 241), 0.1));
      box-shadow: 0 0 0 1px var(--color-accent);
    }

    &--theme {
      padding: 16px;
    }
  }

  &__card-name {
    font-weight: 600;
    font-size: var(--font-size-base);
  }

  &__card-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__card-change {
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  &__card-turnover {
    font-size: var(--font-size-xs);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
    margin-top: var(--gap-lg);
    padding-top: var(--gap-md);
    border-top: 1px solid var(--color-border);
  }

  &__btn {
    padding: 10px 24px;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: var(--font-size-base);
    background: var(--color-accent);
    color: #fff;
    transition: opacity var(--duration-fast);

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__selected-info {
    font-size: var(--font-size-sm);
  }

  &__skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--gap-sm);
  }

  &__skeleton-card {
    height: 80px;
    border-radius: var(--radius-md);
    background: var(--color-bg-hover);
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
