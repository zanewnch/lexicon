import { ref, onMounted } from 'vue'
import api from '@/api'
import type {
  MarketIndex,
  PortfolioSummary,
  StockQuote,
  RankItem,
  Holding,
  Trade,
  NewsItem,
  SectorPerformance,
} from '@/types/market'
import {
  dummyNews,
} from '@/data/dummy/home.dummy'

// Default watchlist stock codes — TODO: make user-configurable
const WATCHLIST_CODES = ['2330', '2317', '2454', '2881', '3008', '2603', '2412', '3711']

/**
 * 儀表板（首頁）的核心資料載入 composable。
 *
 * 採用「優雅降級」策略（graceful-degrade pattern）：
 * 每個資料區塊獨立呼叫 API，任何一個失敗都不影響其他區塊顯示。
 * 每個資料區塊都有對應的 `xxxLive` 旗標，若 `false` 則表示使用 dummy 資料或尚未載入。
 *
 * 元件掛載時（`onMounted`）會自動觸發所有資料的並行載入。
 *
 * @internal
 */

/**
 * 安全地執行非同步函式，失敗時回傳 `null` 而非拋出例外。
 * 用於儀表板各區塊的獨立 API 呼叫，確保一個失敗不影響其他區塊。
 * @param fn - 要執行的非同步函式
 * @returns 成功時回傳結果，失敗時回傳 `null`
 */
async function safeFetch<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn() } catch { return null }
}

/**
 * 儀表板首頁所有資料的聚合 composable。
 *
 * 一次管理多個獨立的資料區塊：
 * - **大盤指數**（indices）：加權、OTC、期貨等指數
 * - **投資組合摘要**（portfolio）：總市值、今日損益等
 * - **持股清單**（holdings）：目前持有的股票
 * - **自選股報價**（watchlist）：固定監控的股票即時報價
 * - **漲跌幅排行**（topGainers / topLosers）：今日前 5 名
 * - **近期交易**（recentTrades）：最近的成交紀錄
 * - **類股漲跌幅**（sectorPerformance）：各產業平均漲跌
 * - **市場快訊**（news）：目前使用 dummy 資料
 *
 * @returns 所有資料狀態和手動刷新函式
 */
export function useHomeData() {
  const indices = ref<MarketIndex[]>([])
  /** 大盤指數是否取得真實資料（否則為空） */
  const indicesLive = ref(false)
  const portfolio = ref<PortfolioSummary>({
    totalValue: 0,
    totalCost: 0,
    totalAssets: 0,
    accBalance: 0,
    todayPnl: 0,
    todayPercent: 0,
    unrealizedPnl: 0,
    unrealizedPercent: 0,
  })
  /** 投資組合是否取得真實資料 */
  const portfolioLive = ref(false)
  const holdings = ref<Holding[]>([])
  /** 持股清單是否取得真實資料 */
  const holdingsLive = ref(false)
  const recentTrades = ref<Trade[]>([])
  /** 近期交易是否取得真實資料 */
  const tradesLive = ref(false)
  const watchlist = ref<StockQuote[]>([])
  /** 自選股是否取得真實資料 */
  const watchlistLive = ref(false)
  const topGainers = ref<RankItem[]>([])
  const topLosers = ref<RankItem[]>([])
  /** 漲跌排行是否取得真實資料 */
  const rankingsLive = ref(false)
  const sectorPerformance = ref<SectorPerformance[]>([])
  /** 類股表現是否取得真實資料 */
  const sectorsLive = ref(false)
  /** 全域 loading 狀態（主要由 fetchIndices 控制） */
  const loading = ref(false)

  /** 取得大盤指數（失敗不影響其他區塊） */
  async function fetchIndices() {
    loading.value = true
    const result = await safeFetch(() => api.get<MarketIndex[]>('/indices/'))
    if (result && result.data.length) {
      indices.value = result.data
      indicesLive.value = true
    }
    loading.value = false
  }

  /** 取得投資組合摘要（失敗不影響其他區塊） */
  async function fetchPortfolio() {
    const result = await safeFetch(() => api.get<PortfolioSummary>('/account/portfolio/'))
    if (result) {
      const d = result.data
      if (d && (d.simulation || d.totalAssets || d.totalValue || d.totalCost || d.accBalance)) {
        portfolio.value = d
        portfolioLive.value = true
      }
    }
  }

  /** 取得目前持股清單（失敗不影響其他區塊） */
  async function fetchHoldings() {
    const result = await safeFetch(() => api.get<Holding[]>('/account/holdings/'))
    if (result && result.data.length) {
      holdings.value = result.data
      holdingsLive.value = true
    }
  }

  /** 取得自選股報價（失敗不影響其他區塊） */
  async function fetchWatchlist() {
    const result = await safeFetch(() =>
      api.get<StockQuote[]>('/watchlist/', { params: { codes: WATCHLIST_CODES.join(',') } }),
    )
    if (result && result.data.length) {
      watchlist.value = result.data
      watchlistLive.value = true
    }
  }

  /** 同時取得漲幅和跌幅前 5 名（失敗不影響其他區塊） */
  async function fetchRankings() {
    const result = await safeFetch(() =>
      Promise.all([
        api.get<any[]>('/stocks/rankings/', { params: { type: 'gainers', limit: 5 } }),
        api.get<any[]>('/stocks/rankings/', { params: { type: 'losers', limit: 5 } }),
      ]),
    )
    if (result) {
      const [gainersRes, losersRes] = result
      topGainers.value = gainersRes.data.map((s: any) => ({
        code: s.code,
        name: s.name,
        percent: s.changePercent,
      }))
      topLosers.value = losersRes.data.map((s: any) => ({
        code: s.code,
        name: s.name,
        percent: s.changePercent,
      }))
      rankingsLive.value = true
    }
  }

  /** 取得近期交易紀錄（失敗不影響其他區塊） */
  async function fetchRecentTrades() {
    const result = await safeFetch(() => api.get<Trade[]>('/account/trades/'))
    if (result && result.data.length) {
      recentTrades.value = result.data
      tradesLive.value = true
    }
  }

  /** 取得類股漲跌幅（只取前 8 個類別）（失敗不影響其他區塊） */
  async function fetchSectors() {
    const result = await safeFetch(() => api.get<any[]>('/sectors/'))
    if (result) {
      sectorPerformance.value = result.data.slice(0, 8).map((s: any) => ({
        name: s.name,
        percent: s.avgChange,
        up: s.avgChange >= 0,
      }))
      sectorsLive.value = true
    }
  }

  // 元件掛載後並行觸發所有資料載入
  onMounted(() => {
    fetchIndices()
    fetchPortfolio()
    fetchHoldings()
    fetchWatchlist()
    fetchRankings()
    fetchRecentTrades()
    fetchSectors()
  })

  return {
    indices,
    portfolio,
    watchlist,
    topGainers,
    topLosers,
    holdings,
    recentTrades,
    /** 市場快訊（目前使用 dummy 資料） */
    news: ref<NewsItem[]>(dummyNews),
    sectorPerformance,
    loading,
    indicesLive,
    portfolioLive,
    holdingsLive,
    watchlistLive,
    rankingsLive,
    sectorsLive,
    refreshIndices: fetchIndices,
    refreshPortfolio: fetchPortfolio,
    refreshHoldings: fetchHoldings,
  }
}
