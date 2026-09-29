import { ref, onMounted } from 'vue'
import api from '@/api'
import type { PortfolioSummaryFull, HoldingDetail, AllocationItem, DividendRecord } from '@/types/account'
import {
  dummyPortfolioTrend,
  dummyAllocation,
  dummyDividends,
} from '@/data/dummy/portfolio.dummy'
import { useAsyncData } from '@/composables/useAsyncData'

/**
 * 投資組合詳細頁的資料獲取 composable。
 *
 * 並行呼叫兩個 API（`/account/portfolio/` 和 `/account/holdings/`）取得完整持倉資訊，
 * 並計算每個持倉的市值佔比（`weight`）。
 *
 * **部分資料使用 Dummy（佔位）資料**，等後端實作後再替換：
 * - `portfolioTrend` — 資產走勢圖數據
 * - `allocation` — 資產配置分布（股票 / 現金）
 * - `dividends` — 股利紀錄
 *
 * 元件掛載時（`onMounted`）會自動觸發資料載入。
 *
 * @returns 投資組合所有狀態
 * - `summary` — 摘要（總市值、成本、損益、現金餘額）
 * - `portfolioTrend` — 資產走勢（目前為 dummy）
 * - `holdings` — 持股詳細清單
 * - `allocation` — 資產配置（目前為 dummy）
 * - `dividends` — 股利紀錄（目前為 dummy）
 * - `loading` / `error` — 載入狀態
 * - `isDummy` — 是否使用假資料（此 composable 永遠為 `false`）
 */
export function usePortfolioData() {
  const summary = ref<PortfolioSummaryFull>({
    totalValue: 0, totalCost: 0, unrealizedPnl: 0, unrealizedPercent: 0,
    todayPnl: 0, todayPercent: 0, cashBalance: 0, totalAssets: 0,
  })
  const holdings = ref<HoldingDetail[]>([])

  // TODO: 後端尚未實作 trend / allocation / dividends API，暫用 dummy
  const portfolioTrend = ref<number[]>(dummyPortfolioTrend)
  const allocation = ref<AllocationItem[]>(dummyAllocation)
  const dividends = ref<DividendRecord[]>(dummyDividends)

  const { loading, error, execute: fetchPortfolio } = useAsyncData(
    async () => {
      // 並行呼叫投資組合摘要和持股清單兩支 API
      const [portfolioRes, holdingsRes] = await Promise.all([
        api.get('/account/portfolio/'),
        api.get('/account/holdings/'),
      ])

      const p = portfolioRes.data
      const summaryData: PortfolioSummaryFull = {
        totalValue: p.totalValue ?? 0,
        totalCost: p.totalCost ?? 0,
        unrealizedPnl: p.unrealizedPnl ?? 0,
        unrealizedPercent: p.unrealizedPercent ?? 0,
        todayPnl: p.todayPnl ?? 0,
        todayPercent: p.todayPercent ?? 0,
        cashBalance: p.accBalance ?? 0,
        totalAssets: (p.totalValue ?? 0) + (p.accBalance ?? 0),
      }

      // 計算每個持倉的市值佔比（weight = 持倉市值 / 總市值 × 100）
      const totalValue = summaryData.totalValue || 1
      const holdingsData: HoldingDetail[] = (holdingsRes.data as any[]).map(h => ({
        code: h.code,
        name: h.name,
        shares: h.shares,
        avgCost: h.avgCost,
        current: h.current,
        pnl: h.pnl,
        pnlPercent: h.pnlPercent,
        weight: (h.current * h.shares) / totalValue * 100,
        todayPnl: 0, // TODO: 後端尚未提供
      }))

      return { summaryData, holdingsData }
    },
    { errorMessage: '無法載入投資組合' },
  )

  const originalFetch = async () => {
    const result = await fetchPortfolio()
    if (result) {
      summary.value = result.summaryData
      holdings.value = result.holdingsData
    }
  }

  onMounted(originalFetch)

  return {
    summary,
    portfolioTrend,
    holdings,
    allocation,
    dividends,
    loading,
    error,
    isDummy: false,
  }
}
