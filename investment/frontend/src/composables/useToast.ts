import { ref, readonly } from 'vue'

/** Toast 訊息的類型，對應不同的視覺樣式 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * 單一 Toast 訊息的資料結構。
 */
export interface Toast {
  /** 唯一識別碼（自動產生，格式 `toast-N`） */
  id: string
  /** 顯示給使用者看的訊息內容 */
  message: string
  /** 訊息類型，影響圖示和顏色 */
  type: ToastType
  /** 自動消失時間（毫秒），`0` 表示不自動消失 */
  duration: number
}

/**
 * 所有 Toast 的全域狀態（模組層級單例）。
 * 整個 App 共用同一個 toasts 陣列。
 */
const toasts = ref<Toast[]>([])

let _counter = 0

/**
 * 顯示一則 Toast 訊息。
 * @param message  - 訊息內容
 * @param type     - 訊息類型，預設 `'info'`
 * @param duration - 自動消失時間（毫秒），預設 4000ms；設為 0 不自動消失
 */
function show(message: string, type: ToastType = 'info', duration = 4000) {
  if (toasts.value.some((item) => item.message === message && item.type === type)) return
  const id = `toast-${++_counter}`
  toasts.value.push({ id, message, type, duration })
  if (toasts.value.length > 3) toasts.value.shift()
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
}

/**
 * 手動關閉指定 ID 的 Toast。
 * @param id - 要關閉的 Toast 識別碼
 */
function dismiss(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

/**
 * 全域 Toast 通知系統 composable。
 *
 * Toast 狀態為模組層級單例，所有元件呼叫 `useToast()` 都會共用同一個狀態，
 * 適合在 `api/client.ts` 等非元件檔案中使用。
 *
 * @returns Toast 狀態和操作函式
 *
 * @example
 * ```ts
 * const toast = useToast()
 * toast.success('儲存成功！')
 * toast.error('下單失敗，請稍後再試')
 * toast.warning('網路連線不穩定')
 * toast.info('資料更新中...')
 * ```
 */
export function useToast() {
  return {
    /** 唯讀的 Toast 列表，掛載到 ToastContainer 元件上顯示 */
    toasts: readonly(toasts),
    /** 顯示任意類型的 Toast */
    show,
    /** 顯示綠色成功訊息（4 秒後消失） */
    success: (msg: string) => show(msg, 'success'),
    /** 顯示紅色錯誤訊息（6 秒後消失） */
    error: (msg: string) => show(msg, 'error', 6000),
    /** 顯示黃色警告訊息（5 秒後消失） */
    warning: (msg: string) => show(msg, 'warning', 5000),
    /** 顯示藍色資訊訊息（4 秒後消失） */
    info: (msg: string) => show(msg, 'info'),
    /** 手動關閉指定 Toast */
    dismiss,
  }
}
