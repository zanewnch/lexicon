import { ref, type Ref } from 'vue'
import type { AxiosError } from 'axios'

/**
 * `useAsyncData` 的設定選項。
 * @template T - API 回傳的資料型別
 */
export interface UseAsyncDataOptions<T> {
  /** 建立時自動執行（default: false） */
  immediate?: boolean
  /** data 的初始值 */
  initialData?: T
  /** 使用者看到的預設錯誤訊息 */
  errorMessage?: string
  /** 自訂錯誤處理 callback，接收原始 error 物件 */
  onError?: (e: unknown) => void
}

/**
 * 通用非同步資料載入 composable。
 *
 * 封裝 loading / error / data 三個狀態，讓所有 API 呼叫可以用統一模式撰寫，
 * 不需要在每個功能裡重複 try/catch/finally 的樣板程式碼。
 *
 * 回傳的 `execute` 和 `refresh` 是同一個函式（alias），方便語意化呼叫。
 *
 * @template T - API 回傳資料的型別
 * @param fetcher - 執行 API 呼叫的非同步函式，回傳 `Promise<T>`
 * @param options - 可選設定（`immediate`、`initialData`、`errorMessage`、`onError`）
 * @returns `{ data, loading, error, execute, refresh }`
 *
 * @example
 * ```ts
 * const { data, loading, execute } = useAsyncData<Stock[]>(
 *   () => api.get('/stocks/').then(r => r.data),
 *   { initialData: [] }
 * )
 * // 手動觸發
 * await execute()
 * ```
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {},
) {
  /** API 回傳的資料，初始為 `options.initialData` 或 `null` */
  const data = ref(options.initialData ?? null) as Ref<T | null>
  /** 是否正在載入中 */
  const loading = ref(false)
  /** 錯誤訊息，無錯誤時為 `null` */
  const error = ref<string | null>(null)

  /**
   * 執行 API 呼叫。
   * 成功時更新 `data`，失敗時設定 `error`。
   * @returns 成功時回傳資料，失敗時回傳 `null`
   */
  async function execute(): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      data.value = result
      return result
    } catch (e: unknown) {
      const axiosErr = e as AxiosError<{ error?: string }>
      error.value =
        axiosErr?.response?.data?.error ??
        (e instanceof Error ? e.message : null) ??
        options.errorMessage ??
        '發生未知錯誤'
      options.onError?.(e)
      return null
    } finally {
      loading.value = false
    }
  }

  if (options.immediate) {
    execute()
  }

  return { data, loading, error, execute, refresh: execute }
}
