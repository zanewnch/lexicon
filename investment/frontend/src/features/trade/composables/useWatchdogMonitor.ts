import { computed, ref } from 'vue'
import api from '@/api'
import type { ExitSignal, Position } from '@/types/trading'

export interface WatchlistQuote {
  code: string
  name: string
  price: number
  change: number
  percent: number
  volume: number
  up: boolean
}

export interface MonitoredPosition {
  position: Position
  name: string | null
  currentPrice: number | null
  changePct: number | null
  distanceToStopLoss: number | null
  distanceToTakeProfit: number | null
  risk: 'safe' | 'near-tp' | 'near-sl' | 'triggered-tp' | 'triggered-sl'
}

const NEAR_THRESHOLD = 2

export function useWatchdogMonitor() {
  const positions = ref<Position[]>([])
  const quotes = ref<Record<string, WatchlistQuote>>({})
  const signals = ref<ExitSignal[]>([])
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  const lastRefreshedAt = ref<Date | null>(null)

  const stopLossPct = ref<number>(-5)
  const takeProfitPct = ref<number>(10)

  async function refresh() {
    loading.value = true
    lastError.value = null
    try {
      const [posRes, sigRes] = await Promise.all([
        api.get<Position[]>('/trader/positions/'),
        api.get<ExitSignal[]>('/watchdog/exit-signals/', { params: { all: 1 } }),
      ])
      positions.value = posRes.data
      signals.value = sigRes.data

      const symbols = Array.from(new Set(posRes.data.map((p) => p.symbol)))
      if (symbols.length) {
        const quoteRes = await api.get<WatchlistQuote[]>('/watchlist/', {
          params: { codes: symbols.join(',') },
        })
        const map: Record<string, WatchlistQuote> = {}
        for (const q of quoteRes.data) map[q.code] = q
        quotes.value = map
      } else {
        quotes.value = {}
      }
      lastRefreshedAt.value = new Date()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      lastError.value = err.response?.data?.error || err.message || '載入失敗'
    } finally {
      loading.value = false
    }
  }

  const monitored = computed<MonitoredPosition[]>(() =>
    positions.value.map((p) => {
      const quote = quotes.value[p.symbol]
      const currentPrice = quote?.price ?? null
      const changePct =
        currentPrice != null && p.avgCost > 0
          ? ((currentPrice - p.avgCost) / p.avgCost) * 100
          : null

      let distSL: number | null = null
      let distTP: number | null = null
      let risk: MonitoredPosition['risk'] = 'safe'
      if (changePct != null) {
        distSL = changePct - stopLossPct.value
        distTP = takeProfitPct.value - changePct
        if (changePct <= stopLossPct.value) risk = 'triggered-sl'
        else if (changePct >= takeProfitPct.value) risk = 'triggered-tp'
        else if (distSL <= NEAR_THRESHOLD) risk = 'near-sl'
        else if (distTP <= NEAR_THRESHOLD) risk = 'near-tp'
      }

      return {
        position: p,
        name: quote?.name ?? null,
        currentPrice,
        changePct,
        distanceToStopLoss: distSL,
        distanceToTakeProfit: distTP,
        risk,
      }
    }),
  )

  const pendingSignals = computed(() => signals.value.filter((s) => !s.processed))
  const historicalSignals = computed(() => signals.value.filter((s) => s.processed))

  return {
    positions,
    quotes,
    signals,
    monitored,
    pendingSignals,
    historicalSignals,
    loading,
    lastError,
    lastRefreshedAt,
    stopLossPct,
    takeProfitPct,
    refresh,
  }
}
