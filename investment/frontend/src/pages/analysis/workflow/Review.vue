<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Ref } from 'vue'
import type { TradeRecord, ExpectancyStats } from '@/types/workflow'
import { RESULT_LABELS } from '@/types/workflow'

const tradeRecords = inject<Ref<TradeRecord[]>>('tradeRecords', ref([]))

// Month navigation
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1) // 1-12

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  const n = new Date()
  if (currentYear.value > n.getFullYear() || (currentYear.value === n.getFullYear() && currentMonth.value >= n.getMonth() + 1)) return
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
}

const monthLabel = computed(() =>
  `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
)

const isCurrentMonth = computed(() => {
  const n = new Date()
  return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth() + 1
})

// Filter records for current month
const monthRecords = computed(() => {
  const prefix = monthLabel.value
  return tradeRecords.value.filter(r => r.entryDate.startsWith(prefix))
})

// Stats for this month
const stats = computed<ExpectancyStats>(() => {
  const all = monthRecords.value
  const closed = all.filter(r => r.result !== 'active' && r.pnlPct != null)
  const wins = closed.filter(r => r.result === 'win')
  const losses = closed.filter(r => r.result === 'loss')

  const winRate = closed.length > 0 ? wins.length / closed.length : 0
  const avgWinPct = wins.length > 0 ? wins.reduce((s, r) => s + (r.pnlPct ?? 0), 0) / wins.length : 0
  const avgLossPct = losses.length > 0 ? Math.abs(losses.reduce((s, r) => s + (r.pnlPct ?? 0), 0) / losses.length) : 0
  const expectancy = winRate * avgWinPct - (1 - winRate) * avgLossPct

  let maxConsec = 0, cur = 0
  for (const r of [...all].reverse()) {
    if (r.result === 'loss') { cur++; maxConsec = Math.max(maxConsec, cur) }
    else if (r.result !== 'active') cur = 0
  }

  const best = wins.length > 0 ? wins.reduce((a, b) => (a.pnlPct ?? 0) > (b.pnlPct ?? 0) ? a : b) : null
  const worst = losses.length > 0 ? losses.reduce((a, b) => (a.pnlPct ?? 0) < (b.pnlPct ?? 0) ? a : b) : null

  const profitFactor = avgLossPct > 0 ? avgWinPct / avgLossPct : (avgWinPct > 0 ? Infinity : 0)

  const withDates = closed.filter(r => r.exitDate)
  const avgHoldingDays = withDates.length > 0
    ? withDates.reduce((s, r) => {
        const from = new Date(r.entryDate).getTime()
        const to = new Date(r.exitDate!).getTime()
        return s + Math.max(0, Math.round((to - from) / 86_400_000))
      }, 0) / withDates.length
    : 0

  const totalRealizedPnl = closed.reduce((s, r) => {
    if (r.exitPrice == null) return s
    return s + (r.exitPrice - r.entryPrice) * r.shares * 1000
  }, 0)

  return {
    totalTrades: all.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    avgWinPct,
    avgLossPct,
    profitFactor,
    avgHoldingDays,
    totalRealizedPnl,
    expectancy,
    maxConsecutiveLosses: maxConsec,
    bestTrade: best,
    worstTrade: worst,
    byStrategy: [],
  }
})

// Failure analysis
const failureAnalysis = computed(() => {
  const losses = monthRecords.value.filter(r => r.result === 'loss')
  let selection = 0, timing = 0, discipline = 0, other = 0

  for (const r of losses) {
    const reason = (r.exitReason ?? '').toLowerCase()
    if (reason.includes('基本面') || reason.includes('財報') || reason.includes('業績')) selection++
    else if (reason.includes('追高') || reason.includes('太早') || reason.includes('時機')) timing++
    else if (reason.includes('停損') || reason.includes('紀律') || reason.includes('捨不得')) discipline++
    else other++
  }

  return { selection, timing, discipline, other }
})

// Emotion breakdown
const emotionBreakdown = computed(() => {
  const map: Record<string, number> = {}
  for (const r of monthRecords.value) {
    map[r.emotion] = (map[r.emotion] ?? 0) + 1
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
})

function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function resultBadgeClass(result: string) {
  return { win: 'badge--win', loss: 'badge--loss', breakeven: 'badge--even', active: 'badge--active' }[result] ?? ''
}
</script>

<template>
  <div class="review">
    <!-- Month Nav -->
    <div class="review__month-nav">
      <button class="review__nav-btn" @click="prevMonth">←</button>
      <span class="review__month-label">{{ monthLabel }}</span>
      <button class="review__nav-btn" @click="nextMonth" :disabled="isCurrentMonth">→</button>
      <span v-if="isCurrentMonth" class="review__current-tag">本月</span>
    </div>

    <!-- No data -->
    <div v-if="monthRecords.length === 0" class="review__empty">
      <div class="review__empty-icon">📊</div>
      <p>{{ monthLabel }} 尚無交易紀錄</p>
      <p class="review__empty-hint">前往「交易日誌」新增本月交易</p>
    </div>

    <template v-else>
      <!-- Summary Stats -->
      <div class="review__stats-grid">
        <div class="review__stat">
          <div class="review__stat-label">總交易</div>
          <div class="review__stat-value">{{ stats.totalTrades }}</div>
          <div class="review__stat-sub">{{ stats.wins }}勝 {{ stats.losses }}敗 {{ stats.totalTrades - stats.closedTrades }}進行中</div>
        </div>
        <div class="review__stat">
          <div class="review__stat-label">勝率</div>
          <div class="review__stat-value" :class="stats.winRate >= 0.5 ? 'text-up' : 'text-down'">
            {{ stats.closedTrades > 0 ? (stats.winRate * 100).toFixed(0) + '%' : '—' }}
          </div>
        </div>
        <div class="review__stat">
          <div class="review__stat-label">期望值 E</div>
          <div class="review__stat-value" :class="stats.expectancy >= 0 ? 'text-up' : 'text-down'">
            {{ stats.closedTrades > 0 ? pct(stats.expectancy) : '—' }}
          </div>
        </div>
        <div class="review__stat">
          <div class="review__stat-label">最大連虧</div>
          <div class="review__stat-value" :class="stats.maxConsecutiveLosses >= 3 ? 'text-down' : ''">
            {{ stats.maxConsecutiveLosses }} 次
          </div>
        </div>
      </div>

      <div class="review__body">
        <!-- Best / Worst -->
        <div class="review__highlights">
          <div class="review__highlight review__highlight--best" v-if="stats.bestTrade">
            <div class="review__highlight-tag">🏆 最佳交易</div>
            <div class="review__highlight-stock">
              <span class="review__highlight-code">{{ stats.bestTrade.code }}</span>
              <span class="review__highlight-name">{{ stats.bestTrade.name }}</span>
            </div>
            <div class="review__highlight-pnl text-up">{{ pct(stats.bestTrade.pnlPct ?? 0) }}</div>
            <div class="review__highlight-reason">{{ stats.bestTrade.entryReason || '—' }}</div>
          </div>

          <div class="review__highlight review__highlight--worst" v-if="stats.worstTrade">
            <div class="review__highlight-tag">📉 最差交易</div>
            <div class="review__highlight-stock">
              <span class="review__highlight-code">{{ stats.worstTrade.code }}</span>
              <span class="review__highlight-name">{{ stats.worstTrade.name }}</span>
            </div>
            <div class="review__highlight-pnl text-down">{{ pct(stats.worstTrade.pnlPct ?? 0) }}</div>
            <div class="review__highlight-reason">{{ stats.worstTrade.exitReason || '—' }}</div>
          </div>
        </div>

        <!-- Failure Analysis -->
        <div class="review__section" v-if="stats.losses > 0">
          <h3 class="review__section-title">失敗追思會</h3>
          <div class="review__failure-row">
            <div class="review__failure-item">
              <span class="review__failure-count">{{ failureAnalysis.selection }}</span>
              <span class="review__failure-label">選股錯誤</span>
            </div>
            <div class="review__failure-sep">|</div>
            <div class="review__failure-item">
              <span class="review__failure-count">{{ failureAnalysis.timing }}</span>
              <span class="review__failure-label">進場時機錯誤</span>
            </div>
            <div class="review__failure-sep">|</div>
            <div class="review__failure-item">
              <span class="review__failure-count">{{ failureAnalysis.discipline }}</span>
              <span class="review__failure-label">紀律問題</span>
            </div>
            <div class="review__failure-sep">|</div>
            <div class="review__failure-item">
              <span class="review__failure-count">{{ failureAnalysis.other }}</span>
              <span class="review__failure-label">其他</span>
            </div>
          </div>
          <p class="review__failure-hint">分類依據出場原因關鍵字自動歸類。可在「交易日誌」補充出場原因讓分析更準確。</p>
        </div>

        <!-- Emotion breakdown -->
        <div class="review__section" v-if="emotionBreakdown.length > 0">
          <h3 class="review__section-title">情緒分佈</h3>
          <div class="review__emotion-row">
            <div
              v-for="[emotion, count] in emotionBreakdown"
              :key="emotion"
              class="review__emotion-item"
              :class="emotion === '冷靜執行' ? 'review__emotion-item--calm' : 'review__emotion-item--warn'"
            >
              <span class="review__emotion-count">{{ count }}</span>
              <span class="review__emotion-label">{{ emotion }}</span>
            </div>
          </div>
        </div>

        <!-- Trade list -->
        <div class="review__section">
          <h3 class="review__section-title">本月交易明細</h3>
          <table class="review__table">
            <thead>
              <tr>
                <th>日期</th>
                <th>股票</th>
                <th>進場價</th>
                <th>出場價</th>
                <th>損益</th>
                <th>情緒</th>
                <th>結果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in monthRecords" :key="r.id">
                <td class="review__td-muted">{{ r.entryDate }}</td>
                <td>
                  <span class="review__code">{{ r.code }}</span>
                  <span class="review__name">{{ r.name }}</span>
                </td>
                <td class="review__num">{{ r.entryPrice }}</td>
                <td class="review__num">{{ r.exitPrice ?? '—' }}</td>
                <td class="review__num" :class="r.result === 'win' ? 'text-up' : r.result === 'loss' ? 'text-down' : ''">
                  {{ r.pnlPct != null ? pct(r.pnlPct) : '—' }}
                </td>
                <td>
                  <span class="review__emotion-badge" :class="r.emotion === '冷靜執行' ? 'review__emotion-badge--calm' : 'review__emotion-badge--warn'">
                    {{ r.emotion }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="resultBadgeClass(r.result)">{{ RESULT_LABELS[r.result] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.review {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  // Month nav
  &__month-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__nav-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  &__month-label {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    min-width: 80px;
  }

  &__current-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 8px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
  }

  // Empty
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--color-text-muted);
    font-size: 14px;

    &-icon { font-size: 48px; opacity: 0.3; }
    &-hint { font-size: 12px; }
  }

  // Stats grid
  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__stat {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;

    &-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    &-value {
      font-size: 22px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      margin-bottom: 2px;
    }

    &-sub {
      font-size: 11px;
      color: var(--color-text-muted);
    }
  }

  // Body
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  // Highlights
  &__highlights {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  &__highlight {
    padding: 14px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);

    &--best {
      border-color: var(--color-up);
      background: rgba(34,197,94,0.05);
    }

    &--worst {
      border-color: var(--color-down);
      background: rgba(239,68,68,0.05);
    }

    &-tag {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }

    &-stock {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    &-code {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-accent);
    }

    &-name {
      font-size: 13px;
      color: var(--color-text-primary);
    }

    &-pnl {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    &-reason {
      font-size: 12px;
      color: var(--color-text-muted);
    }
  }

  // Section
  &__section {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;

    &-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 14px;
    }
  }

  // Failure analysis
  &__failure-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  &__failure-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__failure-count {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-down);
  }

  &__failure-label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__failure-sep {
    color: var(--color-border);
    font-size: 18px;
  }

  &__failure-hint {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  // Emotion
  &__emotion-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__emotion-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);

    &--calm { background: rgba(34,197,94,0.1); color: var(--color-up); }
    &--warn { background: rgba(245,158,11,0.1); color: #f59e0b; }
  }

  &__emotion-count { font-size: 16px; font-weight: 700; }
  &__emotion-label { font-size: 12px; }

  &__emotion-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    &--calm { background: rgba(34,197,94,0.1); color: var(--color-up); }
    &--warn { background: rgba(245,158,11,0.1); color: #f59e0b; }
  }

  // Table
  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid var(--color-border);
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 9px 8px;
      border-bottom: 1px solid var(--color-border);
    }
  }

  &__td-muted { color: var(--color-text-muted); font-size: 12px; }

  &__code {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-accent);
    margin-right: 4px;
  }

  &__name { font-size: 12px; color: var(--color-text-secondary); }

  &__num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.text-up { color: var(--color-up); }
.text-down { color: var(--color-down); }

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 3px;

  &--win { background: rgba(34,197,94,0.15); color: var(--color-up); }
  &--loss { background: rgba(239,68,68,0.1); color: var(--color-down); }
  &--even { background: var(--color-bg-hover); color: var(--color-text-muted); }
  &--active { background: rgba(59,130,246,0.1); color: #3b82f6; }
}
</style>
