import { ref, isRef, onUnmounted, watch, type Ref, type MaybeRef } from 'vue'
import type { StockDetail, KlineBar, OrderBook, Tick, InstitutionalDay, Technicals, SectorQuote } from '@/types/market'
import api from '@/api'
import { createReconnect } from '@/composables/useReconnect'
import { useToast } from '@/composables/useToast'
import {
  dummyStockDetail,
  dummyTechnicals,
} from '@/data/dummy/market.dummy'

const WS_BASE = import.meta.env.VITE_WS_BASE ?? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`

/**
 * 個股行情頁面的核心資料管理 composable。
 *
 * 整合 **REST API**（靜態資料）和 **WebSocket**（即時串流）兩種資料來源：
 *
 * ### REST API 資料（載入時取得，切換股票時重新載入）
 * - `stockDetail` — 基本資訊（名稱、報價、本益比、殖利率等）
 * - `klineData / klineLabels` — K 線圖收盤價和時間軸標籤
 * - `institutional` — 三大法人近 5 日買賣超
 * - `technicals` — 技術指標（MA5/10/20/60、RSI、KD、MACD）
 * - `sectorQuotes` — 所屬類股表現（取前 6 個類別）
 *
 * ### WebSocket 資料（連線後即時更新）
 * - `ticks` — 成交明細（最新 50 筆）
 * - `orderBook` — 五檔委託簿（買賣各 5 檔）
 *
 * 資料來源失敗時，各區塊獨立顯示可用資料；K 線與法人資料不使用假資料補值。
 *
 * **自動 Keep-alive**：WebSocket 每 30 秒發送 ping 防止閒置斷線。
 *
 * @param codeRef - 股票代號（可傳入 `string` 或 `Ref<string>`，切換股票時傳入不同值即可）
 * @returns 個股行情頁面所需的所有狀態
 *
 * @example
 * ```ts
 * const stockCode = ref('2330')
 * const market = useMarketData(stockCode)
 * // 切換股票
 * stockCode.value = '2454'  // → 自動重新載入資料並重建 WebSocket
 * ```
 */
export function useMarketData(codeRef: MaybeRef<string>) {
  /** 股票代號的 Ref（統一處理字串或 ref 兩種輸入） */
  const code: Ref<string> = isRef(codeRef) ? codeRef : ref(codeRef)

  /** 股票基本資訊和報價（初始為 dummy 資料） */
  const stockDetail = ref<StockDetail>({ ...dummyStockDetail })
  /** K 線圖收盤價陣列（資料未到時為空） */
  const klineData = ref<number[]>([])
  const klineBars = ref<KlineBar[]>([])
  /** K 線圖時間軸標籤（格式 `M/D` 或 `HH:MM`） */
  const klineLabels = ref<string[]>([])
  /** 五檔委託簿 */
  const orderBook = ref<OrderBook>({ asks: [], bids: [] })
  /** 即時成交明細（最新 50 筆，新的在最前面） */
  const ticks = ref<Tick[]>([])
  /** 三大法人買賣超（近 5 日） */
  const institutional = ref<InstitutionalDay[]>([])
  /** 技術指標（MA、RSI、KD、MACD） */
  const technicals = ref<Technicals>({ ...dummyTechnicals })
  /** 類股表現摘要（前 6 個類別） */
  const sectorQuotes = ref<SectorQuote[]>([])
  /** 是否正在載入（切換股票時為 true） */
  const loading = ref(true)
  const klineLoading = ref(true)
  const detailAvailable = ref(false)
  const technicalsAvailable = ref(false)
  let klineRequestId = 0
  /** 是否仍在使用 dummy 資料（API 和 WS 都成功後會變成 false） */
  const isDummy = ref(true)

  /**
   * 追蹤各資料來源是否已取得真實資料。
   * 只要 `detail` 或 `kline` 其中之一有真實資料，`isDummy` 就會變成 false。
   */
  const liveFlags = {
    detail: false,
    kline: false,
    orderBook: false,
    ticks: false,
    institutional: false,
    technicals: false,
    sectors: false,
  }

  /** 根據 liveFlags 更新 isDummy 狀態 */
  function updateIsDummy() {
    isDummy.value = !liveFlags.detail && !liveFlags.kline
  }

  // ---- REST API calls ----

  /** 取得股票基本資訊和即時報價 */
  async function fetchStockDetail() {
    const requestedCode = code.value
    try {
      const { data } = await api.get<StockDetail>(`/stocks/${requestedCode}/`)
      if (code.value !== requestedCode) return
      if (data && data.code) {
        stockDetail.value = data
        detailAvailable.value = true
        liveFlags.detail = true
        updateIsDummy()
      }
    } catch {
      // Axios interceptor handles 5xx/network errors; keep dummy data
    }
  }

  /**
   * 取得 K 線圖資料。
   * 自動判斷資料是否跨天，跨天顯示 `M/D`，同天顯示 `HH:MM`。
   * @param period - K 棒週期（`'Day'`、`'60K'`、`'5K'` 等），預設 `'Day'`
   * @param limit  - 取得的 K 棒數量，預設 60
   */
  async function fetchKline(period = 'Day', limit = 60, keepPrevious = false) {
    const requestedCode = code.value
    const requestId = ++klineRequestId
    klineLoading.value = true
    if (!keepPrevious) {
      klineData.value = []
      klineBars.value = []
      klineLabels.value = []
    }
    try {
      const { data } = await api.get<KlineBar[]>(`/stocks/${requestedCode}/kline/`, {
        params: { period, limit },
        timeout: period === 'Month' || limit > 120 ? 75_000 : 30_000,
      })
      if (code.value !== requestedCode || requestId !== klineRequestId) return
      if (data && data.length > 0) {
        klineBars.value = data
        klineData.value = data.map((bar) => bar.close)

        // 判斷資料是否跨天，決定顯示日期或時間
        const dates = new Set(
          data.map((bar) => bar.ts?.slice(0, 10)).filter(Boolean),
        )
        const showTime = dates.size <= 1

        klineLabels.value = data.map((bar) => {
          if (!bar.ts) return ''
          const match = bar.ts.match(/\d{4}-(\d{2})-(\d{2})T?(\d{2}:\d{2})?/)
          if (!match) return ''
          return showTime && match[3]
            ? match[3]
            : `${parseInt(match[1]!)}/${parseInt(match[2]!)}`
        })
        liveFlags.kline = true
        updateIsDummy()
      }
    } catch {
      // Keep the chart empty so failed source data is never shown as a price series.
    } finally {
      if (code.value === requestedCode && requestId === klineRequestId) {
        klineLoading.value = false
      }
    }
  }

  /** 取得三大法人近 5 日買賣超 */
  async function fetchInstitutional() {
    const requestedCode = code.value
    try {
      const { data } = await api.get<InstitutionalDay[]>(`/stocks/${requestedCode}/institutional/`, {
        params: { days: 5 },
      })
      if (code.value !== requestedCode) return
      if (data && data.length > 0) {
        institutional.value = data
        liveFlags.institutional = true
        updateIsDummy()
      }
    } catch {
      if (code.value === requestedCode) institutional.value = []
    }
  }

  /** 取得技術指標（MA、RSI、KD、MACD） */
  async function fetchTechnicals() {
    const requestedCode = code.value
    try {
      const { data } = await api.get<Technicals>(`/stocks/${requestedCode}/technicals/`)
      if (code.value !== requestedCode) return
      if (data && data.ma5) {
        technicals.value = data
        technicalsAvailable.value = true
        liveFlags.technicals = true
        updateIsDummy()
      }
    } catch {
      // Axios interceptor handles 5xx/network errors; keep dummy data
    }
  }

  /** 取得類股表現摘要（前 6 個類別，每個類別附帶前 3 支代表股） */
  async function fetchSectors() {
    try {
      const { data } = await api.get<Array<{
        name: string
        avgChange: number
        up: boolean
        stocks: Array<{ code: string; name: string }>
      }>>('/sectors/')
      if (data && data.length > 0) {
        sectorQuotes.value = data.slice(0, 6).map((s) => ({
          name: s.name,
          change: s.avgChange,
          up: s.up ?? s.avgChange >= 0,
          stocks: s.stocks
            ? s.stocks.slice(0, 3).map((st) => `${st.code} ${st.name}`)
            : [],
        }))
        liveFlags.sectors = true
        updateIsDummy()
      }
    } catch {
      sectorQuotes.value = []
    }
  }

  // ---- WebSocket for real-time tick + bidask ----

  let ws: WebSocket | null = null
  const MAX_TICKS = 50 // keep last 50 ticks in the list
  const toast = useToast()

  /**
   * WebSocket 重連控制器。
   * 斷線後使用指數退避策略重連，超過 3 次失敗後顯示 Toast 警告。
   */
  const reconnect = createReconnect(connectWebSocket, {
    baseDelay: 1000,
    maxDelay: 30000,
    jitter: 0.3,
    maxRetriesThreshold: 3,
    onMaxRetries: () => {
      toast.warning('即時行情連線中斷，正在重試...')
    },
  })

  /**
   * 建立 WebSocket 連線到個股行情 endpoint。
   * 接收兩種訊息類型：
   * - `tick` — 成交明細，更新 `stockDetail` 和 `ticks`
   * - `bidask` — 五檔更新，更新 `orderBook`
   */
  function connectWebSocket() {
    if (ws) {
      ws.close()
    }

    const url = `${WS_BASE}/ws/market/${code.value}/`
    ws = new WebSocket(url)

    ws.onopen = () => {
      reconnect.reset()
      liveFlags.orderBook = true
      liveFlags.ticks = true
      updateIsDummy()
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'tick') {
          // 更新報價（使用 prevClose 計算漲跌幅）
          const prevClose = stockDetail.value.prevClose || stockDetail.value.price
          stockDetail.value = {
            ...stockDetail.value,
            price: msg.price,
            close: msg.price,
            change: +(msg.price - prevClose).toFixed(2),
            percent: prevClose ? +((msg.price - prevClose) / prevClose * 100).toFixed(2) : 0,
            up: msg.price >= prevClose,
            volume: msg.totalVolume,
          }

          // 將新成交加到清單最前面（最多保留 MAX_TICKS 筆）
          const newTick: Tick = {
            time: msg.time,
            price: msg.price,
            volume: msg.volume,
            up: msg.tickType === 0,
          }
          ticks.value = [newTick, ...ticks.value.slice(0, MAX_TICKS - 1)]

        } else if (msg.type === 'bidask') {
          // 更新五檔委託簿
          const asks: { price: number; volume: number }[] = []
          const bids: { price: number; volume: number }[] = []

          for (let i = 0; i < 5; i++) {
            asks.push({
              price: msg.askPrices[i] || 0,
              volume: msg.askVolumes[i] || 0,
            })
            bids.push({
              price: msg.bidPrices[i] || 0,
              volume: msg.bidVolumes[i] || 0,
            })
          }

          orderBook.value = { asks, bids }
        }
      } catch {
        // WebSocket parse errors are non-critical
      }
    }

    ws.onclose = (event) => {
      if (!event.wasClean) {
        reconnect.schedule()
      }
    }

    ws.onerror = () => {
      // WebSocket errors are non-critical; reconnect handles recovery
    }
  }

  // Keep-alive ping every 30 seconds
  let pingTimer: ReturnType<typeof setInterval> | null = null

  /** 啟動 keep-alive ping（每 30 秒送一次，防止 WebSocket 閒置斷線） */
  function startPing() {
    pingTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'ping' }))
      }
    }, 30_000)
  }

  // ---- Lifecycle ----

  /** 清理 WebSocket 連線、重連計時器和 ping 計時器 */
  function cleanup() {
    if (ws) {
      ws.close()
      ws = null
    }
    reconnect.cancel()
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  /** 將所有資料重設回 dummy 初始值（切換股票時使用） */
  function resetData() {
    ++klineRequestId
    stockDetail.value = { ...dummyStockDetail }
    klineData.value = []
    klineBars.value = []
    klineLabels.value = []
    orderBook.value = { asks: [], bids: [] }
    ticks.value = []
    institutional.value = []
    technicals.value = { ...dummyTechnicals }
    sectorQuotes.value = []
    isDummy.value = true
    loading.value = true
    klineLoading.value = true
    detailAvailable.value = false
    technicalsAvailable.value = false
    liveFlags.detail = false
    liveFlags.kline = false
    liveFlags.orderBook = false
    liveFlags.ticks = false
    liveFlags.institutional = false
    liveFlags.technicals = false
    liveFlags.sectors = false
  }

  /** 切換股票時立即重建即時連線，各 REST 區塊獨立載入。 */
  watch(code, () => {
    cleanup()
    resetData()
    connectWebSocket()
    startPing()
    const requestedCode = code.value
    void fetchStockDetail().finally(() => {
      if (code.value === requestedCode) loading.value = false
    })
    void fetchKline()
    void fetchInstitutional()
    void fetchTechnicals()
    void fetchSectors()
  }, { immediate: true })

  onUnmounted(cleanup)

  return {
    stockDetail,
    klineData,
    klineBars,
    klineLabels,
    orderBook,
    ticks,
    institutional,
    technicals,
    sectorQuotes,
    loading,
    klineLoading,
    detailAvailable,
    technicalsAvailable,
    isDummy,
    // Expose refetch for period switching
    fetchKline,
  }
}
