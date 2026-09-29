import { ref, computed } from 'vue'

/**
 * 通用分頁邏輯 composable。
 *
 * 管理頁碼、總筆數、offset 計算，並提供智慧型的頁碼按鈕清單
 * （超過 7 頁會自動插入 `-1` 作為省略符號）。
 *
 * @param pageSize - 每頁顯示筆數，預設 20
 * @returns 分頁相關狀態與方法
 *
 * @example
 * ```ts
 * const { currentPage, total, offset, goToPage, visiblePages } = usePagination(15)
 * total.value = 100   // 設定總筆數（通常從 API 取得）
 * goToPage(3)         // 跳至第 3 頁
 * offset.value        // → 30  （第 3 頁的 offset）
 * ```
 */
export function usePagination(pageSize = 20) {
  /** 目前頁碼（從 1 開始） */
  const currentPage = ref(1)
  /** 資料總筆數，通常由 API 回傳後設定 */
  const total = ref(0)
  /** 總頁數（至少為 1） */
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  /** 目前頁碼對應的資料偏移量，用於 API 的 `offset` 參數 */
  const offset = computed(() => (currentPage.value - 1) * pageSize)

  /**
   * 跳至指定頁碼。
   * 若頁碼不合法（< 1 或 > totalPages）或與目前頁碼相同，則不執行任何動作。
   * @param page - 目標頁碼
   */
  function goToPage(page: number) {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return
    currentPage.value = page
  }

  /**
   * 重設回第 1 頁。
   * 通常在搜尋條件改變或切換篩選時呼叫。
   */
  function resetPage() {
    currentPage.value = 1
  }

  /**
   * 產生分頁按鈕的頁碼陣列，超過 7 頁時插入 `-1` 作為省略號（`…`）。
   *
   * 規則：
   * - 總頁數 ≤ 7：列出全部頁碼
   * - 總頁數 > 7：首頁 + 當前頁附近 ±1 頁 + 末頁，中間以 `-1` 代替省略號
   *
   * @returns 頁碼陣列，`-1` 代表省略號位置
   * @example
   * // 第 5 頁，共 20 頁
   * visiblePages() // → [1, -1, 4, 5, 6, -1, 20]
   */
  function visiblePages(): number[] {
    const pages: number[] = []
    const tp = totalPages.value
    const cp = currentPage.value

    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i)
    } else {
      pages.push(1)
      if (cp > 3) pages.push(-1)
      const start = Math.max(2, cp - 1)
      const end = Math.min(tp - 1, cp + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (cp < tp - 2) pages.push(-1)
      pages.push(tp)
    }
    return pages
  }

  return {
    currentPage,
    total,
    totalPages,
    offset,
    pageSize,
    goToPage,
    resetPage,
    visiblePages,
  }
}
