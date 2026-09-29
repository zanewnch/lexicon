export type SortOrder = 'asc' | 'desc'

export type TradeSide = 'buy' | 'sell'

export interface CommandResult {
  success: boolean
  message: string
}
