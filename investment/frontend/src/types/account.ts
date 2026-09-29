// Account-related types extracted from dummy data files for centralized type management.

export interface PortfolioSummaryFull {
  totalValue: number
  totalCost: number
  unrealizedPnl: number
  unrealizedPercent: number
  todayPnl: number
  todayPercent: number
  cashBalance: number
  totalAssets: number
}

export interface HoldingDetail {
  code: string
  name: string
  shares: number
  avgCost: number
  current: number
  pnl: number
  pnlPercent: number
  weight: number
  todayPnl: number
}

export interface AllocationItem {
  sector: string
  weight: number
  value: number
  color: string
}

export interface DividendRecord {
  date: string
  code: string
  name: string
  type: string
  amount: number
  shares: number
  total: number
  status: string
}

export interface TradeQuote {
  code: string
  name: string
  price: number
  change: number
  percent: number
  up: boolean
  high: number
  low: number
  open: number
  prevClose: number
  volume: number
  limitUp: number
  limitDown: number
}

export interface TradeOrderBook {
  asks: { price: number; volume: number }[]
  bids: { price: number; volume: number }[]
}

export interface Order {
  id: string
  time: string
  code: string
  name: string
  side: 'buy' | 'sell'
  type: '市價' | '限價'
  price: number
  shares: number
  filled: number
  status: string
  cancelable: boolean
}

export interface BrokerOrderRecord {
  orderId: string
  time: string
  code: string
  name: string
  side: 'buy' | 'sell'
  orderType: '市價' | '限價'
  price: number
  shares: number
  filledShares: number
  status: string
  cancelable: boolean
}

export interface AccountBalance {
  cashBalance: number
  buyingPower: number
  marginUsed: number
}

export interface TradeRecord {
  date: string
  time: string
  code: string
  name: string
  side: 'buy' | 'sell'
  price: number
  shares: number
  fee: number
  tax: number
  pnl: number | null
}
