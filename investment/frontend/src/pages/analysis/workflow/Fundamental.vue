<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

// ── 型別 ─────────────────────────────────────────────────────
interface RevenueRow {
  date: string
  revenue: number
  mom: number | null
  yoy: number | null
}

interface ProfitRow {
  date?: string
  period?: string
  roe?: number | null
  roa?: number | null
  gross_margin?: number | null
  operating_margin?: number | null
  net_margin?: number | null
  eps?: number | null
  [key: string]: unknown
}

interface InstitutionalRow {
  date: string
  foreign_net: number
  trust_net: number
  dealer_net: number
  total_net: number
}

interface FundamentalData {
  source: string
  stock_id: string
  revenue: RevenueRow[]
  profitability: ProfitRow[]
  institutional: InstitutionalRow[]
  statements?: Record<string, unknown>[]
  fetched_at: string
}

// ── Token 狀態 ───────────────────────────────────────────────
interface TokenStatus {
  has_token: boolean
  saved_at: string | null
  expires_at?: string
  remaining_seconds?: number
  expired?: boolean
  message: string
}

const tokenStatus = ref<TokenStatus | null>(null)

async function fetchTokenStatus() {
  try {
    const { data } = await api.get<TokenStatus>('/analysis/finmind-token-status/')
    tokenStatus.value = data
  } catch {
    tokenStatus.value = null
  }
}

onMounted(fetchTokenStatus)

const tokenHintClass = computed(() => {
  if (!tokenStatus.value) return ''
  if (tokenStatus.value.expired) return 'fundamental__token--expired'
  if ((tokenStatus.value.remaining_seconds ?? 0) < 86400) return 'fundamental__token--warning'
  return 'fundamental__token--ok'
})

// ── 狀態 ─────────────────────────────────────────────────────
const stockId = ref('2330')
const source = ref<'finmind' | 'goodinfo'>('finmind')
const loading = ref(false)
const error = ref('')
const data = ref<FundamentalData | null>(null)

const activeSection = ref<'revenue' | 'profitability' | 'institutional'>('revenue')

// ── 抓取 ─────────────────────────────────────────────────────
async function fetchData() {
  const sid = stockId.value.trim()
  if (!sid) return
  loading.value = true
  error.value = ''
  data.value = null
  try {
    const { data: resp } = await api.get<FundamentalData>('/analysis/fundamental/', {
      params: { stock_id: sid, source: source.value },
    })
    data.value = resp
  } catch (e: any) {
    error.value = e?.response?.data?.error || '無法取得資料，請確認後端是否運行'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchData()
}

// ── 工具函式 ─────────────────────────────────────────────────
function chgClass(v: number | null | undefined): string {
  if (v == null) return ''
  return v > 0 ? 'up' : v < 0 ? 'down' : ''
}

function chgText(v: number | null | undefined, suffix = '%'): string {
  if (v == null) return '—'
  return (v > 0 ? '+' : '') + Number(v).toFixed(2) + suffix
}

function numText(v: number | null | undefined): string {
  if (v == null) return '—'
  return Number(v).toLocaleString()
}

function revenueInBillion(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v / 1000).toFixed(1)
}

// ── 法人累計 ─────────────────────────────────────────────────
const institutionalSummary = computed(() => {
  if (!data.value?.institutional?.length) return null
  const rows = data.value.institutional
  let foreign = 0, trust = 0, dealer = 0
  for (const r of rows) {
    foreign += r.foreign_net || 0
    trust += r.trust_net || 0
    dealer += r.dealer_net || 0
  }
  return {
    foreign: Math.round(foreign),
    trust: Math.round(trust),
    dealer: Math.round(dealer),
    total: Math.round(foreign + trust + dealer),
    days: rows.length,
  }
})

// ── 營收迷你柱狀圖（最近 12 個月）───────────────────────────
const revenueChartData = computed(() => {
  if (!data.value?.revenue?.length) return []
  return data.value.revenue.slice(-12)
})

const revenueMax = computed(() => {
  const vals = revenueChartData.value.map(r => r.revenue || 0)
  return Math.max(...vals, 1)
})

// ── 三率趨勢 ────────────────────────────────────────────────
const profitRows = computed(() => {
  if (!data.value?.profitability?.length) return []
  return data.value.profitability
})

const latestProfit = computed(() => {
  const rows = profitRows.value
  if (!rows.length) return null
  return rows[rows.length - 1]
})
</script>

<template>
  <div class="fundamental">
    <!-- 搜尋列 -->
    <div class="fundamental__search">
      <div class="fundamental__search-row">
        <input
          v-model="stockId"
          class="fundamental__input"
          placeholder="輸入股票代碼（如 2330）"
          @keydown.enter="handleSearch"
        />
        <div class="fundamental__source-toggle">
          <button
            class="fundamental__source-btn"
            :class="{ 'fundamental__source-btn--active': source === 'finmind' }"
            @click="source = 'finmind'"
          >FinMind</button>
          <button
            class="fundamental__source-btn"
            :class="{ 'fundamental__source-btn--active': source === 'goodinfo' }"
            @click="source = 'goodinfo'"
          >Goodinfo</button>
        </div>
        <button class="fundamental__search-btn" @click="handleSearch" :disabled="loading">
          {{ loading ? '查詢中…' : '查詢' }}
        </button>
      </div>
      <div v-if="data" class="fundamental__meta">
        <span class="fundamental__meta-source">{{ data.source }}</span>
        <span class="fundamental__meta-stock">{{ data.stock_id }}</span>
        <span class="fundamental__meta-time">{{ new Date(data.fetched_at).toLocaleString('zh-TW') }}</span>
      </div>
    </div>

    <!-- FinMind Token 狀態 -->
    <div v-if="tokenStatus" class="fundamental__token" :class="tokenHintClass">
      <span class="fundamental__token-icon">{{ tokenStatus.expired ? '!' : tokenStatus.has_token ? '~' : '?' }}</span>
      <span class="fundamental__token-msg">{{ tokenStatus.message }}</span>
      <a
        v-if="tokenStatus.expired || !tokenStatus.has_token"
        class="fundamental__token-link"
        href="https://finmindtrade.com/analysis/#/account/user"
        target="_blank"
        rel="noopener noreferrer"
      >前往取得新 Token</a>
      <span v-if="tokenStatus.expires_at" class="fundamental__token-exp">
        到期：{{ new Date(tokenStatus.expires_at).toLocaleString('zh-TW') }}
      </span>
      <span v-if="tokenStatus.saved_at" class="fundamental__token-saved">
        寫入：{{ tokenStatus.saved_at }}
      </span>
    </div>

    <!-- 錯誤 -->
    <div v-if="error" class="fundamental__error">{{ error }}</div>

    <!-- 載入中 -->
    <div v-if="loading" class="fundamental__loading">載入中…</div>

    <!-- 資料展示 -->
    <template v-if="data && !loading">
      <!-- 快速指標摘要 -->
      <div class="fundamental__summary">
        <div class="fundamental__card">
          <div class="fundamental__card-label">ROE</div>
          <div class="fundamental__card-value" :class="chgClass(latestProfit?.roe as number)">
            {{ chgText(latestProfit?.roe as number) }}
          </div>
        </div>
        <div class="fundamental__card">
          <div class="fundamental__card-label">毛利率</div>
          <div class="fundamental__card-value">
            {{ latestProfit?.gross_margin != null ? Number(latestProfit.gross_margin).toFixed(1) + '%' : '—' }}
          </div>
        </div>
        <div class="fundamental__card">
          <div class="fundamental__card-label">營益率</div>
          <div class="fundamental__card-value">
            {{ latestProfit?.operating_margin != null ? Number(latestProfit.operating_margin).toFixed(1) + '%' : '—' }}
          </div>
        </div>
        <div class="fundamental__card">
          <div class="fundamental__card-label">淨利率</div>
          <div class="fundamental__card-value">
            {{ latestProfit?.net_margin != null ? Number(latestProfit.net_margin).toFixed(1) + '%' : '—' }}
          </div>
        </div>
        <div v-if="institutionalSummary" class="fundamental__card">
          <div class="fundamental__card-label">法人{{ institutionalSummary.days }}日累計</div>
          <div class="fundamental__card-value" :class="chgClass(institutionalSummary.total)">
            {{ numText(institutionalSummary.total) }} 張
          </div>
        </div>
      </div>

      <!-- 區段切換 -->
      <div class="fundamental__section-tabs">
        <button
          class="fundamental__section-tab"
          :class="{ 'fundamental__section-tab--active': activeSection === 'revenue' }"
          @click="activeSection = 'revenue'"
        >月營收</button>
        <button
          class="fundamental__section-tab"
          :class="{ 'fundamental__section-tab--active': activeSection === 'profitability' }"
          @click="activeSection = 'profitability'"
        >獲利能力</button>
        <button
          class="fundamental__section-tab"
          :class="{ 'fundamental__section-tab--active': activeSection === 'institutional' }"
          @click="activeSection = 'institutional'"
        >法人動向</button>
      </div>

      <!-- 月營收 -->
      <div v-if="activeSection === 'revenue'" class="fundamental__panel">
        <!-- 迷你柱狀圖 -->
        <div v-if="revenueChartData.length" class="fundamental__rev-chart">
          <div
            v-for="(r, idx) in revenueChartData"
            :key="idx"
            class="fundamental__rev-bar-wrap"
          >
            <div
              class="fundamental__rev-bar"
              :class="chgClass(r.yoy)"
              :style="{ height: (r.revenue / revenueMax * 100) + '%' }"
              :title="`${r.date}\n營收: ${numText(r.revenue)} 千元\nYoY: ${chgText(r.yoy)}`"
            />
            <span class="fundamental__rev-label">{{ r.date?.slice(5, 7) || '' }}</span>
          </div>
        </div>

        <!-- 營收表格 -->
        <div class="fundamental__table-wrap">
          <table class="fundamental__table">
            <thead>
              <tr>
                <th>月份</th>
                <th>營收（千元）</th>
                <th>MoM</th>
                <th>YoY</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in [...(data.revenue || [])].reverse()" :key="r.date">
                <td>{{ r.date }}</td>
                <td class="fundamental__num">{{ numText(r.revenue) }}</td>
                <td class="fundamental__chg" :class="chgClass(r.mom)">{{ chgText(r.mom) }}</td>
                <td class="fundamental__chg" :class="chgClass(r.yoy)">{{ chgText(r.yoy) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 獲利能力 -->
      <div v-if="activeSection === 'profitability'" class="fundamental__panel">
        <div class="fundamental__table-wrap">
          <table class="fundamental__table">
            <thead>
              <tr>
                <th>期間</th>
                <th>ROE</th>
                <th>毛利率</th>
                <th>營益率</th>
                <th>淨利率</th>
                <th>EPS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in [...profitRows].reverse()" :key="r.date || r.period">
                <td>{{ r.date || r.period || '—' }}</td>
                <td class="fundamental__chg" :class="chgClass(r.roe as number)">
                  {{ r.roe != null ? Number(r.roe).toFixed(2) + '%' : '—' }}
                </td>
                <td>{{ r.gross_margin != null ? Number(r.gross_margin).toFixed(2) + '%' : '—' }}</td>
                <td>{{ r.operating_margin != null ? Number(r.operating_margin).toFixed(2) + '%' : '—' }}</td>
                <td>{{ r.net_margin != null ? Number(r.net_margin).toFixed(2) + '%' : '—' }}</td>
                <td class="fundamental__num">{{ r.eps != null ? Number(r.eps).toFixed(2) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 法人動向 -->
      <div v-if="activeSection === 'institutional'" class="fundamental__panel">
        <!-- 法人累計摘要 -->
        <div v-if="institutionalSummary" class="fundamental__inst-summary">
          <div class="fundamental__inst-card">
            <span class="fundamental__inst-label">外資</span>
            <span class="fundamental__inst-value" :class="chgClass(institutionalSummary.foreign)">
              {{ numText(institutionalSummary.foreign) }}
            </span>
          </div>
          <div class="fundamental__inst-card">
            <span class="fundamental__inst-label">投信</span>
            <span class="fundamental__inst-value" :class="chgClass(institutionalSummary.trust)">
              {{ numText(institutionalSummary.trust) }}
            </span>
          </div>
          <div class="fundamental__inst-card">
            <span class="fundamental__inst-label">自營</span>
            <span class="fundamental__inst-value" :class="chgClass(institutionalSummary.dealer)">
              {{ numText(institutionalSummary.dealer) }}
            </span>
          </div>
        </div>

        <!-- 法人明細表 -->
        <div class="fundamental__table-wrap">
          <table class="fundamental__table">
            <thead>
              <tr>
                <th>日期</th>
                <th>外資</th>
                <th>投信</th>
                <th>自營</th>
                <th>合計</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in [...(data.institutional || [])].reverse()" :key="r.date">
                <td>{{ r.date }}</td>
                <td class="fundamental__chg" :class="chgClass(r.foreign_net)">{{ numText(r.foreign_net) }}</td>
                <td class="fundamental__chg" :class="chgClass(r.trust_net)">{{ numText(r.trust_net) }}</td>
                <td class="fundamental__chg" :class="chgClass(r.dealer_net)">{{ numText(r.dealer_net) }}</td>
                <td class="fundamental__chg fundamental__chg--bold" :class="chgClass(r.total_net)">{{ numText(r.total_net) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.fundamental {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  // ── 搜尋列 ──────────────────────────────────────────
  &__search {
    padding: 14px 20px 10px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__search-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__input {
    width: 160px;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;

    &:focus {
      border-color: var(--color-accent);
    }
  }

  &__source-toggle {
    display: flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  &__source-btn {
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 600;
    border: none;
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;

    &:not(:last-child) {
      border-right: 1px solid var(--color-border);
    }

    &--active {
      background: var(--color-accent);
      color: #fff;
    }

    &:hover:not(&--active) {
      background: var(--color-bg-hover);
    }
  }

  &__search-btn {
    padding: 6px 16px;
    border: none;
    border-radius: var(--radius-sm);
    background: var(--color-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-size: 11px;
  }

  &__meta-source {
    padding: 1px 7px;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    font-weight: 700;
    font-size: 10px;
  }

  &__meta-stock {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  &__meta-time {
    color: var(--color-text-muted);
    font-size: 10px;
  }

  // ── Token 狀態提示 ──────────────────────────────────
  &__token {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 20px;
    font-size: 11px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    &--ok {
      background: rgba(34, 197, 94, 0.08);
      .fundamental__token-icon { color: #22c55e; }
      .fundamental__token-msg { color: #22c55e; }
    }

    &--warning {
      background: rgba(245, 158, 11, 0.1);
      .fundamental__token-icon { color: #f59e0b; }
      .fundamental__token-msg { color: #f59e0b; font-weight: 700; }
    }

    &--expired {
      background: rgba(239, 68, 68, 0.1);
      .fundamental__token-icon { color: var(--color-down); }
      .fundamental__token-msg { color: var(--color-down); font-weight: 700; }
    }

    &-icon {
      font-size: 14px;
      font-weight: 800;
      flex-shrink: 0;
    }

    &-msg {
      font-weight: 600;
    }

    &-link {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-accent);
      text-decoration: none;
      padding: 2px 8px;
      border: 1px solid var(--color-accent);
      border-radius: var(--radius-sm);
      transition: all 0.15s;

      &:hover {
        background: var(--color-accent);
        color: #fff;
      }
    }

    &-exp,
    &-saved {
      color: var(--color-text-muted);
      font-size: 10px;

      &::before {
        content: '|';
        margin-right: 8px;
        opacity: 0.3;
      }
    }
  }

  // ── 狀態 ────────────────────────────────────────────
  &__error {
    padding: 12px 20px;
    font-size: 12px;
    color: var(--color-down);
  }

  &__loading {
    padding: 24px 20px;
    font-size: 13px;
    color: var(--color-text-muted);
    text-align: center;
  }

  // ── 摘要卡片 ────────────────────────────────────────
  &__summary {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__card {
    flex: 1;
    padding: 12px 16px;
    border-right: 1px solid var(--color-border);
    text-align: center;

    &:last-child { border-right: none; }

    &-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 4px;
    }

    &-value {
      font-size: 16px;
      font-weight: 800;
      color: var(--color-text-primary);
      font-variant-numeric: tabular-nums;

      &.up { color: var(--color-up); }
      &.down { color: var(--color-down); }
    }
  }

  // ── 區段 Tab ────────────────────────────────────────
  &__section-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__section-tab {
    flex: 1;
    padding: 8px 0;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-bg-hover);
    }

    &--active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
    }
  }

  // ── Panel ───────────────────────────────────────────
  &__panel {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  // ── 營收柱狀圖 ──────────────────────────────────────
  &__rev-chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    padding: 16px 20px 8px;
    height: 120px;
    flex-shrink: 0;
  }

  &__rev-bar-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  &__rev-bar {
    width: 100%;
    max-width: 32px;
    border-radius: 3px 3px 0 0;
    background: var(--color-accent);
    opacity: 0.7;
    transition: height 0.3s, opacity 0.15s;
    min-height: 2px;
    cursor: default;

    &.up { background: var(--color-up); opacity: 0.8; }
    &.down { background: var(--color-down); opacity: 0.8; }

    &:hover { opacity: 1; }
  }

  &__rev-label {
    font-size: 9px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  // ── 表格 ────────────────────────────────────────────
  &__table-wrap {
    flex: 1;
    overflow-y: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;

    th {
      text-align: left;
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-bg-primary);
      z-index: 1;
    }

    td {
      padding: 5px 12px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    tbody tr:hover {
      background: var(--color-bg-hover);
    }
  }

  &__num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  &__chg {
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums;

    &.up { color: var(--color-up); }
    &.down { color: var(--color-down); }
    &--bold { font-weight: 800; }
  }

  // ── 法人摘要 ────────────────────────────────────────
  &__inst-summary {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__inst-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 12px;
    border-right: 1px solid var(--color-border);

    &:last-child { border-right: none; }
  }

  &__inst-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }

  &__inst-value {
    font-size: 14px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);

    &.up { color: var(--color-up); }
    &.down { color: var(--color-down); }
  }
}
</style>
