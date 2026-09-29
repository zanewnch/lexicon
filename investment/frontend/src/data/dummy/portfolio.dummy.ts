// DUMMY DATA — All values below are simulated for UI prototyping.
// TODO: Replace each section with a real API call when backend is ready.

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
  weight: number
  pnl: number
  pnlPercent: number
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

// TODO: replace with GET /api/account/portfolio/summary
export const dummyPortfolioSummary: PortfolioSummaryFull = {
  totalValue: 3_258_400,
  totalCost: 2_980_000,
  unrealizedPnl: 278_400,
  unrealizedPercent: 9.34,
  todayPnl: 28_650,
  todayPercent: 0.89,
  cashBalance: 1_245_600,
  totalAssets: 4_504_000,
}

// TODO: replace with GET /api/account/portfolio/trend?days=30
export const dummyPortfolioTrend: number[] = [
  3_050_000, 3_080_000, 3_020_000, 3_100_000, 3_060_000, 3_120_000, 3_090_000,
  3_150_000, 3_130_000, 3_180_000, 3_160_000, 3_200_000, 3_170_000, 3_220_000,
  3_190_000, 3_240_000, 3_210_000, 3_260_000, 3_230_000, 3_270_000, 3_250_000,
  3_200_000, 3_180_000, 3_220_000, 3_240_000, 3_210_000, 3_250_000, 3_230_000,
  3_260_000, 3_258_400,
]

// TODO: replace with GET /api/account/holdings
export const dummyHoldingDetails: HoldingDetail[] = [
  { code: '2330', name: '台積電', shares: 2000, avgCost: 920, current: 985, weight: 60.4, pnl: 130_000, pnlPercent: 7.07, todayPnl: 30_000 },
  { code: '2317', name: '鴻海', shares: 5000, avgCost: 165, current: 178.5, weight: 27.4, pnl: 67_500, pnlPercent: 8.18, todayPnl: 17_500 },
  { code: '2454', name: '聯發科', shares: 500, avgCost: 1200, current: 1280, weight: 19.6, pnl: 40_000, pnlPercent: 6.67, todayPnl: -10_000 },
  { code: '2881', name: '富邦金', shares: 3000, avgCost: 78, current: 85.2, weight: 7.8, pnl: 21_600, pnlPercent: 9.23, todayPnl: 2_400 },
  { code: '2603', name: '長榮', shares: 3000, avgCost: 175, current: 168, weight: 15.5, pnl: -21_000, pnlPercent: -4.0, todayPnl: 16_500 },
  { code: '2412', name: '中華電', shares: 2000, avgCost: 128, current: 132.5, weight: 8.1, pnl: 9_000, pnlPercent: 3.52, todayPnl: -1_000 },
]

// TODO: replace with GET /api/account/allocation
export const dummyAllocation: AllocationItem[] = [
  { sector: '半導體', weight: 55.2, value: 1_798_400, color: '#3b82f6' },
  { sector: '電子代工', weight: 18.3, value: 596_300, color: '#22c55e' },
  { sector: '金融', weight: 10.5, value: 342_000, color: '#f59e0b' },
  { sector: '航運', weight: 8.8, value: 286_700, color: '#ef4444' },
  { sector: '電信', weight: 7.2, value: 235_000, color: '#8b5cf6' },
]

// TODO: replace with GET /api/account/dividends
export const dummyDividends: DividendRecord[] = [
  { date: '2025/09/15', code: '2330', name: '台積電', type: '現金', amount: 3.5, shares: 2000, total: 7_000, status: '已發放' },
  { date: '2025/06/20', code: '2330', name: '台積電', type: '現金', amount: 3.0, shares: 2000, total: 6_000, status: '已發放' },
  { date: '2025/08/10', code: '2881', name: '富邦金', type: '現金', amount: 2.5, shares: 3000, total: 7_500, status: '已發放' },
  { date: '2025/07/25', code: '2412', name: '中華電', type: '現金', amount: 4.7, shares: 2000, total: 9_400, status: '已發放' },
  { date: '2026/06/20', code: '2330', name: '台積電', type: '現金', amount: 3.5, shares: 2000, total: 7_000, status: '預計' },
  { date: '2026/08/10', code: '2881', name: '富邦金', type: '現金', amount: 2.8, shares: 3000, total: 8_400, status: '預計' },
]
