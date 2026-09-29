<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTagFilter } from '@/features/tags/composables/useTagFilter'
import TagFilterGroup from '@/features/tags/components/TagFilterGroup.vue'
import HelpTip from '@/components/ui/HelpTip.vue'

const router = useRouter()
const {
  options, selected, results, total, loading, loadingMore, initialLoading,
  trendTagsUpdatedAt,
  hasFilter, hasMore, resetFilters, toggleValue, isSelected, formatTurnover,
  loadMore,
} = useTagFilter()

const FLAG_TIPS: Record<string, string> = {
  爆量: '當日成交量 ≥ 近 5 日均量 × 2，不看漲跌方向；由 /tags/filter/ 即時計算（僅 Top 500 流動性股票有真實 5 日均量，其餘股票以成交金額 > 5 億且漲跌幅 ≥ 3% 近似）。',
  爆量突破: '當日量 > 近 20 日均量 × 1.5 且收紅（向上突破確認）；由 rebuild_tags 批次計算後存 StockTrendTag。較「爆量」更嚴格、帶方向確認。',
  漲停: '漲跌幅 ≥ +9.8%',
  跌停: '漲跌幅 ≤ −9.8%',
}

const trendTagsUpdatedLabel = computed(() => {
  if (!trendTagsUpdatedAt.value) return null
  const d = new Date(trendTagsUpdatedAt.value)
  if (isNaN(d.getTime())) return null
  return d.toLocaleString('zh-TW', { hour12: false })
})

const MARKET_CHIPS = [
  ['TSE', '上市'],
  ['OTC', '上櫃'],
] as const

type PeriodKey = 'intraday' | 'short' | 'swing' | 'long'

const PERIOD_OPTIONS: { key: PeriodKey; label: string; hint: string }[] = [
  { key: 'intraday', label: '當沖', hint: '數小時～1日 · 日K + 5/15分K' },
  { key: 'short',    label: '短線', hint: '2~10日 · 週K + 日K' },
  { key: 'swing',    label: '波段', hint: '2週~3個月 · 月K + 週K/日K' },
  { key: 'long',     label: '長線', hint: '半年以上 · 季K + 月K' },
]

const selectedCodes = ref<Set<string>>(new Set())
const selectedPeriod = ref<PeriodKey | null>(null)

const selectedCount = computed(() => selectedCodes.value.size)
const allSelected = computed(
  () => results.value.length > 0 && results.value.every((r) => selectedCodes.value.has(r.code)),
)
const canProceed = computed(() => selectedCount.value > 0 && selectedPeriod.value !== null)

function goToStock(code: string) {
  router.push(`/analysis/quote?code=${code}`)
}

function toggleStockSelection(code: string) {
  const next = new Set(selectedCodes.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  selectedCodes.value = next
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedCodes.value = new Set()
  } else {
    selectedCodes.value = new Set(results.value.map((r) => r.code))
  }
}

function clearSelection() {
  selectedCodes.value = new Set()
  selectedPeriod.value = null
}

function goToStrategy() {
  if (!canProceed.value) return
  const codes = Array.from(selectedCodes.value).join(',')
  router.push({
    path: '/strategy/create',
    query: { codes, period: selectedPeriod.value ?? undefined },
  })
}

const filterGroups: { key: string; label: string; wrap?: boolean }[] = [
  { key: 'liquidity',  label: '流動性' },
  { key: 'cap_size',   label: '市值規模' },
  { key: 'style',      label: '投資風格' },
  { key: 'momentum',   label: '動能' },
  { key: 'trend',      label: '趨勢' },
  { key: 'valuation',  label: '估值' },
  { key: 'dividend',   label: '殖利率' },
  { key: 'flags',      label: '旗標' },
  { key: 'special',    label: '特殊屬性' },
  { key: 'industry',   label: '產業', wrap: true },
]
</script>

<template>
  <div class="tag-picker">
    <header class="tag-picker__header">
      <h1 class="tag-picker__title">標籤式選股</h1>
      <p class="tag-picker__subtitle">
        從每個維度挑幾個標籤，系統回傳同時命中所有條件的股票。多選之間為 OR，欄位之間為 AND。
      </p>
      <p v-if="trendTagsUpdatedLabel" class="tag-picker__updated">
        趨勢標籤資料最後更新：{{ trendTagsUpdatedLabel }}
        <span class="tag-picker__updated-hint">（每晚批次由 `python manage.py rebuild_tags` 重建）</span>
      </p>
      <p v-else class="tag-picker__updated tag-picker__updated--stale">
        尚無批次趨勢標籤資料；請先執行 `python manage.py rebuild_tags`。
      </p>
    </header>

    <section class="tag-picker__filters">
      <!-- 市場（硬編碼選項，需特別處理顯示標籤 TSE→上市 OTC→上櫃）-->
      <div class="tag-picker__market-group">
        <span class="tag-picker__market-label">市場</span>
        <div class="tag-picker__chips">
          <button
            v-for="[val, label] in MARKET_CHIPS"
            :key="val"
            class="tag-picker__chip"
            :class="{ 'tag-picker__chip--active': isSelected('exchange', val) }"
            @click="toggleValue('exchange', val)"
          >{{ label }}</button>
        </div>
      </div>

      <TagFilterGroup
        v-for="g in filterGroups"
        :key="g.key"
        :label="g.label"
        :items="(options as any)[g.key] ?? []"
        :selected="(selected as any)[g.key] ?? []"
        :wrap="g.wrap"
        @toggle="(v) => toggleValue(g.key as any, v)"
      />
    </section>

    <section class="tag-picker__summary">
      <span>
        共 <strong>{{ total }}</strong> 檔符合，已顯示 <strong>{{ results.length }}</strong> 筆
      </span>
      <button v-if="hasFilter" class="tag-picker__reset" @click="resetFilters">清除條件</button>
    </section>

    <section class="tag-picker__results">
      <div v-if="loading || initialLoading" class="tag-picker__empty">載入中…</div>
      <div v-else-if="!results.length" class="tag-picker__empty">沒有符合條件的股票</div>
      <table v-else class="tag-picker__table">
        <thead>
          <tr>
            <th class="tag-picker__cell--check">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate.prop="selectedCount > 0 && !allSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>代碼</th>
            <th>名稱</th>
            <th class="tag-picker__cell--num">現價</th>
            <th class="tag-picker__cell--num">漲跌%</th>
            <th class="tag-picker__cell--num">PE</th>
            <th class="tag-picker__cell--num">殖利率%</th>
            <th class="tag-picker__cell--num">成交金額</th>
            <th>標籤</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in results"
            :key="row.code"
            class="tag-picker__row"
            :class="{ 'tag-picker__row--selected': selectedCodes.has(row.code) }"
            @click="goToStock(row.code)"
          >
            <td class="tag-picker__cell--check" @click.stop>
              <input
                type="checkbox"
                :checked="selectedCodes.has(row.code)"
                @change="toggleStockSelection(row.code)"
              />
            </td>
            <td class="tag-picker__code">{{ row.code }}</td>
            <td>{{ row.name }}</td>
            <td class="tag-picker__cell--num">{{ row.price?.toFixed(2) }}</td>
            <td
              class="tag-picker__cell--num"
              :class="{
                'tag-picker__cell--up': row.changePercent > 0,
                'tag-picker__cell--down': row.changePercent < 0,
              }"
            >
              {{ row.changePercent > 0 ? '+' : '' }}{{ row.changePercent?.toFixed(2) }}%
            </td>
            <td class="tag-picker__cell--num">{{ row.pe > 0 ? row.pe.toFixed(1) : '-' }}</td>
            <td class="tag-picker__cell--num">{{ row.dividendYield > 0 ? row.dividendYield.toFixed(2) : '-' }}</td>
            <td class="tag-picker__cell--num">{{ formatTurnover(row.turnover) }}</td>
            <td>
              <div class="tag-picker__tags">
                <span class="tag-picker__tag tag-picker__tag--industry">{{ row.tags.industry }}</span>
                <span class="tag-picker__tag tag-picker__tag--cap">{{ row.tags.cap_size }}</span>
                <span class="tag-picker__tag tag-picker__tag--style">{{ row.tags.style }}</span>
                <span class="tag-picker__tag">{{ row.tags.liquidity }}</span>
                <span
                  class="tag-picker__tag"
                  :class="{
                    'tag-picker__tag--strong': row.tags.momentum === '強勢',
                    'tag-picker__tag--weak': row.tags.momentum === '弱勢',
                  }"
                >{{ row.tags.momentum }}</span>
                <span
                  v-if="row.tags.trend && row.tags.trend !== '未分析'"
                  class="tag-picker__tag"
                  :class="{
                    'tag-picker__tag--strong': row.tags.trend === '多頭排列',
                    'tag-picker__tag--weak': row.tags.trend === '空頭排列',
                  }"
                >{{ row.tags.trend }}</span>
                <span class="tag-picker__tag">{{ row.tags.valuation }}</span>
                <span class="tag-picker__tag">{{ row.tags.dividend }}</span>
                <span
                  v-for="f in row.tags.flags"
                  :key="f"
                  class="tag-picker__tag tag-picker__tag--flag"
                  @click.stop
                >
                  {{ f }}
                  <HelpTip v-if="FLAG_TIPS[f]" :text="FLAG_TIPS[f]" />
                </span>
                <span
                  v-for="s in row.tags.special"
                  :key="s"
                  class="tag-picker__tag tag-picker__tag--special"
                >{{ s }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="results.length && hasMore" class="tag-picker__load-more">
        <button
          class="tag-picker__load-more-btn"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '載入中…' : `載入更多（還有 ${total - results.length} 筆）` }}
        </button>
      </div>
    </section>

    <Transition name="tag-picker__bar">
      <div v-if="selectedCount > 0" class="tag-picker__actionbar">
        <div class="tag-picker__actionbar-inner">
          <div class="tag-picker__actionbar-count">
            已選 <strong>{{ selectedCount }}</strong> 檔
            <button class="tag-picker__actionbar-clear" @click="clearSelection">清除</button>
          </div>

          <div class="tag-picker__actionbar-periods">
            <span class="tag-picker__actionbar-label">交易週期</span>
            <button
              v-for="opt in PERIOD_OPTIONS"
              :key="opt.key"
              class="tag-picker__period"
              :class="{ 'tag-picker__period--active': selectedPeriod === opt.key }"
              :title="opt.hint"
              @click="selectedPeriod = opt.key"
            >
              <span class="tag-picker__period-label">{{ opt.label }}</span>
              <span class="tag-picker__period-hint">{{ opt.hint }}</span>
            </button>
          </div>

          <button
            class="tag-picker__actionbar-next"
            :disabled="!canProceed"
            @click="goToStrategy"
          >
            下一步 →
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.tag-picker {
  padding: 24px 24px 120px;
  color: var(--color-text);

  &__header { margin-bottom: 20px; }
  &__title { font-size: 22px; font-weight: 600; margin: 0 0 4px; }
  &__subtitle { font-size: 13px; color: var(--color-text-muted, #8b8fa8); margin: 0; }
  &__updated {
    font-size: 12px;
    color: var(--color-text-muted, #8b8fa8);
    margin: 6px 0 0;
    font-variant-numeric: tabular-nums;

    &--stale { color: #f59e0b; }
  }
  &__updated-hint { opacity: 0.7; margin-left: 4px; }

  &__filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--color-bg-soft, #1a1d2e);
    border-radius: 10px;
    margin-bottom: 16px;
  }

  &__summary {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    margin-bottom: 8px;
    color: var(--color-text-muted, #8b8fa8);

    strong { color: var(--color-text); font-size: 16px; margin: 0 4px; }
  }

  &__market-group {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  &__market-label {
    flex: 0 0 70px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted, #8b8fa8);
    padding-top: 6px;
  }

  &__chips {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    overflow-x: auto;
  }

  &__chip {
    padding: 4px 12px;
    border-radius: 14px;
    border: 1px solid var(--color-border, #2d3147);
    background: transparent;
    color: var(--color-text);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;

    &:hover { border-color: var(--color-accent, #6366f1); }

    &--active {
      background: var(--color-accent, #6366f1);
      color: #fff;
      border-color: var(--color-accent, #6366f1);
    }
  }

  &__hint { font-size: 12px; }

  &__reset {
    margin-left: auto;
    padding: 4px 10px;
    background: transparent;
    border: 1px solid var(--color-border, #2d3147);
    border-radius: 6px;
    color: var(--color-text-muted, #8b8fa8);
    font-size: 12px;
    cursor: pointer;

    &:hover { color: var(--color-text); border-color: var(--color-text-muted, #8b8fa8); }
  }

  &__results {
    background: var(--color-bg-soft, #1a1d2e);
    border-radius: 10px;
    overflow: hidden;
  }

  &__empty {
    padding: 40px;
    text-align: center;
    color: var(--color-text-muted, #8b8fa8);
  }

  &__load-more {
    display: flex;
    justify-content: center;
    padding: 16px;
    border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
  }

  &__load-more-btn {
    padding: 8px 20px;
    font-size: 13px;
    border-radius: 6px;
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
    background: transparent;
    color: var(--color-text-secondary, #b4b9d1);
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      background: var(--color-bg-hover, rgba(255, 255, 255, 0.05));
      color: var(--color-text-primary);
      border-color: var(--color-accent);
    }

    &:disabled {
      opacity: 0.5;
      cursor: wait;
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--color-border, #2d3147);
    }

    th {
      font-weight: 600;
      color: var(--color-text-muted, #8b8fa8);
      background: var(--color-bg, #141628);
      position: sticky;
      top: 0;
    }
  }

  &__row {
    cursor: pointer;
    &:hover { background: rgba(99, 102, 241, 0.08); }
    &--selected { background: rgba(99, 102, 241, 0.12); }
  }

  &__cell--check {
    width: 36px;
    text-align: center;
    padding: 10px 8px;

    input[type='checkbox'] {
      cursor: pointer;
      width: 16px;
      height: 16px;
      accent-color: var(--color-accent, #6366f1);
    }
  }

  &__code { font-family: monospace; font-weight: 600; }

  &__cell--num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    &.tag-picker__cell--up   { color: #ef4444; }
    &.tag-picker__cell--down { color: #22c55e; }
  }

  &__tags { display: flex; flex-wrap: wrap; gap: 4px; }

  &__tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-text);

    &--industry { background: rgba(139, 92, 246, 0.2); }
    &--strong   { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    &--weak     { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    &--flag     { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    &--cap      { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }
    &--style    { background: rgba(20, 184, 166, 0.18); color: #2dd4bf; }
    &--special  { background: rgba(249, 115, 22, 0.18); color: #fb923c; }
  }

  &__actionbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    background: var(--color-bg, #141628);
    border-top: 1px solid var(--color-border, #2d3147);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
    padding: 12px 24px;
  }

  &__actionbar-inner {
    display: flex;
    align-items: center;
    gap: 24px;
    max-width: 1600px;
    margin: 0 auto;
  }

  &__actionbar-count {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--color-text-muted, #8b8fa8);
    white-space: nowrap;

    strong { color: var(--color-text); font-size: 18px; font-weight: 700; }
  }

  &__actionbar-clear {
    background: transparent;
    border: 1px solid var(--color-border, #2d3147);
    color: var(--color-text-muted, #8b8fa8);
    padding: 2px 10px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;

    &:hover { color: var(--color-text); }
  }

  &__actionbar-periods {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow-x: auto;
  }

  &__actionbar-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted, #8b8fa8);
    white-space: nowrap;
    margin-right: 4px;
  }

  &__period {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 14px;
    background: transparent;
    border: 1px solid var(--color-border, #2d3147);
    border-radius: 8px;
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
    min-width: 140px;

    &:hover { border-color: var(--color-accent, #6366f1); }

    &--active {
      background: var(--color-accent, #6366f1);
      border-color: var(--color-accent, #6366f1);
      color: #fff;
    }
  }

  &__period-label { font-size: 14px; font-weight: 600; }
  &__period-hint  { font-size: 11px; opacity: 0.75; margin-top: 2px; }

  &__actionbar-next {
    padding: 10px 24px;
    background: var(--color-accent, #6366f1);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;

    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:not(:disabled):hover { opacity: 0.9; }
  }

  &__bar-enter-active,
  &__bar-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }

  &__bar-enter-from,
  &__bar-leave-to { transform: translateY(100%); opacity: 0; }
}
</style>
