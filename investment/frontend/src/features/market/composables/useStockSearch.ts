import { ref, watch, type Ref } from 'vue'
import api from '@/api'

/**
 * 股票搜尋結果的資料結構。
 */
interface SearchResult {
  /** 股票代號，例如 `'2330'` */
  code: string
  /** 股票名稱，例如 `'台積電'` */
  name: string
  /** 目前股價 */
  price: number
  /** 漲跌幅（百分比，例如 `2.15` 代表 +2.15%） */
  changePercent: number
}

/**
 * 股票搜尋功能的 composable，支援鍵盤導航。
 *
 * 接收一個搜尋字串的 Ref，使用 **debounce（300ms）** 避免過度呼叫 API，
 * 搜尋結果最多顯示 8 筆。
 *
 * 支援以下鍵盤操作（需由父元件監聽 keydown 並呼叫對應方法）：
 * - ↑ → `moveUp()`：向上移動選中項目
 * - ↓ → `moveDown()`：向下移動選中項目
 * - Escape → `close()`：關閉下拉選單
 *
 * @param query - 搜尋輸入字串的 Ref（通常綁定到 `<input>` 的 `v-model`）
 * @returns 搜尋結果、下拉開關、鍵盤導航方法
 *
 * @example
 * ```ts
 * const searchInput = ref('')
 * const { results, isOpen, selectedIndex, moveUp, moveDown, close } = useStockSearch(searchInput)
 * // 當使用者輸入 '台積' 時，300ms 後自動搜尋並填入 results
 * ```
 */
export function useStockSearch(query: Ref<string>) {
  /** 搜尋結果清單（最多 8 筆） */
  const results = ref<SearchResult[]>([])
  /** 下拉選單是否開啟（有結果且不為空時才開啟） */
  const isOpen = ref(false)
  /** 是否正在載入搜尋結果 */
  const loading = ref(false)
  /** 目前鍵盤選中的項目索引，`-1` 表示沒有選中任何項目 */
  const selectedIndex = ref(-1)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // 監聽 query 變化，debounce 後觸發搜尋
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    const trimmed = val.trim()
    if (!trimmed) {
      results.value = []
      isOpen.value = false
      selectedIndex.value = -1
      return
    }

    debounceTimer = setTimeout(async () => {
      loading.value = true
      try {
        const { data } = await api.get('/stocks/', {
          params: { search: trimmed, limit: 8 },
        })
        // 支援標準 API envelope，以及舊有的陣列 / results 回應格式。
        if (Array.isArray(data)) {
          results.value = data.map((s: any) => ({
            code: s.code,
            name: s.name,
            price: s.price ?? 0,
            changePercent: s.changePercent ?? s.change_percent ?? 0,
          }))
        } else if (Array.isArray(data?.data) || Array.isArray(data?.results)) {
          const items = data.data ?? data.results
          results.value = items.map((s: any) => ({
            code: s.code,
            name: s.name,
            price: s.price ?? 0,
            changePercent: s.changePercent ?? s.change_percent ?? 0,
          }))
        }
        isOpen.value = results.value.length > 0
        selectedIndex.value = -1
      } catch {
        results.value = []
        isOpen.value = false
      } finally {
        loading.value = false
      }
    }, 300)
  })

  /**
   * 將鍵盤選中項目向上移動一格（不超過第一項）。
   */
  function moveUp() {
    if (selectedIndex.value > 0) selectedIndex.value--
  }

  /**
   * 將鍵盤選中項目向下移動一格（不超過最後一項）。
   */
  function moveDown() {
    if (selectedIndex.value < results.value.length - 1) selectedIndex.value++
  }

  /**
   * 關閉下拉選單並清除選中狀態。
   * 通常在按下 Escape 或點擊選單外部時呼叫。
   */
  function close() {
    isOpen.value = false
    selectedIndex.value = -1
  }

  return {
    results,
    isOpen,
    loading,
    selectedIndex,
    moveUp,
    moveDown,
    close,
  }
}
