// DUMMY DATA — All values below are simulated for UI prototyping.
// TODO: Replace each section with a real API call when backend is ready.
// Search for *.dummy.ts to find all dummy data files.

import type {
  StockDetail,
  OrderBook,
  Tick,
  InstitutionalDay,
  Technicals,
  SectorQuote,
} from '@/types/market'

// TODO: replace with GET /api/stock/:code
export const dummyStockDetail: StockDetail = {
  code: '2330',
  name: '台積電',
  price: 985,
  change: 15,
  percent: 1.55,
  up: true,
  open: 975,
  high: 988,
  low: 972,
  close: 985,
  volume: 28_432,
  prevClose: 970,
  amplitude: 1.65,
  turnover: 27_985_280_000,
  pe: 28.5,
  pb: 7.8,
  marketCap: 25_531_000_000_000,
  eps: 34.56,
  dividendYield: 1.62,
}

// TODO: replace with GET /api/stock/:code/kline?period=daily&limit=30
export const dummyKlineData: number[] = [
  945, 952, 948, 955, 960, 958, 962, 968, 965, 970,
  972, 968, 975, 978, 980, 976, 982, 979, 985, 988,
  984, 990, 986, 992, 988, 980, 975, 978, 982, 985,
]

// TODO: replace with WebSocket subscription to /ws/orderbook/:code
export const dummyOrderBook: OrderBook = {
  asks: [
    { price: 989, volume: 120 },
    { price: 988, volume: 85 },
    { price: 987, volume: 210 },
    { price: 986, volume: 156 },
    { price: 985, volume: 340 },
  ],
  bids: [
    { price: 984, volume: 280 },
    { price: 983, volume: 195 },
    { price: 982, volume: 310 },
    { price: 981, volume: 142 },
    { price: 980, volume: 225 },
  ],
}

// TODO: replace with WebSocket subscription to /ws/ticks/:code
export const dummyTicks: Tick[] = [
  { time: '13:30:00', price: 985, volume: 52, up: true },
  { time: '13:29:45', price: 984, volume: 28, up: false },
  { time: '13:29:30', price: 985, volume: 15, up: true },
  { time: '13:29:15', price: 984, volume: 33, up: false },
  { time: '13:29:00', price: 985, volume: 45, up: true },
  { time: '13:28:45', price: 986, volume: 18, up: true },
  { time: '13:28:30', price: 985, volume: 22, up: false },
  { time: '13:28:15', price: 984, volume: 67, up: false },
  { time: '13:28:00', price: 985, volume: 31, up: true },
  { time: '13:27:45', price: 983, volume: 42, up: false },
]

// TODO: replace with GET /api/stock/:code/institutional?days=5
export const dummyInstitutional: InstitutionalDay[] = [
  { date: '03/08', foreign: 12_500, trust: 3_200, dealer: -1_800 },
  { date: '03/07', foreign: 8_300, trust: -1_500, dealer: 2_100 },
  { date: '03/06', foreign: -5_200, trust: 4_800, dealer: -900 },
  { date: '03/05', foreign: 15_600, trust: 2_100, dealer: 1_300 },
  { date: '03/04', foreign: -3_400, trust: -800, dealer: -2_500 },
]

// TODO: replace with GET /api/stock/:code/technicals
export const dummyTechnicals: Technicals = {
  ma5: 982.4,
  ma10: 978.6,
  ma20: 972.3,
  ma60: 955.8,
  rsi14: 62.5,
  kd_k: 75.3,
  kd_d: 68.2,
  macd: 3.85,
  signal: 2.12,
  histogram: 1.73,
}

// TODO: replace with GET /api/sectors/quotes
export const dummySectorQuotes: SectorQuote[] = [
  { name: '半導體', change: 2.35, up: true, stocks: ['2330 台積電', '2454 聯發科', '3034 聯詠'] },
  { name: '電子零組件', change: 1.82, up: true, stocks: ['2308 台達電', '3008 大立光', '2327 國巨'] },
  { name: '金融保險', change: 0.31, up: true, stocks: ['2881 富邦金', '2882 國泰金', '2884 玉山金'] },
  { name: '航運', change: -1.85, up: false, stocks: ['2603 長榮', '2609 陽明', '2615 萬海'] },
  { name: '光電', change: 0.95, up: true, stocks: ['3481 群創', '2409 友達', '6116 彩晶'] },
  { name: '鋼鐵', change: -2.14, up: false, stocks: ['2002 中鋼', '2006 東和鋼鐵', '2014 中鴻'] },
]
