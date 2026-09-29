<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue'
import { Zap, ChevronDown, ChevronUp } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import SimulationBanner from '@/components/layout/SimulationBanner.vue'
import { useTradeData } from '@/features/trade/composables/useTradeData'
import { useFlashHighlight } from '@/features/trade/composables/useFlashHighlight'
import { useTradingData } from '@/features/trade/composables/useTradingData'
import { listPendingCandidates } from '@/api/pipeline'
import { useToast } from '@/composables/useToast'
import api from '@/api'
import type { WatchlistQuote } from '@/features/trade/composables/useWatchdogMonitor'
import { useMarketStore } from '@/store/market'

import TradeOrderForm from '@/features/trade/components/TradeOrderForm.vue'
import TradeOrderBook from '@/features/trade/components/TradeOrderBook.vue'
import TradeOrderHistory from '@/features/trade/components/TradeOrderHistory.vue'

interface PendingCandidate {
  id: number
  symbol: string
  meta: Record<string, unknown>
}

const { quote, orderBook, orderBookSource, orders, account, isDummy, orderLoading, cancelLoading, orderResult, fetchData, placeOrder, cancelOrder } = useTradeData()
const { runTrader } = useTradingData()
const toast = useToast()
const market = useMarketStore()

const { flashClass: priceFlash } = useFlashHighlight(toRef(() => quote.value.price))

const orderFormRef = ref<InstanceType<typeof TradeOrderForm> | null>(null)

// ---- Pipeline candidates ----
const pendingCandidates = ref<PendingCandidate[]>([])
const activeSymbol = ref<string | null>(null)

async function refreshPending() {
  try {
    const { candidates } = await listPendingCandidates()
    pendingCandidates.value = candidates
  } catch {
    pendingCandidates.value = []
  }
}

async function selectCandidate(symbol: string) {
  activeSymbol.value = symbol
  await fetchData(symbol)
  orderFormRef.value?.syncPrice(quote.value.price)
}

// ---- Batch trader panel ----
const showBatchPanel = ref(false)
const batchCapital = ref<number>(600000)
const batchPrices = ref<Record<string, number>>({})
const selectedCandidateIds = ref<number[]>([])
const batchLive = ref(false)
const batchPin = ref('')
const batchBusy = ref(false)

async function openBatchPanel() {
  showBatchPanel.value = true
  selectedCandidateIds.value = pendingCandidates.value.map((candidate) => candidate.id)
  if (!pendingCandidates.value.length) return
  // 預抓候選現價
  try {
    const codes = pendingCandidates.value.map((c) => c.symbol).join(',')
    const { data } = await api.get<WatchlistQuote[]>('/watchlist/', { params: { codes } })
    const next: Record<string, number> = {}
    for (const q of data) next[q.code] = q.price
    batchPrices.value = next
  } catch {
    toast.error('取得候選現價失敗，請手動輸入')
  }
}

function closeBatchPanel() {
  showBatchPanel.value = false
}

async function executeBatch() {
  if (batchCapital.value <= 0) {
    toast.warning('請輸入大於 0 的資金')
    return
  }
  if (batchLive.value && !batchPin.value) {
    toast.warning('Live 模式需輸入 Trade PIN')
    return
  }
  if (!selectedCandidateIds.value.length) {
    toast.warning('請至少選擇一筆候選')
    return
  }
  await market.fetchMode()
  const expectedVenue = market.isSimulation ? 'broker_simulation' : 'broker_production'
  if (batchLive.value && !confirm(
    market.isSimulation ? '將送出券商模擬買進委託，確定？' : '將送出真實買進委託，確定？',
  )) return

  batchBusy.value = true
  try {
    const res = await runTrader(batchCapital.value, batchPrices.value, batchLive.value, batchPin.value, expectedVenue, selectedCandidateIds.value)
    const r = res.data as { mode: string; orders: number; positions: number; skipped: { symbol: string; reason: string }[] }
    const skippedNote = r.skipped.length ? `（跳過 ${r.skipped.length} 筆）` : ''
    toast.success(`[${r.mode}] 下單 ${r.orders} 筆，建立 ${r.positions} 個持倉${skippedNote}`)
    await refreshPending()
    showBatchPanel.value = false
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    toast.error(err.response?.data?.error || '批次下單失敗')
  } finally {
    batchBusy.value = false
  }
}

onMounted(async () => {
  await refreshPending()
  const first = pendingCandidates.value[0]
  if (first) {
    activeSymbol.value = first.symbol
    await fetchData(first.symbol)
    orderFormRef.value?.syncPrice(quote.value.price)
    toast.info(`Pipeline 已帶入 ${pendingCandidates.value.length} 檔候選，目前顯示 ${first.symbol}`)
  } else {
    await fetchData('2330')
  }
})

// ---- Single-stock form handlers ----
async function onChangeStock(code: string) {
  await fetchData(code)
  orderFormRef.value?.syncPrice(quote.value.price)
}

async function onPlaceOrder(payload: {
  code: string
  side: 'buy' | 'sell'
  price: number
  shares: number
  type: 'limit' | 'market'
  trade_pin: string
}) {
  await placeOrder(payload)
}

async function onCancelOrder(payload: { orderId: string; tradePin: string }) {
  await market.fetchMode()
  if (!confirm(market.isSimulation ? '確定取消這筆券商模擬委託？' : '確定取消這筆正式交易委託？')) return
  await cancelOrder(payload.orderId, payload.tradePin)
}

function onClearResult() {
  orderResult.value = null
}

function onSelectPrice(price: number) {
  orderFormRef.value?.setPrice(price)
}

const hasPending = computed(() => pendingCandidates.value.length > 0)
</script>

<template>
  <div class="trade">
    <PageHeader title="下單 · Trader" />

    <SimulationBanner message="目前為模擬模式，帳戶餘額與部分交易資訊無法顯示。下單功能仍可正常使用。" />

    <!-- Pipeline 候選區 -->
    <div v-if="hasPending" class="trade__pipeline">
      <div class="trade__pipeline-head">
        <div class="trade__pipeline-title">
          <Zap :size="16" color="#f59e0b" />
          Pipeline 候選
          <span class="trade__pipeline-count">{{ pendingCandidates.length }}</span>
        </div>
        <button class="btn btn--primary" @click="showBatchPanel ? closeBatchPanel() : openBatchPanel()">
          批次下單（等權分配）
          <component :is="showBatchPanel ? ChevronUp : ChevronDown" :size="14" />
        </button>
      </div>
      <div class="trade__pipeline-chips">
        <button
          v-for="c in pendingCandidates"
          :key="c.id"
          class="trade__chip"
          :class="{ 'trade__chip--active': activeSymbol === c.symbol }"
          @click="selectCandidate(c.symbol)"
        >
          {{ c.symbol }}
        </button>
      </div>

      <!-- Batch panel -->
      <div v-if="showBatchPanel" class="trade__batch">
        <div class="trade__batch-row">
          <label class="trade__field">
            <span>總資金（NT$）</span>
            <input v-model.number="batchCapital" type="number" min="1000" step="10000" />
          </label>
        </div>

        <div class="trade__batch-prices">
          <div class="trade__batch-subtitle">候選現價（已預抓，可手動調整）</div>
          <div class="trade__batch-grid">
            <div v-for="c in pendingCandidates" :key="c.id" class="trade__candidate-row">
              <label class="trade__field trade__field--inline">
                <input v-model="selectedCandidateIds" type="checkbox" :value="c.id" />
                <span>{{ c.symbol }}</span>
              </label>
              <input v-model.number="batchPrices[c.symbol]" type="number" step="0.05" min="0" />
            </div>
          </div>
        </div>

        <div class="trade__batch-row">
          <label class="trade__field trade__field--inline">
            <input v-model="batchLive" type="checkbox" />
            <span>{{ market.isSimulation ? '券商模擬委託' : '正式券商委託' }}</span>
          </label>
          <label v-if="batchLive" class="trade__field">
            <span>Trade PIN</span>
            <input v-model="batchPin" type="password" />
          </label>
        </div>

        <div class="trade__batch-actions">
          <button class="btn btn--ghost" :disabled="batchBusy" @click="closeBatchPanel">取消</button>
          <button
            class="btn"
            :class="batchLive ? 'btn--danger' : 'btn--primary'"
            :disabled="batchBusy"
            @click="executeBatch"
          >
            {{ batchBusy ? '執行中…' : (batchLive ? (market.isSimulation ? '執行券商模擬委託' : '⚠ 執行正式批次下單') : '執行批次下單（紙上）') }}
          </button>
        </div>
      </div>
    </div>

    <div class="trade__layout">
      <!-- Left: 下單表單 -->
      <div class="trade__left">
        <TradeOrderForm
          ref="orderFormRef"
          :quote="quote"
          :account="account"
          :is-dummy="isDummy"
          :order-loading="orderLoading"
          :order-result="orderResult"
          :price-flash="priceFlash"
          @change-stock="onChangeStock"
          @place-order="onPlaceOrder"
          @clear-result="onClearResult"
        />
      </div>

      <!-- Right: 五檔 + 委託列表 -->
      <div class="trade__right">
        <TradeOrderBook
          :order-book="orderBook"
          :source="orderBookSource"
          :is-dummy="isDummy"
          @select-price="onSelectPrice"
        />

        <TradeOrderHistory
          :orders="orders"
          :is-dummy="isDummy"
          :cancel-loading="cancelLoading"
          @cancel-order="onCancelOrder"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.trade {
  &__layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--gap-lg);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }

  &__left,
  &__right {
    display: flex;
    flex-direction: column;
    gap: var(--gap-lg);
  }

  &__pipeline {
    padding: var(--gap-md) var(--gap-lg);
    margin-bottom: var(--gap-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-secondary);
  }

  &__pipeline-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
    margin-bottom: var(--gap-sm);
  }

  &__pipeline-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-md);
    font-weight: 600;
  }

  &__pipeline-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 7px;
    border-radius: 10px;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    font-size: 11px;
    font-weight: 700;
  }

  &__pipeline-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    padding: 4px 10px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 13px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--color-bg-hover);
    }

    &--active {
      background: var(--color-accent-soft, rgba(59, 130, 246, 0.15));
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
  }

  &__batch {
    margin-top: var(--gap-md);
    padding-top: var(--gap-md);
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  &__batch-row {
    display: flex;
    gap: var(--gap-lg);
    align-items: flex-end;
    flex-wrap: wrap;
  }

  &__batch-subtitle {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  &__batch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--gap-sm);
  }

  &__candidate-row {
    display: flex;
    flex-direction: column;
    gap: 6px;

    > input {
      width: 100%;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
    }
  }

  &__batch-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--gap-sm);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 120px;

    span {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    input {
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
    }

    &--inline {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      min-width: unset;

      input {
        width: auto;
      }
      span {
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
      }
    }
  }
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .trade {
    &__layout { gap: var(--gap-md); }
    &__left, &__right { gap: var(--gap-md); }
  }

  .card {
    padding: var(--gap-md);
  }
}

// ---- Responsive: 480px ----
@media (max-width: 480px) {
  .trade {
    &__title { font-size: var(--font-size-lg); }
    &__layout { gap: var(--gap-sm); }
  }

  .card {
    padding: var(--gap-sm);
  }
}
</style>
