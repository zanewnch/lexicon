// 選股 → 週期 → 進場時機 → 部位風控 pipeline 共用型別

export type TimeframePreset = 'short' | 'mid' | 'long' | 'custom'

export type SignalKey = 'ma_cross' | 'macd' | 'kd' | 'breakout'

export type TriggerMode = 'all' | 'any'

export interface PipelineStock {
  symbol: string
  name?: string
  score?: number
}

export interface TimeframeState {
  preset: TimeframePreset
  days: number
}

export interface EntryParams {
  ma_short: number
  ma_long: number
  macd_fast: number
  macd_slow: number
  macd_signal: number
  kd_period: number
  breakout_lookback: number
}

export interface EntryState {
  signals: SignalKey[]
  params: EntryParams
  triggerMode: TriggerMode
}

export interface SizingState {
  capital: number
  perStockPct: number
  maxPositions: number
  stopLossPct: number
  takeProfitPct: number
}

export type PipelineStep = 1 | 2 | 3 | 4

export interface PipelineState {
  step: PipelineStep
  selected: PipelineStock[]
  timeframe: TimeframeState
  entry: EntryState
  sizing: SizingState
}

export interface MatchResultItem {
  symbol: string
  signalsHit: SignalKey[]
  matched: boolean
  lastPrice: number | null
}

export interface MatchResponse {
  results: MatchResultItem[]
  matchedCount: number
  totalCount: number
}

export interface CommitRequestItem {
  symbol: string
  shares: number
  estimatedPrice: number
  stopLossPrice: number
  takeProfitPrice: number
}

export interface CommitResponse {
  candidateIds: number[]
  count: number
}

// ---- 預設值 ----

export const TIMEFRAME_PRESETS: Record<Exclude<TimeframePreset, 'custom'>, {
  days: number
  label: string
  description: string
  params: EntryParams
}> = {
  short: {
    days: 14,
    label: '短線',
    description: '7~20 天，適合日內到數週的波動操作',
    params: {
      ma_short: 5, ma_long: 20,
      macd_fast: 6, macd_slow: 13, macd_signal: 5,
      kd_period: 9, breakout_lookback: 10,
    },
  },
  mid: {
    days: 60,
    label: '波段',
    description: '1~3 個月，跟隨中期趨勢',
    params: {
      ma_short: 20, ma_long: 60,
      macd_fast: 12, macd_slow: 26, macd_signal: 9,
      kd_period: 14, breakout_lookback: 30,
    },
  },
  long: {
    days: 180,
    label: '中長線',
    description: '3 個月以上，季線格局',
    params: {
      ma_short: 60, ma_long: 240,
      macd_fast: 26, macd_slow: 52, macd_signal: 18,
      kd_period: 21, breakout_lookback: 60,
    },
  },
}

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  ma_cross: '均線黃金交叉',
  macd: 'MACD 翻紅',
  kd: 'KD 低檔黃金交叉',
  breakout: '突破 N 日新高',
}

export const DEFAULT_PIPELINE_STATE: PipelineState = {
  step: 1,
  selected: [],
  timeframe: { preset: 'mid', days: TIMEFRAME_PRESETS.mid.days },
  entry: {
    signals: ['ma_cross'],
    params: { ...TIMEFRAME_PRESETS.mid.params },
    triggerMode: 'all',
  },
  sizing: {
    capital: 1_000_000,
    perStockPct: 20,
    maxPositions: 5,
    stopLossPct: 8,
    takeProfitPct: 20,
  },
}
