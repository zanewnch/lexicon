/**
 * WebSocket / 連線重試的選項設定。
 */
export interface ReconnectOptions {
  /** 第一次重試的延遲（毫秒），預設 1000ms */
  baseDelay?: number
  /** 最大延遲上限（毫秒），預設 30000ms */
  maxDelay?: number
  /** 抖動係數 0~1，避免同時大量重連（預設 0.3） */
  jitter?: number
  /** 連續失敗 N 次後觸發此 callback */
  onMaxRetries?: (attempt: number) => void
  /** 觸發 `onMaxRetries` 的閾值，預設 5 次 */
  maxRetriesThreshold?: number
}

/**
 * 建立一個指數退避（Exponential Backoff）重連控制器。
 *
 * 每次呼叫 `schedule()` 會等候一段時間後自動呼叫 `connectFn`，
 * 等候時間隨著失敗次數指數成長，並加入隨機抖動避免雷鳴般的同步重連問題。
 *
 * 延遲公式：`min(baseDelay × 2^attempt, maxDelay) ± jitter`
 *
 * @param connectFn - 重連時要執行的函式（例如 `connectWebSocket`）
 * @param options   - 重試策略的選項
 * @returns `{ schedule, reset, cancel, attempt }`
 *
 * @example
 * ```ts
 * const reconnect = createReconnect(connectWebSocket, {
 *   baseDelay: 1000,
 *   maxDelay: 30000,
 *   onMaxRetries: (n) => toast.warning(`重試 ${n} 次仍失敗`)
 * })
 *
 * ws.onclose = () => reconnect.schedule()  // 斷線時安排重連
 * ws.onopen  = () => reconnect.reset()     // 連線成功時重設計數器
 * ```
 */
export function createReconnect(
  connectFn: () => void,
  options: ReconnectOptions = {},
) {
  const {
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = 0.3,
    onMaxRetries,
    maxRetriesThreshold = 5,
  } = options

  let attempt = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  /**
   * 安排下一次重連（帶指數退避延遲）。
   * 呼叫後會在計算好的延遲時間後自動執行 `connectFn`。
   */
  function schedule() {
    const delay = Math.min(baseDelay * 2 ** attempt, maxDelay)
    const jitterAmount = delay * jitter * (Math.random() * 2 - 1)
    const finalDelay = Math.max(0, delay + jitterAmount)

    timer = setTimeout(() => {
      attempt++
      if (onMaxRetries && attempt >= maxRetriesThreshold) {
        onMaxRetries(attempt)
      }
      connectFn()
    }, finalDelay)
  }

  /**
   * 重設重試計數器並取消任何待執行的重連計時器。
   * 通常在連線成功後呼叫。
   */
  function reset() {
    attempt = 0
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  /**
   * 取消待執行的重連計時器（但不重設計數器）。
   * 通常在元件卸載或手動關閉連線時呼叫。
   */
  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { schedule, reset, cancel, get attempt() { return attempt } }
}
