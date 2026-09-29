export type DataQuality = 'actual' | 'proxy' | 'unavailable'

export interface FunnelSector {
  name: string
  stockCount: number
  avgChange: number
  totalTurnover: number
  up: boolean
  isTheme: boolean
  codes: string[]
}

export interface Layer2Filters {
  pe_max: number
  pb_max: number
  mom_pct_min: number
  yoy_pct_min: number
  inst_net_min: number | null
}

export interface FunnelStock {
  code: string
  name: string
  exchange: 'TSE' | 'OTC'
  sector: string
  price: number
  changePercent: number
  pe: number
  pb: number
  dividendYield: number
  momPct: number | null
  yoyPct: number | null
  instNet: number | null
  volume: number
  turnover: number
}

export interface TechnicalResult {
  code: string
  ma5: number
  ma10: number
  ma20: number
  maAligned: boolean
  volumeBreakout: boolean
  rsi14: number
  kd_k: number
  kd_d: number
  macd: number
  score: number
}

// ── 政策情報 ───────────────────────────────────────────────────
export interface PolicyNewsItem {
  source: 'anue_keyword' | 'ey_gov'
  source_label: string
  title: string
  date: string   // 'YYYY-MM-DD' 或空字串
  url: string
}

export interface PolicyNewsResponse {
  items: PolicyNewsItem[]
  fetched_at: string
  sources: {
    anue_keywords: number
    ey_gov: number
  }
}

// ── 政府預算 ───────────────────────────────────────────────────
export interface BudgetRow {
  name: string
  this_yr: number | null
  last_yr: number | null
  yoy_pct: number | null
  tag: string
}

export interface BudgetDataset {
  id: string
  title: string
  modified: string
  resources: { format: string; url: string; name: string }[]
}

export interface BudgetResponse {
  datasets: BudgetDataset[]
  rows: BudgetRow[]
  parsed: boolean
  fetched_at: string
  source: string
}

export type FilterPreset = 'conservative' | 'aggressive'

export const FILTER_PRESETS: Record<FilterPreset, Layer2Filters> = {
  conservative: {
    pe_max: 20,
    pb_max: 3,
    mom_pct_min: 0,
    yoy_pct_min: 0,
    inst_net_min: 0,
  },
  aggressive: {
    pe_max: 30,
    pb_max: 5,
    mom_pct_min: 5,
    yoy_pct_min: 10,
    inst_net_min: null,
  },
}
