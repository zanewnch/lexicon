import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api'

/**
 * 券商連線模式的 Pinia store。
 *
 * 管理 Shioaji（永豐金 API）的連線模式：
 * - **模擬模式**（simulation = true）：可連線至券商模擬環境；送單仍需明確確認與交易密碼
 * - **正式模式**（simulation = false）：連接真實券商 API，下單有效
 *
 * 在 store 建立時會自動呼叫 `fetchMode()` 取得目前模式。
 *
 * 使用方式：
 * ```ts
 * const marketStore = useMarketStore()
 * console.log(marketStore.isSimulation)    // 是否為模擬模式
 * console.log(marketStore.modeConnected)   // 是否已連線
 * await marketStore.switchMode(false)      // 切換至正式模式
 * ```
 */
export const useMarketStore = defineStore('market', () => {
  /** 是否為模擬模式（`true` = 模擬，`false` = 正式交易） */
  const isSimulation = ref(true)
  /** 是否成功連線到券商 API */
  const modeConnected = ref(false)
  /** 模式切換中的 loading 狀態，避免使用者重複點擊 */
  const modeSwitching = ref(false)
  /** 模式切換失敗的錯誤訊息，切換成功後會清空 */
  const modeError = ref<string | null>(null)

  /**
   * 向後端查詢目前的連線模式（模擬 or 正式）。
   * 若後端不可達則靜默失敗（不顯示錯誤）。
   */
  async function fetchMode() {
    try {
      const { data } = await api.get<{ simulation: boolean; connected: boolean }>('/system/mode/')
      isSimulation.value = data.simulation
      modeConnected.value = data.connected
    } catch {
      modeConnected.value = false
    }
  }

  /**
   * 切換模擬 / 正式模式。
   * 會等待 Shioaji 重新連線（最多 30 秒 timeout）。
   *
   * @param simulation - `true` 切換為模擬模式，`false` 切換為正式模式
   *
   * 切換成功後會更新 `isSimulation` 和 `modeConnected`。
   * 超時或失敗則設定 `modeError` 訊息。
   */
  async function switchMode(simulation: boolean) {
    modeSwitching.value = true
    modeError.value = null
    try {
      const { data } = await api.post<{ simulation: boolean; connected: boolean }>(
        '/system/mode/', { simulation }, { timeout: 30_000 },
      )
      isSimulation.value = data.simulation
      modeConnected.value = data.connected
    } catch (e: any) {
      if (e.code === 'ECONNABORTED') {
        modeError.value = '模式切換逾時（Shioaji 重新連線中），請稍後再試'
      } else {
        modeError.value = e.response?.data?.error || e.message || '模式切換失敗'
      }
      console.error('Failed to switch mode:', e)
    } finally {
      modeSwitching.value = false
      await fetchMode()
    }
  }

  // Fetch initial mode on store creation
  fetchMode()

  return {
    isSimulation, modeConnected, modeSwitching, modeError,
    fetchMode, switchMode,
  }
})
