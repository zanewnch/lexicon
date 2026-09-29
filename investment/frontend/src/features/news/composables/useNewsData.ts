import { ref } from 'vue'
import api from '@/api'
import type { NewsItem } from '@/types/market'
import { usePagination } from '@/composables/usePagination'
import { useAsyncData } from '@/composables/useAsyncData'

/**
 * 市場快訊（新聞）資料的分頁載入 composable。
 *
 * 整合 `usePagination` 和 `useAsyncData`，提供：
 * - 新聞來源切換（鉅亨網、ETtoday、全部）
 * - 關鍵字搜尋（搜尋後自動重設到第 1 頁）
 * - 分頁切換（切換頁碼後自動重新載入）
 *
 * 每頁固定顯示 15 筆，分頁按鈕由 `visiblePages()` 提供。
 *
 * @returns 新聞資料、分頁狀態與控制函式
 *
 * @example
 * ```ts
 * const news = useNewsData()
 * await news.fetchNews()         // 初次載入
 * news.setSource('anue')         // 切換來源至鉅亨網
 * news.setSearch('台積電')        // 搜尋關鍵字
 * news.goToPage(2)               // 跳至第 2 頁
 * ```
 */
export function useNewsData() {
  /** 目前頁的新聞清單 */
  const items = ref<NewsItem[]>([])
  /** 目前選擇的新聞來源，`'all'` 為不篩選 */
  const source = ref<'all' | 'anue' | 'ettoday'>('all')
  /** 搜尋關鍵字 */
  const search = ref('')

  const { currentPage, total, totalPages, offset, pageSize, goToPage: paginationGoToPage, resetPage, visiblePages } = usePagination(15)

  const { loading, error, execute: fetchNews } = useAsyncData<{ total: number; data: NewsItem[] }>(
    () => api.get<{ total: number; data: NewsItem[] }>('/news/', {
      params: {
        source: source.value,
        search: search.value,
        limit: pageSize,
        offset: offset.value,
      },
    }).then(res => res.data),
    { errorMessage: '無法載入市場快訊' },
  )

  /**
   * 觸發新聞 API 並更新 `items` 和 `total`。
   * 成功後同步更新分頁的總筆數。
   */
  const originalFetchNews = async () => {
    const result = await fetchNews()
    if (result) {
      items.value = result.data
      total.value = result.total
    }
  }

  /**
   * 切換新聞來源，並重設到第 1 頁後重新載入。
   * @param s - 新聞來源（`'all'`、`'anue'`、`'ettoday'`）
   */
  function setSource(s: 'all' | 'anue' | 'ettoday') {
    source.value = s
    resetPage()
    originalFetchNews()
  }

  /**
   * 設定搜尋關鍵字，並重設到第 1 頁後重新載入。
   * @param s - 搜尋關鍵字
   */
  function setSearch(s: string) {
    search.value = s
    resetPage()
    originalFetchNews()
  }

  /**
   * 跳至指定頁碼並重新載入對應頁的新聞。
   * @param page - 目標頁碼
   */
  function goToPage(page: number) {
    paginationGoToPage(page)
    originalFetchNews()
  }

  return {
    items,
    loading,
    error,
    total,
    source,
    search,
    currentPage,
    totalPages,
    pageSize,
    fetchNews: originalFetchNews,
    setSource,
    setSearch,
    goToPage,
    visiblePages,
  }
}
