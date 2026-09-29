import { computed, onMounted } from 'vue'
import api from '@/api'
import type { TradeRecord } from '@/types/account'
import { useAsyncData } from '@/composables/useAsyncData'

/**
 * 交易歷史紀錄的資料獲取 composable。
 *
 * 從後端 `/account/trades/` 取得當日券商成交紀錄，
 * 並將原始 API 資料映射為 `TradeRecord` 型別。
 * 元件掛載時（`onMounted`）會自動觸發資料載入。
 *
 * **注意**：此 API 為「當日券商成交明細」（Shioaji `list_trades`）。
 * - `fee` / `tax`：後端以台股標準公式估算（手續費 0.1425%、證交稅賣出 0.3%）
 * - `pnl`：在此語境無法提供（需配對買賣才能算已實現損益）；請至
 *   `/bookkeeper/report/` 或 `/bookkeeper/trades/` 取得 Pipeline 成交 pnl。
 */
interface TradeApiRow {
  time?: string
  code?: string
  name?: string
  side: 'buy' | 'sell'
  price?: number
  shares?: number
  fee?: number
  tax?: number
}

export function useHistoryData() {
  const { data, loading, error, execute } = useAsyncData<TradeRecord[]>(
    async () => {
      const res = await api.get<TradeApiRow[]>('/account/trades/')
      return res.data.map((t) => ({
        date: t.time?.slice(0, 10) ?? '',
        time: t.time ?? '',
        code: t.code ?? '',
        name: t.name ?? '',
        side: t.side,
        price: t.price ?? 0,
        shares: t.shares ?? 0,
        fee: t.fee ?? 0,
        tax: t.tax ?? 0,
        pnl: null,
      }))
    },
    { initialData: [], errorMessage: '無法載入交易紀錄' },
  )

  const trades = computed(() => data.value ?? [])

  onMounted(execute)

  return {
    trades,
    loading,
    error,
    isDummy: false,
  }
}
