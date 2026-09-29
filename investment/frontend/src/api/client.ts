import axios from 'axios'
import { useToast } from '@/composables/useToast'

/**
 * 全域 Axios 實例。
 * - baseURL 從環境變數 `VITE_API_BASE` 讀取，預設為 `http://localhost:8000/api`
 * - timeout 15 秒
 *
 * 使用方式：
 * ```ts
 * import api from '@/api'
 * const { data } = await api.get('/stocks/')
 * ```
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 15_000,
})

const toast = useToast()

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getRequestLabel(error: { config?: { method?: string; url?: string } }) {
  const method = error.config?.method?.toUpperCase()
  const url = error.config?.url ?? 'API'
  return `${method ? `${method} ` : ''}${url}`
}

function getRequestId(headers: unknown): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined
  const source = headers as Record<string, unknown> & { get?: (name: string) => unknown }
  const value = typeof source.get === 'function'
    ? source.get('X-Request-ID')
    : source['X-Request-ID'] ?? source['x-request-id']
  return typeof value === 'string' ? value : undefined
}

function getResponseMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return undefined

  const payload = data as Record<string, unknown>
  const detail = payload.error ?? payload.detail ?? payload.message
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.filter((item) => typeof item === 'string').join('；')
  if (detail && typeof detail === 'object') {
    return Object.entries(detail as Record<string, unknown>)
      .map(([field, messages]) => {
        const value = Array.isArray(messages) ? messages.join('、') : String(messages)
        return `${field}: ${value}`
      })
      .join('；')
  }
  return undefined
}

/**
 * 全域錯誤攔截器（response interceptor）。
 *
 * 處理以下狀況：
 * - HTTP 4xx / 5xx：依狀態碼分類，顯示 API 路徑、狀態、可安全呈現的訊息與 request ID
 * - timeout：顯示逾時時間與 API 路徑
 * - 無回應：提示檢查 Django API、CORS 或網路連線
 * - intentional cancellation：不顯示錯誤
 *
 * 所有錯誤都會繼續 `Promise.reject(error)`，讓呼叫方也能 catch。
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response
      const requestId = getRequestId(error.response.headers)
      const requestLabel = getRequestLabel(error)
      const serverMessage = getResponseMessage(error.response.data)
      const categories: Record<number, string> = {
        400: '請求資料格式錯誤',
        401: '尚未登入或登入狀態已失效',
        403: '目前帳號沒有執行此操作的權限',
        404: '找不到 API 路徑或指定資料',
        409: '資料狀態衝突，請重新整理後再試',
        422: '輸入資料未通過驗證',
        429: '請求過於頻繁，請稍後再試',
        503: '服務或上游資料來源目前無法使用',
      }
      const category = categories[status] ?? (status >= 500 ? '伺服器處理失敗' : 'API 請求失敗')
      const message = status >= 500 && status !== 503 ? category : (serverMessage || category)
      const diagnostic = requestId ? `；追蹤編號 ${requestId}` : ''
      console.error(`[API] ${status} ${requestLabel}${diagnostic}`, error.response.data)
      toast.error(`${requestLabel}：HTTP ${status} ${message}${diagnostic}`)
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const requestLabel = getRequestLabel(error)
      const timeoutSeconds = Math.round((error.config?.timeout ?? 15_000) / 1000)
      const requestId = getRequestId(error.config?.headers)
      const diagnostic = requestId ? `；追蹤編號 ${requestId}` : ''
      console.warn(`[API] Timeout after ${timeoutSeconds}s: ${requestLabel}${diagnostic}`)
      toast.warning(`${requestLabel} 等待超過 ${timeoutSeconds} 秒未回應；這不一定是電腦斷網，請檢查本機 API 與資料來源${diagnostic}。`)
    } else if (error.code === 'ERR_CANCELED') {
      console.debug(`[API] Request cancelled: ${getRequestLabel(error)}`)
    } else if (error.request) {
      const requestLabel = getRequestLabel(error)
      const requestId = getRequestId(error.config?.headers)
      const diagnostic = requestId ? `；追蹤編號 ${requestId}` : ''
      console.warn(`[API] No response from ${requestLabel}${diagnostic}:`, error.message)
      toast.error(`${requestLabel} 沒有收到伺服器回應（${error.message}）；請確認 Django 後端已啟動、API 網址正確且 CORS 已允許前端來源${diagnostic}。`)
    } else {
      console.error('[API] Request setup failed:', error)
      toast.error(`API 請求設定失敗：${error.message}`)
    }
    return Promise.reject(error)
  },
)

api.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', createRequestId())
  return config
})

export default api
