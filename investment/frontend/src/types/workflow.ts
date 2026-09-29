export type KanbanColumn = 'watchlist' | 'analyzing' | 'active' | 'closed'

export interface KanbanCard {
  id: string
  code: string
  name: string
  sector: string
  column: KanbanColumn
  note: string
  linkedNoteId?: string
  entryPrice?: number
  exitPrice?: number
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  note: string
}

export interface ChecklistSession {
  id: string
  stockCode: string
  stockName: string
  items: ChecklistItem[]
  expectedScenario: string
  stopLoss: number | null
  positionSizePct: number | null
  createdAt: string
  passed: boolean
}

export type TradeEmotion = '冷靜執行' | '興奮追高' | '恐懼跟風' | '其他'
export type TradeResult = 'win' | 'loss' | 'breakeven' | 'active'
export type TradeStrategy = 'value' | 'swing' | 'daytrade' | 'event' | 'other'

export interface TradeRecord {
  id: string
  code: string
  name: string
  entryDate: string
  exitDate?: string
  entryPrice: number
  exitPrice?: number
  shares: number
  entryReason: string
  emotion: TradeEmotion
  exitReason?: string
  result: TradeResult
  strategy?: TradeStrategy
  pnlPct?: number
  linkedNoteId?: string
  createdAt: string
}

export interface StrategyPerformance {
  strategy: TradeStrategy
  totalTrades: number
  closedTrades: number
  wins: number
  losses: number
  winRate: number
  avgWinPct: number
  avgLossPct: number
  expectancy: number
  totalPnl: number
}

export interface ExpectancyStats {
  totalTrades: number
  closedTrades: number
  wins: number
  losses: number
  winRate: number
  avgWinPct: number
  avgLossPct: number
  profitFactor: number
  avgHoldingDays: number
  totalRealizedPnl: number
  expectancy: number
  maxConsecutiveLosses: number
  bestTrade: TradeRecord | null
  worstTrade: TradeRecord | null
  byStrategy: StrategyPerformance[]
}

export const DEFAULT_CHECKLIST_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'c1', label: '趨勢：大盤目前是多頭還是空頭？', note: '' },
  { id: 'c2', label: '產業：這檔股票屬於當季熱點嗎？', note: '' },
  { id: 'c3', label: '基本面：營收 YoY 是否大於 0%？', note: '' },
  { id: 'c4', label: '技術面：股價是否在均線之上？', note: '' },
  { id: 'c5', label: '風險：停損點設好了嗎？', note: '' },
]

export const COLUMN_LABELS: Record<KanbanColumn, string> = {
  watchlist: '口袋名單',
  analyzing: '分析中',
  active: '已進場',
  closed: '已出場',
}

export const COLUMN_ORDER: KanbanColumn[] = ['watchlist', 'analyzing', 'active', 'closed']

export const EMOTION_OPTIONS: TradeEmotion[] = ['冷靜執行', '興奮追高', '恐懼跟風', '其他']

export const RESULT_LABELS: Record<TradeResult, string> = {
  win: '獲利',
  loss: '虧損',
  breakeven: '平手',
  active: '持倉中',
}

export const STRATEGY_LABELS: Record<TradeStrategy, string> = {
  value: '穩健派',
  swing: '波段',
  daytrade: '當沖',
  event: '事件驅動',
  other: '其他',
}

export const STRATEGY_OPTIONS: TradeStrategy[] = ['value', 'swing', 'daytrade', 'event', 'other']
