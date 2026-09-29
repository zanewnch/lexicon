// Strategy types — mirrors backend JSON structure

export type ConditionType =
  | 'price_above'
  | 'price_below'
  | 'price_change_pct'
  | 'price_above_ma'
  | 'price_below_ma'
  | 'volume_surge'
  | 'institutional_consecutive_buy'
  | 'institutional_consecutive_sell'

export interface StrategyCondition {
  type: ConditionType
  params: Record<string, number | string>
}

export type CombineLogic = 'AND' | 'OR'
export type StrategyAction = 'notify'

export type StrategyPeriod = 'intraday' | 'short' | 'swing' | 'long'

export const PERIOD_META: Record<StrategyPeriod, { label: string; hint: string }> = {
  intraday: { label: '當沖', hint: '數小時～1日 · 日K + 5/15分K' },
  short:    { label: '短線', hint: '2~10日 · 週K + 日K' },
  swing:    { label: '波段', hint: '2週~3個月 · 月K + 週K/日K' },
  long:     { label: '長線', hint: '半年以上 · 季K + 月K' },
}

export interface Strategy {
  id: string
  name: string
  description: string
  enabled: boolean
  targets: string[]
  period: StrategyPeriod | null
  conditions: StrategyCondition[]
  logic: CombineLogic
  action: StrategyAction
  created_at: string
  updated_at: string
  last_triggered_at: string | null
  trigger_count: number
}

export interface StrategyPayload {
  name: string
  description?: string
  enabled?: boolean
  targets: string[]
  period?: StrategyPeriod | null
  conditions: StrategyCondition[]
  logic?: CombineLogic
  action?: StrategyAction
}

/** Human-readable labels for condition types */
export const CONDITION_LABELS: Record<ConditionType, string> = {
  price_above: '股價高於',
  price_below: '股價低於',
  price_change_pct: '漲跌幅超過',
  price_above_ma: '股價突破均線',
  price_below_ma: '股價跌破均線',
  volume_surge: '量能放大',
  institutional_consecutive_buy: '法人連續買超',
  institutional_consecutive_sell: '法人連續賣超',
}

/** Parameter definitions for each condition type */
export const CONDITION_PARAMS: Record<ConditionType, { key: string; label: string; type: 'number' | 'select'; options?: { value: string | number; label: string }[] }[]> = {
  price_above: [
    { key: 'price', label: '目標價', type: 'number' },
  ],
  price_below: [
    { key: 'price', label: '目標價', type: 'number' },
  ],
  price_change_pct: [
    { key: 'pct', label: '百分比 (%)', type: 'number' },
  ],
  price_above_ma: [
    { key: 'period', label: '均線週期', type: 'select', options: [
      { value: 5, label: 'MA5' },
      { value: 10, label: 'MA10' },
      { value: 20, label: 'MA20 (月線)' },
      { value: 60, label: 'MA60 (季線)' },
    ]},
  ],
  price_below_ma: [
    { key: 'period', label: '均線週期', type: 'select', options: [
      { value: 5, label: 'MA5' },
      { value: 10, label: 'MA10' },
      { value: 20, label: 'MA20 (月線)' },
      { value: 60, label: 'MA60 (季線)' },
    ]},
  ],
  volume_surge: [
    { key: 'period', label: '均量天數', type: 'number' },
    { key: 'multiplier', label: '倍數', type: 'number' },
  ],
  institutional_consecutive_buy: [
    { key: 'investor', label: '法人類型', type: 'select', options: [
      { value: 'foreign', label: '外資' },
      { value: 'trust', label: '投信' },
      { value: 'dealer', label: '自營商' },
    ]},
    { key: 'days', label: '連續天數', type: 'number' },
  ],
  institutional_consecutive_sell: [
    { key: 'investor', label: '法人類型', type: 'select', options: [
      { value: 'foreign', label: '外資' },
      { value: 'trust', label: '投信' },
      { value: 'dealer', label: '自營商' },
    ]},
    { key: 'days', label: '連續天數', type: 'number' },
  ],
}
