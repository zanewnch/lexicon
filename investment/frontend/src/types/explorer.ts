export interface StockListItem {
  code: string
  name: string
  exchange: 'TSE' | 'OTC'
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  turnover: number
  open: number
  high: number
  low: number
  prevClose: number
  pe: number
  pb: number
  dividendYield: number
}

export interface StockListResponse {
  total: number
  data: StockListItem[]
}

export interface TreemapItem {
  code: string
  name: string
  sector: string
  exchange: string
  price: number
  changePercent: number
  turnover: number
}

export interface SectorSummary {
  name: string
  stockCount: number
  avgChange: number
  totalTurnover: number
  up: boolean
  topGainers: { code: string; name: string; changePercent: number }[]
  topLosers: { code: string; name: string; changePercent: number }[]
  stocks: { code: string; name: string; changePercent: number; price: number; volume: number }[]
}

export type RankingType = 'yield' | 'pe_low' | 'pe_high' | 'volume' | 'gainers' | 'losers' | 'turnover'
