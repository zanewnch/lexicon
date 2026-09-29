import { ref } from 'vue'
import api from '@/api'
import { useAsyncData } from '@/composables/useAsyncData'
import type { StockListItem, StockListResponse, TreemapItem, SectorSummary, RankingType } from '@/types/explorer'
import type { SortOrder } from '@/types/common'

// ---- Stock List ----

/**
 * 股票篩選列表的資料獲取 composable。
 *
 * 提供可分頁、可搜尋、可排序的股票清單，
 * 支援按交易所（上市 / 上櫃）和產業分類過濾。
 *
 * @returns
 * - `stocks` — 目前頁的股票清單
 * - `total` — 符合條件的總筆數（用於分頁計算）
 * - `loading` — 是否正在載入
 * - `error` — 錯誤訊息（無錯誤時為 `null`）
 * - `fetchStocks` — 觸發 API 呼叫的函式
 *
 * @example
 * ```ts
 * const { stocks, total, loading, fetchStocks } = useStockList()
 * await fetchStocks({ search: '台積電', sort: 'marketCap', order: 'desc', limit: 20 })
 * ```
 */
export function useStockList() {
  const stocks = ref<StockListItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 取得股票清單。
   * @param params.search   - 搜尋關鍵字（代號或名稱）
   * @param params.exchange - 篩選交易所（`'TWSE'` 上市、`'TPEX'` 上櫃）
   * @param params.sector   - 篩選產業分類名稱
   * @param params.sort     - 排序欄位名稱
   * @param params.order    - 排序方向 `'asc'` 或 `'desc'`
   * @param params.limit    - 每頁筆數
   * @param params.offset   - 資料偏移量
   */
  async function fetchStocks(params: {
    search?: string
    exchange?: string
    sector?: string
    sort?: string
    order?: SortOrder
    limit?: number
    offset?: number
  } = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<StockListResponse>('/stocks/', { params })
      stocks.value = data.data
      total.value = data.total
    } catch (e: any) {
      error.value = e.response?.data?.error ?? e.message ?? 'Failed to fetch stocks'
    } finally {
      loading.value = false
    }
  }

  return { stocks, total, loading, error, fetchStocks }
}

// ---- Treemap ----

/**
 * 市值樹狀圖（Treemap）資料的 composable。
 *
 * 每個節點代表一支股票，大小對應市值，顏色對應漲跌幅。
 * 使用 `useAsyncData` 封裝，提供統一的 loading 狀態。
 *
 * @returns
 * - `data` — `TreemapItem[]` 陣列（初始為空陣列）
 * - `loading` — 是否正在載入
 * - `fetchTreemap` — 觸發 API 呼叫的函式
 */
export function useTreemapData() {
  const { data, loading, execute: fetchTreemap } = useAsyncData<TreemapItem[]>(
    () => api.get<TreemapItem[]>('/stocks/treemap/').then(r => r.data),
    { initialData: [] as TreemapItem[] },
  )

  return { data, loading, fetchTreemap }
}

// ---- Rankings ----

/**
 * 股票排行榜（Rankings）資料的 composable。
 *
 * 支援多種排行類型（殖利率、漲幅、跌幅、成交量等），
 * 並可動態切換排行類型而無需重新建立 composable。
 *
 * @returns
 * - `data` — 目前排行的股票清單
 * - `loading` — 是否正在載入
 * - `rankType` — 目前選中的排行類型
 * - `fetchRankings` — 觸發 API 呼叫的函式
 *
 * @example
 * ```ts
 * const { data, fetchRankings } = useRankings()
 * await fetchRankings('gainers', 20) // 取得漲幅前 20 名
 * ```
 */
export function useRankings() {
  /** 目前排行類型，預設 `'yield'`（殖利率） */
  const rankType = ref<RankingType>('yield')
  const data = ref<StockListItem[]>([])
  const loading = ref(false)

  /**
   * 取得指定類型的排行榜資料。
   * @param type  - 排行類型（若省略則使用目前的 `rankType`）
   * @param limit - 取得筆數，預設 50
   */
  async function fetchRankings(type?: RankingType, limit = 50) {
    if (type) rankType.value = type
    loading.value = true
    try {
      const res = await api.get<StockListItem[]>('/stocks/rankings/', {
        params: { type: rankType.value, limit },
      })
      data.value = res.data
    } catch {
      data.value = []
    } finally {
      loading.value = false
    }
  }

  return { data, loading, rankType, fetchRankings }
}

// ---- Sectors ----

/**
 * 產業類股摘要資料的 composable。
 *
 * 取得所有產業類別的漲跌幅摘要，可用於類股熱力圖或類股排行。
 *
 * @returns
 * - `sectors` — `SectorSummary[]` 陣列（初始為空陣列）
 * - `loading` — 是否正在載入
 * - `fetchSectors` — 觸發 API 呼叫的函式
 */
export function useSectors() {
  const { data: sectors, loading, execute: fetchSectors } = useAsyncData<SectorSummary[]>(
    () => api.get<SectorSummary[]>('/sectors/').then(r => r.data),
    { initialData: [] as SectorSummary[] },
  )

  return { sectors, loading, fetchSectors }
}
