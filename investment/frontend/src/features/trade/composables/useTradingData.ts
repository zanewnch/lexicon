import { ref } from 'vue'
import api from '@/api'
import type {
  BookkeeperReport,
  Candidate,
  ExitSignal,
  Position,
  Trade,
  TradingVenue,
} from '@/types/trading'

/**
 * Trading pipeline 資料 composable。
 *
 * 對應後端五個獨立 Django apps：
 *   - scanner     : 選股階段（Candidate）
 *   - trader      : 進場階段（Position）
 *   - watchdog    : 監控階段（ExitSignal）
 *   - exiter      : 出場階段（觸發後寫入 Trade）
 *   - bookkeeper  : 復盤階段（Trade、報表）
 *
 * 提供載入、刷新與各階段的執行 API。
 */
export function useTradingData() {
  const venue = ref<TradingVenue>('paper')
  const candidates = ref<Candidate[]>([])
  const positions = ref<Position[]>([])
  const signals = ref<ExitSignal[]>([])
  const trades = ref<Trade[]>([])
  const report = ref<BookkeeperReport | null>(null)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  async function refreshAll() {
    loading.value = true
    lastError.value = null
    try {
      const [c, p, s, t, r] = await Promise.all([
        api.get<Candidate[]>('/scanner/candidates/'),
        api.get<Position[]>('/trader/positions/', { params: { venue: venue.value } }),
        api.get<ExitSignal[]>('/watchdog/exit-signals/', { params: { venue: venue.value } }),
        api.get<Trade[]>('/bookkeeper/trades/', { params: { venue: venue.value } }),
        api.get<BookkeeperReport>('/bookkeeper/report/', { params: { venue: venue.value } }),
      ])
      candidates.value = c.data
      positions.value = p.data
      signals.value = s.data
      trades.value = t.data
      report.value = r.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      lastError.value = err.response?.data?.error || err.message || '載入失敗'
    } finally {
      loading.value = false
    }
  }

  async function runScanner(symbols: string[]) {
    return api.post('/scanner/run/', { symbols })
  }

  async function runScannerFunnel(funnel: {
    codes: string[]
    filters?: Record<string, number>
    topN?: number
    minScore?: number
  }) {
    return api.post('/scanner/run/', { funnel })
  }

  async function runTrader(
    capital: number,
    prices: Record<string, number>,
    live = false,
    tradePin = '',
    expectedVenue: TradingVenue = 'paper',
    candidateIds?: number[],
  ) {
    return api.post('/trader/execute/', { capital, prices, live, tradePin, expectedVenue, candidateIds })
  }

  async function runWatchdog(opts: {
    prices?: Record<string, number>
    stopLossPct?: number
    takeProfitPct?: number
    venue?: TradingVenue
  } = {}) {
    return api.post('/watchdog/check/', { ...opts, venue: opts.venue ?? venue.value })
  }

  async function runExiter(live = false, tradePin = '', expectedVenue: TradingVenue = 'paper') {
    return api.post('/exiter/execute/', { live, tradePin, expectedVenue })
  }

  return {
    candidates,
    positions,
    signals,
    trades,
    report,
    venue,
    loading,
    lastError,
    refreshAll,
    runScanner,
    runScannerFunnel,
    runTrader,
    runWatchdog,
    runExiter,
  }
}
