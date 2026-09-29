// DUMMY DATA — All values below are simulated for UI prototyping.
// TODO: Replace each section with a real API call when backend is ready.
// Search for *.dummy.ts to find all dummy data files.

import type {
  MarketIndex,
  PortfolioSummary,
  StockQuote,
  RankItem,
  Holding,
  Trade,
  NewsItem,
  SectorPerformance,
} from '@/types/market'

// TODO: replace with GET /api/indices
export const dummyIndices: MarketIndex[] = [
  {
    name: '加權指數',
    value: '22,856.72',
    change: '+185.32',
    percent: '+0.82%',
    up: true,
    spark: [22671, 22690, 22720, 22685, 22710, 22745, 22730, 22760, 22790, 22775, 22800, 22820, 22810, 22835, 22850, 22840, 22857],
  },
  {
    name: '櫃買指數',
    value: '248.63',
    change: '-1.24',
    percent: '-0.50%',
    up: false,
    spark: [249.87, 249.90, 250.10, 249.75, 249.50, 249.30, 249.60, 249.20, 249.00, 248.80, 249.10, 248.70, 248.50, 248.80, 248.60, 248.70, 248.63],
  },
  {
    name: '台指近',
    value: '22,880.00',
    change: '+200.00',
    percent: '+0.88%',
    up: true,
    spark: [22680, 22700, 22735, 22695, 22730, 22770, 22750, 22785, 22810, 22795, 22830, 22850, 22835, 22860, 22875, 22870, 22880],
  },
  {
    name: '金融類指數',
    value: '1,832.15',
    change: '+5.68',
    percent: '+0.31%',
    up: true,
    spark: [1826, 1827, 1828, 1826, 1829, 1830, 1828, 1831, 1829, 1830, 1832, 1831, 1830, 1833, 1832, 1831, 1832],
  },
]

// TODO: replace with GET /api/account/portfolio/summary
export const dummyPortfolio: PortfolioSummary = {
  totalValue: 3_258_400,
  totalCost: 2_980_000,
  todayPnl: 28_650,
  todayPercent: 0.89,
  unrealizedPnl: 278_400,
  unrealizedPercent: 9.34,
}

// TODO: replace with GET /api/account/watchlist
export const dummyWatchlist: StockQuote[] = [
  { code: '2330', name: '台積電', price: 985, change: 15, percent: 1.55, volume: 28_432, up: true },
  { code: '2317', name: '鴻海', price: 178.5, change: 3.5, percent: 2.0, volume: 45_120, up: true },
  { code: '2454', name: '聯發科', price: 1280, change: -20, percent: -1.54, volume: 8_765, up: false },
  { code: '2881', name: '富邦金', price: 85.2, change: 0.8, percent: 0.95, volume: 32_100, up: true },
  { code: '3008', name: '大立光', price: 2350, change: -35, percent: -1.47, volume: 1_240, up: false },
  { code: '2603', name: '長榮', price: 168, change: 5.5, percent: 3.39, volume: 62_300, up: true },
  { code: '2412', name: '中華電', price: 132.5, change: -0.5, percent: -0.38, volume: 12_800, up: false },
  { code: '3711', name: '日月光投控', price: 158, change: 4, percent: 2.6, volume: 18_500, up: true },
]

// TODO: replace with GET /api/market/movers?type=gainers&limit=5
export const dummyTopGainers: RankItem[] = [
  { code: '3661', name: '世芯-KY', percent: 9.82 },
  { code: '6547', name: '高端疫苗', percent: 8.45 },
  { code: '3443', name: '創意', percent: 7.12 },
  { code: '6488', name: '環球晶', percent: 6.88 },
  { code: '3034', name: '聯詠', percent: 5.96 },
]

// TODO: replace with GET /api/market/movers?type=losers&limit=5
export const dummyTopLosers: RankItem[] = [
  { code: '2609', name: '陽明', percent: -6.24 },
  { code: '2615', name: '萬海', percent: -5.78 },
  { code: '2303', name: '聯電', percent: -4.32 },
  { code: '5871', name: '中租-KY', percent: -3.95 },
  { code: '2382', name: '廣達', percent: -3.41 },
]

// TODO: replace with GET /api/account/holdings
export const dummyHoldings: Holding[] = [
  { code: '2330', name: '台積電', shares: 2000, avgCost: 920, current: 985, pnl: 130_000, pnlPercent: 7.07 },
  { code: '2317', name: '鴻海', shares: 5000, avgCost: 165, current: 178.5, pnl: 67_500, pnlPercent: 8.18 },
  { code: '2454', name: '聯發科', shares: 500, avgCost: 1200, current: 1280, pnl: 40_000, pnlPercent: 6.67 },
  { code: '2881', name: '富邦金', shares: 3000, avgCost: 78, current: 85.2, pnl: 21_600, pnlPercent: 9.23 },
  { code: '2603', name: '長榮', shares: 3000, avgCost: 175, current: 168, pnl: -21_000, pnlPercent: -4.0 },
]

// TODO: replace with GET /api/account/trades?limit=3
export const dummyRecentTrades: Trade[] = [
  { time: '13:22:05', code: '2330', name: '台積電', side: 'buy', price: 982, shares: 1000, status: '已成交' },
  { time: '11:05:30', code: '2603', name: '長榮', side: 'sell', price: 170, shares: 2000, status: '已成交' },
  { time: '09:12:18', code: '2881', name: '富邦金', side: 'buy', price: 84.5, shares: 3000, status: '已成交' },
]

// TODO: replace with GET /api/news/?limit=6
export const dummyNews: NewsItem[] = [
  { id: '1', title: '台積電法說會後股價走揚，外資連續買超三日', summary: '台積電今日法說會釋出正面展望，帶動股價上漲...', date: '2026-03-08', time: '14:30', source: 'anue', category: '台股新聞', keywords: ['台積電', '法說會'], stocks: ['2330'], url: '#' },
  { id: '2', title: '美國聯準會維持利率不變，市場反應正面', summary: '聯準會宣布維持基準利率不變，符合市場預期...', date: '2026-03-08', time: '13:15', source: 'ettoday', category: '財經', keywords: ['聯準會', '利率'], stocks: [], url: '#' },
  { id: '3', title: '半導體設備訂單回溫，供應鏈全面受惠', summary: '半導體設備商近期訂單明顯回溫，業界看好下半年展望...', date: '2026-03-08', time: '11:45', source: 'anue', category: '台股新聞', keywords: ['半導體', 'AI'], stocks: ['2330', '2454'], url: '#' },
  { id: '4', title: 'AI 概念股持續走強，半導體族群領漲大盤', summary: 'AI 相關概念股持續獲得資金追捧，帶動大盤走高...', date: '2026-03-08', time: '10:20', source: 'anue', category: '台股新聞', keywords: ['AI', '半導體'], stocks: [], url: '#' },
  { id: '5', title: '台股開高走高，外資期貨多單增加', summary: '台股今日開高走高，外資於期貨市場增加多單部位...', date: '2026-03-08', time: '09:30', source: 'ettoday', category: '財經', keywords: ['台股', '外資'], stocks: [], url: '#' },
  { id: '6', title: '亞股普遍開高，日經指數上漲逾 1%', summary: '受美股收高影響，亞洲主要股市今日普遍開高...', date: '2026-03-08', time: '09:05', source: 'ettoday', category: '財經', keywords: ['亞股', '日經'], stocks: [], url: '#' },
]

// TODO: replace with GET /api/sectors/performance
export const dummySectorPerformance: SectorPerformance[] = [
  { name: '半導體', percent: 2.35, up: true },
  { name: '電子零組件', percent: 1.82, up: true },
  { name: '光電', percent: 0.95, up: true },
  { name: '金融保險', percent: 0.31, up: true },
  { name: '食品', percent: -0.12, up: false },
  { name: '航運', percent: -1.85, up: false },
  { name: '鋼鐵', percent: -2.14, up: false },
  { name: '營建', percent: 0.56, up: true },
]
