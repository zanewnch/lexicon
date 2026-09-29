<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import TabBar from '@/components/ui/TabBar.vue'
import { useTradingData } from '@/features/trade/composables/useTradingData'
import { EXIT_REASON_LABELS, SIDE_LABELS } from '@/types/trading'
import { useMarketStore } from '@/store/market'

const stages = [
  { key: 'scanner',    label: '① Scanner 選股' },
  { key: 'trader',     label: '② Trader 進場' },
  { key: 'watchdog',   label: '③ Watchdog 監控' },
  { key: 'exiter',     label: '④ Exiter 出場' },
  { key: 'bookkeeper', label: '⑤ Bookkeeper 復盤' },
] as const

type StageKey = typeof stages[number]['key']
const active = ref<StageKey>('scanner')

const trading = useTradingData()
const market = useMarketStore()
const selectedVenue = trading.venue

// --- Scanner inputs ---
const scannerSymbols = ref('2330, 2317, 0050')
const scannerBusy = ref(false)
const scannerMsg = ref('')

async function execScanner() {
  scannerBusy.value = true
  scannerMsg.value = ''
  try {
    const symbols = scannerSymbols.value
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (symbols.length === 0) {
      scannerMsg.value = '請輸入至少一個股票代碼'
      return
    }
    const res = await trading.runScanner(symbols)
    scannerMsg.value = `已建立 ${res.data.created} 筆候選`
    await trading.refreshAll()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    scannerMsg.value = err.response?.data?.error || '掃描失敗'
  } finally {
    scannerBusy.value = false
  }
}

// --- Trader inputs ---
const traderCapital = ref(600000)
const traderPricesText = ref('2330=600\n2317=200\n0050=150')
const traderLive = ref(false)
const traderPin = ref('')
const traderBusy = ref(false)
const traderMsg = ref('')

function parsePrices(text: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const line of text.split(/[\n;,]/)) {
    const m = line.match(/^\s*([A-Za-z0-9]+)\s*[=:]\s*([\d.]+)\s*$/)
    if (m) out[m[1]!] = Number(m[2])
  }
  return out
}

async function execTrader() {
  if (traderLive.value && !traderPin.value) {
    traderMsg.value = '實單模式需要交易密碼'
    return
  }
  await market.fetchMode()
  const expectedVenue = market.isSimulation ? 'broker_simulation' : 'broker_production'
  if (traderLive.value && !confirm(
    market.isSimulation ? '將送出券商模擬買進委託，確定？' : '將送出真實買進委託，確定？',
  )) return

  traderBusy.value = true
  traderMsg.value = ''
  try {
    const prices = parsePrices(traderPricesText.value)
    const res = await trading.runTrader(traderCapital.value, prices, traderLive.value, traderPin.value, expectedVenue)
    trading.venue.value = traderLive.value ? expectedVenue : 'paper'
    traderMsg.value = `[${res.data.mode}] 送出 ${res.data.orders} 筆，已成交持倉 ${res.data.positions} 個，跳過 ${res.data.skipped.length} 筆`
    await trading.refreshAll()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    traderMsg.value = err.response?.data?.error || '進場失敗'
  } finally {
    traderBusy.value = false
  }
}

// --- Watchdog inputs ---
const watchSL = ref(-5)
const watchTP = ref(10)
const watchPricesText = ref('')
const watchUseLive = ref(true)
const watchBusy = ref(false)
const watchMsg = ref('')

async function execWatchdog() {
  watchBusy.value = true
  watchMsg.value = ''
  try {
    const opts: {
      prices?: Record<string, number>
      stopLossPct: number
      takeProfitPct: number
    } = {
      stopLossPct: watchSL.value,
      takeProfitPct: watchTP.value,
    }
    if (!watchUseLive.value) {
      opts.prices = parsePrices(watchPricesText.value)
    }
    const res = await trading.runWatchdog(opts)
    watchMsg.value = `產生 ${res.data.created} 個出場訊號（價源：${res.data.pricesSource}）`
    await trading.refreshAll()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    watchMsg.value = err.response?.data?.error || '檢查失敗'
  } finally {
    watchBusy.value = false
  }
}

// --- Exiter ---
const exiterLive = ref(false)
const exiterPin = ref('')
const exiterBusy = ref(false)
const exiterMsg = ref('')

async function execExiter() {
  if (exiterLive.value && !exiterPin.value) {
    exiterMsg.value = '實單模式需要交易密碼'
    return
  }
  await market.fetchMode()
  const expectedVenue = market.isSimulation ? 'broker_simulation' : 'broker_production'
  if (exiterLive.value && !confirm(
    market.isSimulation ? '將送出券商模擬賣出委託，確定？' : '將送出真實賣出委託，確定？',
  )) return

  exiterBusy.value = true
  exiterMsg.value = ''
  try {
    const res = await trading.runExiter(exiterLive.value, exiterPin.value, expectedVenue)
    trading.venue.value = exiterLive.value ? expectedVenue : 'paper'
    exiterMsg.value = `[${res.data.mode}] 已平倉 ${res.data.closed} 個，等待券商成交 ${res.data.submitted} 筆（跳過 ${res.data.skipped.length} 筆）`
    await trading.refreshAll()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    exiterMsg.value = err.response?.data?.error || '出場失敗'
  } finally {
    exiterBusy.value = false
  }
}

function fmtNum(n: number | null, digits = 2) {
  if (n == null) return '—'
  return n.toLocaleString('en', { maximumFractionDigits: digits })
}

function fmtTs(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-TW', { hour12: false })
}

onMounted(() => trading.refreshAll())
</script>

<template>
  <div class="trading">
    <PageHeader
      title="交易 Pipeline"
      subtitle="Scanner → Trader → Watchdog → Exiter → Bookkeeper"
      padding="16px 20px"
      mb="0"
      border="1px solid var(--color-border)"
      title-size="20px"
      align="center"
    >
      <template #actions>
        <select v-model="selectedVenue" class="form-input" @change="trading.refreshAll">
          <option value="paper">紙上交易</option>
          <option value="broker_simulation">券商模擬</option>
          <option value="broker_production">正式交易</option>
        </select>
        <button class="trading__refresh" :disabled="trading.loading.value" @click="trading.refreshAll">
          {{ trading.loading.value ? '刷新中…' : '⟳ 全部刷新' }}
        </button>
      </template>
    </PageHeader>

    <TabBar
      :tabs="[...stages]"
      v-model="active"
      gap="2px"
      padding="0 20px"
      tab-padding="10px 14px"
      font-size="13px"
    />

    <main class="trading__body">
      <!-- ① Scanner -->
      <section v-if="active === 'scanner'" class="stage">
        <div class="stage__panel">
          <h2 class="stage__title">執行掃描</h2>
          <label class="stage__label">股票代碼（以逗號或空白分隔）</label>
          <textarea v-model="scannerSymbols" class="form-textarea" rows="2" />
          <div class="stage__actions">
            <button class="stage__btn stage__btn--primary" :disabled="scannerBusy" @click="execScanner">
              {{ scannerBusy ? '執行中…' : '執行掃描' }}
            </button>
            <span v-if="scannerMsg" class="stage__msg">{{ scannerMsg }}</span>
          </div>
        </div>

        <div class="stage__panel">
          <h2 class="stage__title">候選清單（{{ trading.candidates.value.length }}）</h2>
          <table class="stage__table">
            <thead>
              <tr><th>代碼</th><th>分數</th><th>已採用</th><th>建立時間</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in trading.candidates.value" :key="c.id">
                <td><strong>{{ c.symbol }}</strong></td>
                <td class="stage__num">{{ fmtNum(c.score) }}</td>
                <td>{{ c.consumed ? '✓' : '—' }}</td>
                <td class="stage__ts">{{ fmtTs(c.createdAt) }}</td>
              </tr>
              <tr v-if="trading.candidates.value.length === 0"><td colspan="4" class="stage__empty">尚無候選</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ② Trader -->
      <section v-if="active === 'trader'" class="stage">
        <div class="stage__panel">
          <h2 class="stage__title">執行進場（等權重市價買進）</h2>
          <label class="stage__label">資金（NT$）</label>
          <input v-model.number="traderCapital" type="number" class="form-input" />
          <label class="stage__label">價格表（每行一檔，格式：代碼=價格）</label>
          <textarea v-model="traderPricesText" class="form-textarea" rows="4" />
          <label class="stage__label stage__label--inline">
            <input v-model="traderLive" type="checkbox" />
            {{ market.isSimulation ? '券商模擬委託' : '正式委託（真實交易）' }}
          </label>
          <template v-if="traderLive">
            <label class="stage__label">交易密碼</label>
            <input v-model="traderPin" type="password" class="form-input" />
          </template>
          <div class="stage__actions">
            <button class="stage__btn" :class="traderLive ? 'stage__btn--danger' : 'stage__btn--primary'" :disabled="traderBusy" @click="execTrader">
              {{ traderBusy ? '執行中…' : (traderLive ? (market.isSimulation ? '執行券商模擬進場' : '⚠ 執行正式進場') : '執行進場（紙上）') }}
            </button>
            <span v-if="traderMsg" class="stage__msg">{{ traderMsg }}</span>
          </div>
        </div>

        <div class="stage__panel">
          <h2 class="stage__title">當前持倉（{{ trading.positions.value.length }}）</h2>
          <table class="stage__table">
            <thead>
              <tr><th>代碼</th><th>股數</th><th>均價</th><th>狀態</th><th>進場時間</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in trading.positions.value" :key="p.id">
                <td><strong>{{ p.symbol }}</strong></td>
                <td class="stage__num">{{ fmtNum(p.qty, 0) }}</td>
                <td class="stage__num">{{ fmtNum(p.avgCost) }}</td>
                <td>{{ p.status === 'open' ? '持有中' : '已平倉' }}</td>
                <td class="stage__ts">{{ fmtTs(p.openedAt) }}</td>
              </tr>
              <tr v-if="trading.positions.value.length === 0"><td colspan="5" class="stage__empty">尚無持倉</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ③ Watchdog -->
      <section v-if="active === 'watchdog'" class="stage">
        <div class="stage__panel">
          <h2 class="stage__title">檢查持倉（停損/停利監控）</h2>
          <div class="stage__grid">
            <div class="stage__field">
              <label class="stage__label">停損 (%)</label>
              <input v-model.number="watchSL" type="number" class="form-input" />
            </div>
            <div class="stage__field">
              <label class="stage__label">停利 (%)</label>
              <input v-model.number="watchTP" type="number" class="form-input" />
            </div>
          </div>
          <p class="stage__desc">目前檢查：{{ selectedVenue === 'paper' ? '紙上交易' : selectedVenue === 'broker_simulation' ? '券商模擬' : '正式交易' }}持倉</p>
          <label class="stage__label stage__label--inline">
            <input v-model="watchUseLive" type="checkbox" />
            使用即時報價（QuoteService）
          </label>
          <textarea
            v-if="!watchUseLive"
            v-model="watchPricesText"
            class="form-textarea"
            rows="3"
            placeholder="2330=560, 0050=170"
          />
          <div class="stage__actions">
            <button class="stage__btn stage__btn--primary" :disabled="watchBusy" @click="execWatchdog">
              {{ watchBusy ? '檢查中…' : '檢查持倉' }}
            </button>
            <span v-if="watchMsg" class="stage__msg">{{ watchMsg }}</span>
          </div>
        </div>

        <div class="stage__panel">
          <h2 class="stage__title">待處理出場訊號（{{ trading.signals.value.length }}）</h2>
          <table class="stage__table">
            <thead>
              <tr><th>代碼</th><th>原因</th><th>觸發價</th><th>時間</th><th>備註</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in trading.signals.value" :key="s.id">
                <td><strong>{{ s.symbol }}</strong></td>
                <td>
                  <span class="badge" :class="s.reason === 'stop_loss' ? 'badge--down' : 'badge--up'">
                    {{ EXIT_REASON_LABELS[s.reason] }}
                  </span>
                </td>
                <td class="stage__num">{{ fmtNum(s.triggeredPrice) }}</td>
                <td class="stage__ts">{{ fmtTs(s.triggeredAt) }}</td>
                <td class="stage__note">{{ s.note || '—' }}</td>
              </tr>
              <tr v-if="trading.signals.value.length === 0"><td colspan="5" class="stage__empty">無待處理訊號</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ④ Exiter -->
      <section v-if="active === 'exiter'" class="stage">
        <div class="stage__panel">
          <h2 class="stage__title">執行出場（一次清倉）</h2>
          <p class="stage__desc">處理所有 Watchdog 發出的待處理訊號，市價賣出對應持倉。</p>
          <label class="stage__label stage__label--inline">
            <input v-model="exiterLive" type="checkbox" />
            {{ market.isSimulation ? '券商模擬委託' : '正式委託（真實交易）' }}
          </label>
          <template v-if="exiterLive">
            <label class="stage__label">交易密碼</label>
            <input v-model="exiterPin" type="password" class="form-input" />
          </template>
          <div class="stage__actions">
            <button class="stage__btn" :class="exiterLive ? 'stage__btn--danger' : 'stage__btn--primary'" :disabled="exiterBusy" @click="execExiter">
              {{ exiterBusy ? '執行中…' : (exiterLive ? (market.isSimulation ? '執行券商模擬出場' : '⚠ 執行正式出場') : '執行出場（紙上）') }}
            </button>
            <span v-if="exiterMsg" class="stage__msg">{{ exiterMsg }}</span>
          </div>
        </div>

        <div class="stage__panel">
          <h2 class="stage__title">待處理訊號（{{ trading.signals.value.length }}）</h2>
          <table class="stage__table">
            <thead>
              <tr><th>代碼</th><th>原因</th><th>觸發價</th><th>時間</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in trading.signals.value" :key="s.id">
                <td><strong>{{ s.symbol }}</strong></td>
                <td>{{ EXIT_REASON_LABELS[s.reason] }}</td>
                <td class="stage__num">{{ fmtNum(s.triggeredPrice) }}</td>
                <td class="stage__ts">{{ fmtTs(s.triggeredAt) }}</td>
              </tr>
              <tr v-if="trading.signals.value.length === 0"><td colspan="4" class="stage__empty">無待處理訊號</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ⑤ Bookkeeper -->
      <section v-if="active === 'bookkeeper'" class="stage">
        <div class="stage__panel">
          <h2 class="stage__title">績效報表</h2>
          <div v-if="trading.report.value" class="stage__stats">
            <div class="stage__stat">
              <div class="stage__stat-label">總損益</div>
              <div class="stage__stat-value" :class="(trading.report.value.totalPnl ?? 0) >= 0 ? 'text-up' : 'text-down'">
                {{ fmtNum(trading.report.value.totalPnl) }}
              </div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">勝率</div>
              <div class="stage__stat-value">{{ fmtNum(trading.report.value.winRate) }}%</div>
              <div class="stage__stat-sub">{{ trading.report.value.wins }}W / {{ trading.report.value.losses }}L</div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">期望值</div>
              <div class="stage__stat-value" :class="(trading.report.value.expectancy ?? 0) >= 0 ? 'text-up' : 'text-down'">
                {{ fmtNum(trading.report.value.expectancy) }}
              </div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">獲利因子</div>
              <div class="stage__stat-value">{{ fmtNum(trading.report.value.profitFactor) }}</div>
              <div class="stage__stat-sub">profit / loss</div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">Sharpe</div>
              <div class="stage__stat-value">{{ fmtNum(trading.report.value.sharpe, 2) }}</div>
              <div class="stage__stat-sub">年化</div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">Sortino</div>
              <div class="stage__stat-value">{{ fmtNum(trading.report.value.sortino, 2) }}</div>
              <div class="stage__stat-sub">下行波動</div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">最大回撤</div>
              <div class="stage__stat-value text-down">{{ fmtNum(trading.report.value.maxDrawdown) }}</div>
              <div class="stage__stat-sub">{{ fmtNum(trading.report.value.maxDrawdownPct) }}%</div>
            </div>
            <div class="stage__stat">
              <div class="stage__stat-label">Calmar</div>
              <div class="stage__stat-value">{{ fmtNum(trading.report.value.calmar, 2) }}</div>
              <div class="stage__stat-sub">return / max DD</div>
            </div>
          </div>
        </div>

        <div class="stage__panel">
          <h2 class="stage__title">成交明細（{{ trading.trades.value.length }}）</h2>
          <table class="stage__table">
            <thead>
              <tr><th>代碼</th><th>方向</th><th>股數</th><th>價格</th><th>損益</th><th>時間</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in trading.trades.value" :key="t.id">
                <td><strong>{{ t.symbol }}</strong></td>
                <td>
                  <span class="badge" :class="t.side === 'buy' ? 'badge--up' : 'badge--down'">
                    {{ SIDE_LABELS[t.side] }}
                  </span>
                </td>
                <td class="stage__num">{{ fmtNum(t.qty, 0) }}</td>
                <td class="stage__num">{{ fmtNum(t.price) }}</td>
                <td class="stage__num" :class="t.pnl == null ? '' : (t.pnl >= 0 ? 'text-up' : 'text-down')">
                  {{ fmtNum(t.pnl) }}
                </td>
                <td class="stage__ts">{{ fmtTs(t.executedAt) }}</td>
              </tr>
              <tr v-if="trading.trades.value.length === 0"><td colspan="6" class="stage__empty">尚無成交</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.trading {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg-primary);

  &__refresh {
    padding: 6px 14px;
    font-size: 13px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
    &:disabled { opacity: 0.5; cursor: wait; }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
}

.stage {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px 20px;
  }

  &__title {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__desc {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  &__label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 8px 0 4px;

    &--inline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-transform: none;
      letter-spacing: normal;
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }
  }

  .form-input,
  .form-textarea {
    font-family: 'Fira Code', monospace;
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  &__field { display: flex; flex-direction: column; }

  &__actions {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__btn {
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.15s;

    &--primary {
      background: var(--color-accent);
      color: #fff;
      &:hover:not(:disabled) { opacity: 0.9; }
      &:disabled { opacity: 0.5; cursor: wait; }
    }

    &--danger {
      background: var(--color-down);
      color: #fff;
      &:hover:not(:disabled) { opacity: 0.9; }
      &:disabled { opacity: 0.5; cursor: wait; }
    }
  }

  &__msg {
    font-size: 12px;
    color: var(--color-text-muted);
  }

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
      white-space: nowrap;
    }

    td {
      padding: 8px;
      border-bottom: 1px solid var(--color-border);
    }
  }

  &__num {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }

  &__ts {
    font-size: 12px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__note {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  &__empty {
    text-align: center;
    padding: 24px;
    color: var(--color-text-muted);
    font-size: 13px;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  &__stat {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
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
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  &__stat-sub {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
}

.text-up { color: var(--color-up); }
.text-down { color: var(--color-down); }

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 3px;

  &--up { background: rgba(34, 197, 94, 0.15); color: var(--color-up); }
  &--down { background: rgba(239, 68, 68, 0.1); color: var(--color-down); }
}
</style>
