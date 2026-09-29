import { ref, onUnmounted } from 'vue'
import api from '@/api'
import { createReconnect } from '@/composables/useReconnect'
import { useToast } from '@/composables/useToast'
import type { TradeQuote, TradeOrderBook, Order, AccountBalance, BrokerOrderRecord } from '@/types/account'
import type { CommandResult } from '@/types/common'
import { useMarketStore } from '@/store/market'

const WS_BASE = import.meta.env.VITE_WS_BASE ?? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`

interface BidAskMessage {
  type: string
  code: string
  askPrices?: number[]
  askVolumes?: number[]
  bidPrices?: number[]
  bidVolumes?: number[]
}

/**
 * 下單交易頁面的資料管理 composable。
 *
 * 並行載入指定股票的：
 * - 即時報價（含漲跌幅、高低收盤、漲跌停價）
 * - 委託列表（從交易紀錄轉換）
 * - 帳戶餘額和可用資金
 * - 五檔買賣報價（委託簿）
 *
 * 提供下單（`placeOrder`）功能，下單成功後自動重新載入最新資料。
 *
 * 由頁面選定股票後呼叫 `fetchData` 載入資料。
 *
 * @returns 交易頁面所需的所有狀態和操作函式
 *
 * @example
 * ```ts
 * const trade = useTradeData()
 * await trade.fetchData('2454')      // 切換到聯發科
 * const success = await trade.placeOrder({
 *   code: '2454', side: 'buy', price: 850, shares: 1000,
 *   type: 'limit', trade_pin: '123456'
 * })
 * ```
 */
export function useTradeData() {
  const toast = useToast()
  const market = useMarketStore()

  /** 目前查看的股票即時報價資訊 */
  const quote = ref<TradeQuote>({
    code: '', name: '', price: 0, change: 0, percent: 0, up: false,
    high: 0, low: 0, open: 0, prevClose: 0, volume: 0, limitUp: 0, limitDown: 0,
  })
  /** 委託單列表（從交易紀錄轉換，含狀態） */
  const orders = ref<Order[]>([])
  /** 帳戶餘額資訊（現金、可用資金、保證金） */
  const account = ref<AccountBalance>({ cashBalance: 0, buyingPower: 0, marginUsed: 0 })
  /** 五檔委託簿（asks = 賣方，bids = 買方） */
  const orderBook = ref<TradeOrderBook>({ asks: [], bids: [] })
  const orderBookSource = ref<'snapshot' | 'stream'>('snapshot')
  let snapshotBook: TradeOrderBook = { asks: [], bids: [] }
  let bookCode = ''
  let ws: WebSocket | null = null
  let fetchVersion = 0
  let disposed = false

  const reconnect = createReconnect(() => connectOrderBook(), { maxDelay: 30000 })

  function connectOrderBook() {
    if (!bookCode || disposed) return
    const code = bookCode
    const socket = new WebSocket(`${WS_BASE}/ws/market/${encodeURIComponent(code)}/`)
    ws = socket
    socket.onopen = () => reconnect.reset()
    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as BidAskMessage
        if (ws !== socket || msg.type !== 'bidask' || msg.code !== code) return
        const levels = (prices: number[] = [], volumes: number[] = []) =>
          prices.slice(0, 5).map((price, i) => ({ price, volume: volumes[i] ?? 0 }))
            .filter((level) => level.price > 0)
        orderBook.value = {
          asks: levels(msg.askPrices, msg.askVolumes),
          bids: levels(msg.bidPrices, msg.bidVolumes),
        }
        orderBookSource.value = 'stream'
      } catch {
        // Ignore malformed quote messages; retain the last valid book.
      }
    }
    socket.onclose = () => {
      if (ws !== socket) return
      ws = null
      orderBook.value = snapshotBook
      orderBookSource.value = 'snapshot'
      if (!disposed) reconnect.schedule()
    }
  }

  function selectBookCode(code: string) {
    if (bookCode === code) return
    reconnect.cancel()
    if (ws) {
      const previous = ws
      ws = null
      previous.close()
    }
    bookCode = code
    snapshotBook = { asks: [], bids: [] }
    orderBook.value = snapshotBook
    orderBookSource.value = 'snapshot'
    connectOrderBook()
  }
  /** 是否正在載入基本資料 */
  const loading = ref(false)
  /** 錯誤訊息 */
  const error = ref<string | null>(null)
  /** 是否正在執行下單 */
  const orderLoading = ref(false)
  const cancelLoading = ref(false)
  /** 最後一次下單的結果（成功 / 失敗 + 訊息） */
  const orderResult = ref<CommandResult | null>(null)

  /**
   * 載入指定股票的所有交易相關資料（報價、委託、帳務、五檔）。
   * 並行呼叫 5 個 API 以提升載入速度。
   * @param stockCode - 股票代號，預設 `'2330'`
   */
  async function fetchData(stockCode = '2330') {
    const version = ++fetchVersion
    selectBookCode(stockCode)
    loading.value = true
    error.value = null
    try {
      const [quoteRes, tradesRes, portfolioRes, bidaskRes, limitsRes] = await Promise.all([
        api.get(`/stocks/${stockCode}/`),
        api.get<BrokerOrderRecord[]>('/account/trades/'),
        api.get('/account/portfolio/'),
        api.get(`/stocks/${stockCode}/bidask/`),
        api.get(`/stocks/${stockCode}/limits/`),
      ])

      if (version !== fetchVersion) return

      const q = quoteRes.data
      const limits = limitsRes.data
      quote.value = {
        code: q.code ?? stockCode,
        name: q.name ?? '',
        price: q.close ?? q.price ?? 0,
        change: q.change ?? 0,
        percent: q.percent ?? 0,
        up: (q.change ?? 0) >= 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        open: q.open ?? 0,
        prevClose: q.prevClose ?? 0,
        volume: q.volume ?? 0,
        limitUp: limits.limitUp ?? 0,
        limitDown: limits.limitDown ?? 0,
      }

      snapshotBook = {
        asks: bidaskRes.data.asks ?? [],
        bids: bidaskRes.data.bids ?? [],
      }
      if (orderBookSource.value === 'snapshot') orderBook.value = snapshotBook

      // 保留券商委託編號，取消委託時必須精確指定同一筆委託。
      orders.value = tradesRes.data.map((t, i) => ({
        id: t.orderId || `O${String(i + 1).padStart(3, '0')}`,
        time: t.time ?? '',
        code: t.code ?? '',
        name: t.name ?? '',
        side: t.side as 'buy' | 'sell',
        type: t.orderType === '市價' ? '市價' : '限價',
        price: t.price ?? 0,
        shares: t.shares ?? 0,
        filled: t.filledShares ?? 0,
        status: t.status ?? '',
        cancelable: Boolean(t.cancelable),
      }))

      const p = portfolioRes.data
      account.value = {
        cashBalance: p.accBalance ?? 0,
        buyingPower: p.accBalance ?? 0,
        marginUsed: 0,
      }
    } catch {
      if (version === fetchVersion) error.value = '無法載入交易資料'
    } finally {
      if (version === fetchVersion) loading.value = false
    }
  }

  /**
   * 送出委託單。
   * 下單成功後會顯示成功 Toast 並重新載入最新報價和委託列表。
   * 失敗時顯示錯誤 Toast。
   *
   * @param params.code     - 股票代號
   * @param params.side     - 買 (`'buy'`) 或 賣 (`'sell'`)
   * @param params.price    - 委託價格
   * @param params.shares   - 委託股數
   * @param params.type     - 委託類型（`'limit'` 限價 / `'market'` 市價）
   * @param params.trade_pin - 交易密碼
   * @returns 下單成功回傳 `true`，失敗回傳 `false`
   */
  async function placeOrder(params: {
    code: string
    side: 'buy' | 'sell'
    price: number
    shares: number
    type: 'limit' | 'market'
    trade_pin: string
  }): Promise<boolean> {
    orderLoading.value = true
    orderResult.value = null
    try {
      await market.fetchMode()
      const expected_venue = market.isSimulation ? 'broker_simulation' : 'broker_production'
      const { data } = await api.post('/account/order/', { ...params, expected_venue })
      orderResult.value = { success: true, message: data.message ?? '委託已送出' }
      toast.success(data.message ?? '委託已送出')
      // 重新拉取委託列表
      await fetchData(params.code)
      return true
    } catch (e: any) {
      const msg = e.response?.data?.error ?? '下單失敗'
      orderResult.value = { success: false, message: msg }
      toast.error(msg)
      return false
    } finally {
      orderLoading.value = false
    }
  }

  async function cancelOrder(orderId: string, tradePin: string): Promise<boolean> {
    cancelLoading.value = true
    try {
      await market.fetchMode()
      const expected_venue = market.isSimulation ? 'broker_simulation' : 'broker_production'
      const { data } = await api.post('/account/order/cancel/', {
        order_id: orderId, trade_pin: tradePin, expected_venue,
      })
      toast.success(data.message ?? '取消請求已送出')
      await fetchData(quote.value.code || '2330')
      return true
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? '取消委託失敗')
      return false
    } finally {
      cancelLoading.value = false
    }
  }

  /**
   * 單獨刷新五檔委託簿（不重新載入全部資料）。
   * 用於定時輪詢或使用者手動刷新五檔時使用。
   * @param stockCode - 股票代號
   */
  async function refreshOrderBook(stockCode: string) {
    try {
      const { data } = await api.get(`/stocks/${stockCode}/bidask/`)
      if (stockCode !== bookCode) return
      snapshotBook = { asks: data.asks ?? [], bids: data.bids ?? [] }
      if (orderBookSource.value === 'snapshot') orderBook.value = snapshotBook
    } catch {
      // silent — 五檔更新失敗不顯示錯誤
    }
  }

  onUnmounted(() => {
    disposed = true
    reconnect.cancel()
    ws?.close()
    ws = null
  })

  return {
    quote,
    orderBook,
    orderBookSource,
    orders,
    account,
    loading,
    error,
    orderLoading,
    cancelLoading,
    orderResult,
    fetchData,
    placeOrder,
    cancelOrder,
    refreshOrderBook,
    isDummy: false,
  }
}
