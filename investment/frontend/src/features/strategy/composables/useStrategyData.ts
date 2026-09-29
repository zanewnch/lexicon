import { ref } from 'vue'
import api from '@/api'
import type { Strategy, StrategyPayload } from '@/types/strategy'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'

/**
 * 策略管理的 CRUD composable。
 *
 * 提供完整的策略生命周期操作：
 * - **讀取**：取得策略列表（`fetchAll`）、取得單一策略（`fetchOne`）
 * - **新增**：建立新策略（`create`）
 * - **修改**：更新策略（`update`）、切換啟用 / 停用（`toggle`）
 * - **刪除**：刪除策略（`remove`）
 *
 * 所有寫入操作成功後都會顯示 Toast 提示，失敗時也會顯示錯誤 Toast。
 * 前端資料同步：策略清單 (`strategies`) 在增 / 刪 / 改後自動更新，不需重新呼叫 fetchAll。
 *
 * @returns 策略狀態和 CRUD 操作函式
 *
 * @example
 * ```ts
 * const { strategies, fetchAll, create, update, remove, toggle } = useStrategyData()
 * await fetchAll()
 * const newStrategy = await create({ name: '存股策略', ... })
 * await toggle(newStrategy.id)   // 啟用 / 停用
 * await remove(newStrategy.id)   // 刪除
 * ```
 */
export function useStrategyData() {
  /** 所有策略的清單 */
  const strategies = ref<Strategy[]>([])
  /** 目前查看 / 編輯的單一策略，未選取時為 `null` */
  const current = ref<Strategy | null>(null)
  const toast = useToast()

  const {
    loading,
    error,
    execute: executeFetchAll,
  } = useAsyncData<Strategy[]>(
    () => api.get<Strategy[]>('/strategies/').then(res => res.data),
    { errorMessage: '無法載入策略列表' },
  )

  /**
   * 取得所有策略並更新 `strategies`。
   */
  async function fetchAll() {
    const result = await executeFetchAll()
    if (result) strategies.value = result
  }

  /**
   * 取得單一策略的詳細資料，結果存入 `current`。
   * @param id - 策略 ID
   */
  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<Strategy>(`/strategies/${id}/`)
      current.value = data
    } catch {
      error.value = '無法載入策略'
    } finally {
      loading.value = false
    }
  }

  /**
   * 建立新策略，成功後將新策略加入 `strategies` 清單。
   * @param payload - 新策略的資料
   * @returns 建立成功的策略物件，失敗時回傳 `null`
   */
  async function create(payload: StrategyPayload): Promise<Strategy | null> {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<Strategy>('/strategies/', payload)
      strategies.value.push(data)
      toast.success('策略建立成功')
      return data
    } catch {
      error.value = '建立策略失敗'
      toast.error('建立策略失敗')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新現有策略，成功後同步更新 `strategies` 清單和 `current`。
   * @param id      - 策略 ID
   * @param payload - 要更新的欄位（Partial，只需提供要改的欄位）
   * @returns 更新後的策略物件，失敗時回傳 `null`
   */
  async function update(id: string, payload: Partial<StrategyPayload>): Promise<Strategy | null> {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.put<Strategy>(`/strategies/${id}/`, payload)
      const idx = strategies.value.findIndex((s) => s.id === id)
      if (idx !== -1) strategies.value[idx] = data
      if (current.value?.id === id) current.value = data
      toast.success('策略更新成功')
      return data
    } catch {
      error.value = '更新策略失敗'
      toast.error('更新策略失敗')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除策略，成功後從 `strategies` 清單移除。
   * @param id - 策略 ID
   * @returns 刪除成功回傳 `true`，失敗回傳 `false`
   */
  async function remove(id: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/strategies/${id}/`)
      strategies.value = strategies.value.filter((s) => s.id !== id)
      toast.success('策略已刪除')
      return true
    } catch {
      error.value = '刪除策略失敗'
      toast.error('刪除策略失敗')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 切換策略的啟用 / 停用狀態，成功後同步更新 `strategies` 清單。
   * @param id - 策略 ID
   * @returns 切換後的策略物件，失敗時回傳 `null`
   */
  async function toggle(id: string): Promise<Strategy | null> {
    try {
      const { data } = await api.post<Strategy>(`/strategies/${id}/toggle/`)
      const idx = strategies.value.findIndex((s) => s.id === id)
      if (idx !== -1) strategies.value[idx] = data
      toast.success('策略狀態已切換')
      return data
    } catch {
      error.value = '切換策略狀態失敗'
      toast.error('切換策略狀態失敗')
      return null
    }
  }

  return {
    strategies,
    current,
    loading,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    toggle,
  }
}
