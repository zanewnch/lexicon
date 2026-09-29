// Shared TypeScript interfaces for market data.
// Both dummy data and real API responses must conform to these types.

export interface MarketIndex {
  name: string
  value: string
  change: string
  percent: string
  up: boolean
  spark: number[]
}

export interface MarketSignal {
  id: string
  label: string
  description: string
  severity: 'up' | 'down' | 'warn' | 'info'
}

export interface PortfolioSummary {
  totalValue: number | null
  totalCost: number
  totalAssets?: number | null
  accBalance?: number | null
  todayPnl: number | null
  todayPercent: number | null
  unrealizedPnl: number | null
  unrealizedPercent: number | null
  simulation?: boolean
  valuationComplete?: boolean
}

export interface StockQuote {
  code: string
  name: string
  price: number
  change: number
  percent: number
  volume: number
  up: boolean
}

export interface RankItem {
  code: string
  name: string
  percent: number
}

export interface Holding {
  code: string
  name: string
  shares: number
  avgCost: number
  current: number | null
  pnl: number | null
  pnlPercent: number | null
}

export interface Trade {
  time: string
  code: string
  name: string
  side: 'buy' | 'sell'
  price: number
  shares: number
  status: string
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  date: string
  time: string
  source: 'anue' | 'ettoday'
  category: string
  keywords: string[]
  stocks: string[]
  url: string
}

export interface SectorPerformance {
  name: string
  percent: number
  up: boolean
}

export interface StockDetail {
  code: string
  name: string
  price: number
  change: number
  percent: number
  up: boolean
  open: number
  high: number
  low: number
  close: number
  volume: number
  prevClose: number
  amplitude: number
  turnover: number
  pe: number
  pb: number
  marketCap: number
  eps: number
  dividendYield: number
}

export interface KlineBar {
  ts: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OrderBookLevel {
  price: number
  volume: number
}

export interface OrderBook {
  asks: OrderBookLevel[]
  bids: OrderBookLevel[]
}

export interface Tick {
  time: string
  price: number
  volume: number
  up: boolean
}

export interface InstitutionalDay {
  date: string
  foreign: number
  trust: number
  dealer: number
}

export interface Technicals {
  ma5: number
  ma10: number
  ma20: number
  ma60: number
  rsi14: number
  kd_k: number
  kd_d: number
  macd: number
  signal: number
  histogram: number
}

export interface SectorQuote {
  name: string
  change: number
  up: boolean
  stocks: string[]
}

// ── 個股分析 ──

export type AnalysisCategory = 'fundamental' | 'technical' | 'trend' | 'volume'

export interface StockSignal extends MarketSignal {
  category: AnalysisCategory
}

export interface StockAnalysis {
  summary: {
    total: number
    bullish: number
    bearish: number
    neutral: number
    verdict: 'bullish' | 'bearish' | 'neutral'
  }
  signals: StockSignal[]
}
