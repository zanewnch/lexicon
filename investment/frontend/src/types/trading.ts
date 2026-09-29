// Trading pipeline types — mirror backend trading_core.models

export type Side = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'pending' | 'submitted' | 'partially_filled' | 'filled' | 'cancelled' | 'failed'
export type TradingVenue = 'paper' | 'broker_simulation' | 'broker_production'
export type PositionStatus = 'open' | 'closed'
export type ExitReason = 'stop_loss' | 'take_profit' | 'manual'

export interface Candidate {
  id: number
  symbol: string
  score: number | null
  meta: Record<string, unknown>
  createdAt: string
  consumed: boolean
}

export interface Position {
  id: number
  symbol: string
  qty: number
  avgCost: number
  venue: TradingVenue
  status: PositionStatus
  openedAt: string
  closedAt: string | null
}

export interface ExitSignal {
  id: number
  positionId: number
  symbol: string
  reason: ExitReason
  triggeredPrice: number
  triggeredAt: string
  processed: boolean
  note: string
  venue: TradingVenue
}

export interface Trade {
  id: number
  symbol: string
  side: Side
  qty: number
  price: number
  executedAt: string | null
  pnl: number | null
  venue: TradingVenue
}

export interface BookkeeperReport {
  venue: TradingVenue
  totalTrades: number
  closedTrades: number
  wins: number
  losses: number
  winRate: number
  totalPnl: number
  avgWin: number
  avgLoss: number
  expectancy: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  sharpe: number
  sortino: number
  maxDrawdown: number
  maxDrawdownPct: number
  calmar: number
  equityCurve: { ts: string | null; equity: number }[]
}

export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  stop_loss: '停損',
  take_profit: '停利',
  manual: '手動',
}

export const SIDE_LABELS: Record<Side, string> = {
  buy: '買進',
  sell: '賣出',
}
