<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'
import type { Ref } from 'vue'
import type { TradeRecord, TradeEmotion, TradeResult, TradeStrategy, StrategyPerformance, ExpectancyStats } from '@/types/workflow'
import { EMOTION_OPTIONS, RESULT_LABELS, STRATEGY_OPTIONS, STRATEGY_LABELS } from '@/types/workflow'

// Share records up to parent via inject/provide key
const tradeRecords = inject<Ref<TradeRecord[]>>('tradeRecords', ref([]))

const showForm = ref(false)
const editId = ref<string | null>(null)

const form = ref({
  code: '',
  name: '',
  entryDate: '',
  exitDate: '',
  entryPrice: '',
  exitPrice: '',
  shares: '',
  entryReason: '',
  emotion: '冷靜執行' as TradeEmotion,
  exitReason: '',
  result: 'active' as TradeResult,
  strategy: 'value' as TradeStrategy,
})

function resetForm() {
  form.value = {
    code: '', name: '', entryDate: '', exitDate: '',
    entryPrice: '', exitPrice: '', shares: '',
    entryReason: '', emotion: '冷靜執行', exitReason: '', result: 'active',
    strategy: 'value',
  }
  editId.value = null
}

function openAdd() {
  resetForm()
  const today = new Date().toISOString().split('T')[0]
  form.value.entryDate = today!
  showForm.value = true
}

function openEdit(record: TradeRecord) {
  editId.value = record.id
  form.value = {
    code: record.code,
    name: record.name,
    entryDate: record.entryDate,
    exitDate: record.exitDate ?? '',
    entryPrice: String(record.entryPrice),
    exitPrice: String(record.exitPrice ?? ''),
    shares: String(record.shares),
    entryReason: record.entryReason,
    emotion: record.emotion,
    exitReason: record.exitReason ?? '',
    result: record.result,
    strategy: record.strategy ?? 'value',
  }
  showForm.value = true
}

function saveRecord() {
  if (!form.value.code.trim() || !form.value.entryDate) return

  const entryPrice = Number(form.value.entryPrice)
  const exitPrice = form.value.exitPrice ? Number(form.value.exitPrice) : undefined
  let pnlPct: number | undefined
  if (exitPrice && entryPrice) {
    pnlPct = (exitPrice - entryPrice) / entryPrice * 100
  }

  const now = new Date().toISOString()

  if (editId.value) {
    const idx = tradeRecords.value.findIndex(r => r.id === editId.value)
    if (idx !== -1) {
      tradeRecords.value[idx] = {
        ...tradeRecords.value[idx]!,
        code: form.value.code.trim().toUpperCase(),
        name: form.value.name.trim() || form.value.code.trim(),
        entryDate: form.value.entryDate,
        exitDate: form.value.exitDate || undefined,
        entryPrice,
        exitPrice,
        shares: Number(form.value.shares) || 1,
        entryReason: form.value.entryReason,
        emotion: form.value.emotion,
        exitReason: form.value.exitReason || undefined,
        result: form.value.result,
        strategy: form.value.strategy,
        pnlPct,
      }
    }
  } else {
    tradeRecords.value.unshift({
      id: `trade-${Date.now()}`,
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim() || form.value.code.trim(),
      entryDate: form.value.entryDate,
      exitDate: form.value.exitDate || undefined,
      entryPrice,
      exitPrice,
      shares: Number(form.value.shares) || 1,
      entryReason: form.value.entryReason,
      emotion: form.value.emotion,
      exitReason: form.value.exitReason || undefined,
      result: form.value.result,
      strategy: form.value.strategy,
      pnlPct,
      createdAt: now,
    })
  }

  showForm.value = false
  resetForm()
}

function deleteRecord(id: string) {
  if (!confirm('確定要刪除這筆交易？')) return
  tradeRecords.value = tradeRecords.value.filter(r => r.id !== id)
}

// ── 統計計算輔助（策略分組 + 全域共用）─────────────────────
function diffDays(fromISO: string, toISO: string): number {
  const from = new Date(fromISO).getTime()
  const to = new Date(toISO).getTime()
  return Math.max(0, Math.round((to - from) / 86_400_000))
}

function realizedPnl(r: TradeRecord): number {
  if (r.exitPrice == null) return 0
  return (r.exitPrice - r.entryPrice) * r.shares * 1000
}

function computeBasicStats(records: TradeRecord[]) {
  const closed = records.filter(r => r.result !== 'active' && r.pnlPct != null)
  const wins = closed.filter(r => r.result === 'win')
  const losses = closed.filter(r => r.result === 'loss')
  const winRate = closed.length > 0 ? wins.length / closed.length : 0
  const avgWinPct = wins.length > 0 ? wins.reduce((s, r) => s + (r.pnlPct ?? 0), 0) / wins.length : 0
  const avgLossPct = losses.length > 0 ? Math.abs(losses.reduce((s, r) => s + (r.pnlPct ?? 0), 0) / losses.length) : 0
  const expectancy = winRate * avgWinPct - (1 - winRate) * avgLossPct
  return { closed, wins, losses, winRate, avgWinPct, avgLossPct, expectancy }
}

// Stats
const stats = computed<ExpectancyStats>(() => {
  const basic = computeBasicStats(tradeRecords.value)
  const { closed, wins, losses, winRate, avgWinPct, avgLossPct, expectancy } = basic

  // 賺賠比 — avgLossPct 為 0 時若有獲利則視為無限大，否則 0
  const profitFactor = avgLossPct > 0 ? avgWinPct / avgLossPct : (avgWinPct > 0 ? Infinity : 0)

  // 平均持有天數（有進出場日期的 closed 交易）
  const withDates = closed.filter(r => r.exitDate)
  const avgHoldingDays = withDates.length > 0
    ? withDates.reduce((s, r) => s + diffDays(r.entryDate, r.exitDate!), 0) / withDates.length
    : 0

  // 總實現損益（元）
  const totalRealizedPnl = closed.reduce((s, r) => s + realizedPnl(r), 0)

  // 連虧次數
  let maxConsec = 0, cur = 0
  for (const r of [...tradeRecords.value].reverse()) {
    if (r.result === 'loss') { cur++; maxConsec = Math.max(maxConsec, cur) }
    else if (r.result !== 'active') cur = 0
  }

  const best = wins.length > 0 ? wins.reduce((a, b) => (a.pnlPct ?? 0) > (b.pnlPct ?? 0) ? a : b) : null
  const worst = losses.length > 0 ? losses.reduce((a, b) => (a.pnlPct ?? 0) < (b.pnlPct ?? 0) ? a : b) : null

  // 策略分類績效
  const byStrategy: StrategyPerformance[] = STRATEGY_OPTIONS
    .map((strat): StrategyPerformance | null => {
      const subset = tradeRecords.value.filter(r => (r.strategy ?? 'value') === strat)
      if (subset.length === 0) return null
      const s = computeBasicStats(subset)
      const totalPnl = s.closed.reduce((acc, r) => acc + realizedPnl(r), 0)
      return {
        strategy: strat,
        totalTrades: subset.length,
        closedTrades: s.closed.length,
        wins: s.wins.length,
        losses: s.losses.length,
        winRate: s.winRate,
        avgWinPct: s.avgWinPct,
        avgLossPct: s.avgLossPct,
        expectancy: s.expectancy,
        totalPnl,
      }
    })
    .filter((x): x is StrategyPerformance => x !== null)

  return {
    totalTrades: tradeRecords.value.length,
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
    byStrategy,
  }
})

function formatPnl(n: number) {
  if (Math.abs(n) >= 10000) return `${n >= 0 ? '+' : ''}${(n / 10000).toFixed(1)} 萬`
  return `${n >= 0 ? '+' : ''}${n.toFixed(0)}`
}

function formatPF(n: number) {
  if (!isFinite(n)) return '∞'
  return n.toFixed(2)
}

function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function pnlClass(r: TradeRecord) {
  if (r.result === 'win') return 'text-up'
  if (r.result === 'loss') return 'text-down'
  return ''
}

function resultBadgeClass(result: TradeResult) {
  return {
    'win': 'badge--win',
    'loss': 'badge--loss',
    'breakeven': 'badge--even',
    'active': 'badge--active',
  }[result] ?? ''
}
</script>

<template>
  <div class="journal">
    <!-- Stats Cards -->
    <div class="journal__stats">
      <div class="journal__stat-card">
        <div class="journal__stat-label">勝率</div>
        <div class="journal__stat-value" :class="stats.winRate >= 0.5 ? 'text-up' : 'text-down'">
          {{ (stats.winRate * 100).toFixed(0) }}%
        </div>
        <div class="journal__stat-sub">{{ stats.wins }}W / {{ stats.losses }}L</div>
      </div>
      <div class="journal__stat-card">
        <div class="journal__stat-label">平均獲利</div>
        <div class="journal__stat-value text-up">
          {{ stats.avgWinPct > 0 ? '+' : '' }}{{ stats.avgWinPct.toFixed(1) }}%
        </div>
        <div class="journal__stat-sub">已結算 {{ stats.closedTrades }} 筆</div>
      </div>
      <div class="journal__stat-card">
        <div class="journal__stat-label">平均虧損</div>
        <div class="journal__stat-value text-down">
          -{{ stats.avgLossPct.toFixed(1) }}%
        </div>
        <div class="journal__stat-sub">最多連虧 {{ stats.maxConsecutiveLosses }} 次</div>
      </div>
      <div class="journal__stat-card">
        <div class="journal__stat-label">賺賠比</div>
        <div class="journal__stat-value" :class="stats.profitFactor >= 1 ? 'text-up' : 'text-down'">
          {{ formatPF(stats.profitFactor) }}
        </div>
        <div class="journal__stat-sub">avg win / avg loss</div>
      </div>
      <div class="journal__stat-card">
        <div class="journal__stat-label">平均持有</div>
        <div class="journal__stat-value">
          {{ stats.avgHoldingDays.toFixed(1) }} <span class="journal__stat-unit">天</span>
        </div>
        <div class="journal__stat-sub">僅已平倉</div>
      </div>
      <div class="journal__stat-card">
        <div class="journal__stat-label">實現損益</div>
        <div class="journal__stat-value" :class="stats.totalRealizedPnl >= 0 ? 'text-up' : 'text-down'">
          {{ formatPnl(stats.totalRealizedPnl) }}
        </div>
        <div class="journal__stat-sub">元</div>
      </div>
      <div class="journal__stat-card journal__stat-card--highlight">
        <div class="journal__stat-label">期望值 E</div>
        <div class="journal__stat-value" :class="stats.expectancy >= 0 ? 'text-up' : 'text-down'">
          {{ pct(stats.expectancy) }}
        </div>
        <div class="journal__stat-formula" v-if="stats.closedTrades > 0">
          {{ (stats.winRate * 100).toFixed(0) }}% × {{ stats.avgWinPct.toFixed(1) }}% − {{ ((1-stats.winRate)*100).toFixed(0) }}% × {{ stats.avgLossPct.toFixed(1) }}%
        </div>
        <div class="journal__stat-sub" v-else>尚無結算交易</div>
      </div>
    </div>

    <!-- 策略分類績效 -->
    <div v-if="stats.byStrategy.length > 0" class="journal__by-strategy">
      <div class="journal__by-strategy-title">策略分類績效</div>
      <table class="journal__strategy-table">
        <thead>
          <tr>
            <th>策略</th>
            <th class="text-right">交易數</th>
            <th class="text-right">勝率</th>
            <th class="text-right">平均獲利</th>
            <th class="text-right">平均虧損</th>
            <th class="text-right">期望值</th>
            <th class="text-right">實現損益</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sp in stats.byStrategy" :key="sp.strategy">
            <td><span class="badge" :class="`strategy-badge--${sp.strategy}`">{{ STRATEGY_LABELS[sp.strategy] }}</span></td>
            <td class="text-right journal__num">{{ sp.totalTrades }}（平倉 {{ sp.closedTrades }}）</td>
            <td class="text-right journal__num" :class="sp.winRate >= 0.5 ? 'text-up' : sp.closedTrades > 0 ? 'text-down' : ''">
              {{ sp.closedTrades > 0 ? `${(sp.winRate * 100).toFixed(0)}%` : '—' }}
            </td>
            <td class="text-right journal__num text-up">{{ sp.avgWinPct > 0 ? `+${sp.avgWinPct.toFixed(1)}%` : '—' }}</td>
            <td class="text-right journal__num text-down">{{ sp.avgLossPct > 0 ? `-${sp.avgLossPct.toFixed(1)}%` : '—' }}</td>
            <td class="text-right journal__num" :class="sp.expectancy >= 0 ? 'text-up' : 'text-down'">
              {{ sp.closedTrades > 0 ? pct(sp.expectancy) : '—' }}
            </td>
            <td class="text-right journal__num" :class="sp.totalPnl >= 0 ? 'text-up' : 'text-down'">
              {{ sp.closedTrades > 0 ? formatPnl(sp.totalPnl) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Toolbar -->
    <div class="journal__toolbar">
      <span class="journal__toolbar-title">交易日誌（共 {{ tradeRecords.length }} 筆）</span>
      <button class="journal__btn journal__btn--primary" @click="openAdd">+ 新增交易</button>
    </div>

    <!-- Add / Edit Form -->
    <div v-if="showForm" class="journal__form">
      <div class="journal__form-row">
        <div class="journal__form-group">
          <label class="journal__label">股票代碼</label>
          <input v-model="form.code" class="journal__input" placeholder="2330" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">股票名稱</label>
          <input v-model="form.name" class="journal__input" placeholder="台積電" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">進場日期</label>
          <input v-model="form.entryDate" type="date" class="journal__input" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">出場日期</label>
          <input v-model="form.exitDate" type="date" class="journal__input" />
        </div>
      </div>
      <div class="journal__form-row">
        <div class="journal__form-group">
          <label class="journal__label">進場價</label>
          <input v-model="form.entryPrice" type="number" class="journal__input" placeholder="0" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">出場價</label>
          <input v-model="form.exitPrice" type="number" class="journal__input" placeholder="0" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">股數（張）</label>
          <input v-model="form.shares" type="number" class="journal__input" placeholder="1" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">結果</label>
          <select v-model="form.result" class="journal__select">
            <option v-for="(label, key) in RESULT_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
      </div>
      <div class="journal__form-row">
        <div class="journal__form-group">
          <label class="journal__label">策略</label>
          <select v-model="form.strategy" class="journal__select">
            <option v-for="s in STRATEGY_OPTIONS" :key="s" :value="s">{{ STRATEGY_LABELS[s] }}</option>
          </select>
        </div>
        <div class="journal__form-group journal__form-group--wide">
          <label class="journal__label">進場原因（基於哪個漏斗？）</label>
          <input v-model="form.entryReason" class="journal__input" placeholder="如：均線突破 + 法人連買 3 日" />
        </div>
        <div class="journal__form-group">
          <label class="journal__label">當下情緒</label>
          <select v-model="form.emotion" class="journal__select">
            <option v-for="e in EMOTION_OPTIONS" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
      </div>
      <div class="journal__form-row">
        <div class="journal__form-group journal__form-group--full">
          <label class="journal__label">出場原因</label>
          <input v-model="form.exitReason" class="journal__input" placeholder="如：利多出盡、跌破停損點" />
        </div>
      </div>
      <div class="journal__form-actions">
        <button class="journal__btn journal__btn--ghost" @click="showForm = false; resetForm()">取消</button>
        <button class="journal__btn journal__btn--primary" @click="saveRecord">{{ editId ? '更新' : '新增' }}</button>
      </div>
    </div>

    <!-- Table -->
    <div class="journal__table-wrap">
      <table class="journal__table">
        <thead>
          <tr>
            <th>日期</th>
            <th>股票</th>
            <th>策略</th>
            <th>進場價</th>
            <th>出場價</th>
            <th>損益</th>
            <th>進場原因</th>
            <th>情緒</th>
            <th>結果</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in tradeRecords" :key="r.id" class="journal__row">
            <td class="journal__td-date">{{ r.entryDate }}</td>
            <td>
              <span class="journal__code">{{ r.code }}</span>
              <span class="journal__name">{{ r.name }}</span>
            </td>
            <td>
              <span class="badge" :class="`strategy-badge--${r.strategy ?? 'value'}`">
                {{ STRATEGY_LABELS[r.strategy ?? 'value'] }}
              </span>
            </td>
            <td class="journal__num">{{ r.entryPrice }}</td>
            <td class="journal__num">{{ r.exitPrice ?? '—' }}</td>
            <td class="journal__num" :class="pnlClass(r)">
              {{ r.pnlPct != null ? pct(r.pnlPct) : '—' }}
            </td>
            <td class="journal__reason">{{ r.entryReason || '—' }}</td>
            <td>
              <span class="journal__emotion" :class="r.emotion === '冷靜執行' ? 'journal__emotion--calm' : 'journal__emotion--warn'">
                {{ r.emotion }}
              </span>
            </td>
            <td>
              <span class="badge" :class="resultBadgeClass(r.result)">{{ RESULT_LABELS[r.result] }}</span>
            </td>
            <td class="journal__actions">
              <button class="journal__action-btn" @click="openEdit(r)" title="編輯">✎</button>
              <button class="journal__action-btn journal__action-btn--del" @click="deleteRecord(r.id)" title="刪除">✕</button>
            </td>
          </tr>
          <tr v-if="tradeRecords.length === 0">
            <td colspan="10" class="journal__empty">尚無交易紀錄，點擊「+ 新增交易」開始記錄</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.journal {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  // Stats
  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__stat-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;

    &--highlight {
      border-color: var(--color-accent);
      background: var(--color-accent-soft);
    }
  }

  &__stat-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  &__stat-value {
    font-size: 24px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    margin-bottom: 4px;
  }

  &__stat-sub {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__stat-formula {
    font-size: 10px;
    color: var(--color-text-muted);
    font-family: 'Fira Code', monospace;
    line-height: 1.4;
    margin-top: 2px;
  }

  &__stat-unit {
    font-size: 13px;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  // 策略分類績效表
  &__by-strategy {
    padding: 12px 20px 16px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__by-strategy-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  &__strategy-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;

    th {
      text-align: left;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
    }

    td {
      padding: 8px;
      border-bottom: 1px solid var(--color-border);
    }
  }

  // Toolbar
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    &-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
    }
  }

  // Form
  &__form {
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    &-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    &-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;

      &--wide { flex: 2; min-width: 200px; }
      &--full { flex: 1; }
    }

    &-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  &__input, &__select {
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;

    &:focus { border-color: var(--color-accent); }
    &::placeholder { color: var(--color-text-muted); }
  }

  // Table
  &__table-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th {
      text-align: left;
      padding: 10px 8px;
      border-bottom: 1px solid var(--color-border);
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  }

  &__row {
    border-bottom: 1px solid var(--color-border);
    transition: background 0.1s;

    &:hover { background: var(--color-bg-hover); }

    td { padding: 10px 8px; }
  }

  &__td-date {
    font-size: 12px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__code {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-accent);
    margin-right: 4px;
  }

  &__name {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__num {
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    white-space: nowrap;
  }

  &__reason {
    font-size: 12px;
    color: var(--color-text-muted);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__emotion {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;

    &--calm { background: rgba(34,197,94,0.1); color: var(--color-up); }
    &--warn { background: rgba(245,158,11,0.1); color: #f59e0b; }
  }

  &__actions {
    display: flex;
    gap: 4px;
    white-space: nowrap;
  }

  &__action-btn {
    padding: 3px 7px;
    font-size: 12px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.12s;

    &:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }

    &--del:hover { color: var(--color-down); border-color: var(--color-down); }
  }

  &__empty {
    text-align: center;
    padding: 32px;
    color: var(--color-text-muted);
    font-size: 13px;
  }

  // Buttons
  &__btn {
    font-size: 13px;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.15s;

    &--primary {
      background: var(--color-accent);
      color: #fff;
      &:hover { opacity: 0.9; }
    }

    &--ghost {
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      &:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
    }
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

.strategy-badge {
  &--value    { background: rgba(34,197,94,0.12);  color: var(--color-up); }
  &--swing    { background: rgba(59,130,246,0.12); color: #3b82f6; }
  &--daytrade { background: rgba(245,158,11,0.12); color: #f59e0b; }
  &--event    { background: rgba(168,85,247,0.12); color: #a855f7; }
  &--other    { background: var(--color-bg-hover); color: var(--color-text-muted); }
}
</style>
