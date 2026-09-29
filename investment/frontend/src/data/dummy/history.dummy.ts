// DUMMY DATA — All values below are simulated for UI prototyping.
// TODO: Replace each section with a real API call when backend is ready.

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

// TODO: replace with GET /api/account/trades?from=:dateFrom&to=:dateTo
export const dummyTrades: TradeRecord[] = [
  { date: '2026/03/08', time: '13:22:05', code: '2330', name: '台積電', side: 'buy', price: 982, shares: 1000, fee: 1_398, tax: 0, pnl: null },
  { date: '2026/03/08', time: '11:05:30', code: '2603', name: '長榮', side: 'sell', price: 170, shares: 2000, fee: 484, tax: 1_020, pnl: 18_496 },
  { date: '2026/03/07', time: '10:30:12', code: '2881', name: '富邦金', side: 'buy', price: 84.5, shares: 3000, fee: 361, tax: 0, pnl: null },
  { date: '2026/03/06', time: '09:15:45', code: '2317', name: '鴻海', side: 'buy', price: 175, shares: 2000, fee: 498, tax: 0, pnl: null },
  { date: '2026/03/05', time: '13:10:22', code: '2454', name: '聯發科', side: 'sell', price: 1300, shares: 200, fee: 370, tax: 780, pnl: 18_850 },
  { date: '2026/03/04', time: '10:45:00', code: '2330', name: '台積電', side: 'buy', price: 970, shares: 1000, fee: 1_381, tax: 0, pnl: null },
  { date: '2026/03/03', time: '11:20:33', code: '2412', name: '中華電', side: 'buy', price: 130, shares: 2000, fee: 370, tax: 0, pnl: null },
  { date: '2026/02/28', time: '09:30:15', code: '2603', name: '長榮', side: 'buy', price: 162, shares: 2000, fee: 461, tax: 0, pnl: null },
  { date: '2026/02/25', time: '13:25:40', code: '3008', name: '大立光', side: 'sell', price: 2400, shares: 100, fee: 342, tax: 720, pnl: -11_062 },
  { date: '2026/02/20', time: '10:15:08', code: '2881', name: '富邦金', side: 'sell', price: 82, shares: 2000, fee: 233, tax: 492, pnl: 7_275 },
  { date: '2026/02/15', time: '11:45:22', code: '2330', name: '台積電', side: 'sell', price: 960, shares: 500, fee: 683, tax: 1_440, pnl: 17_877 },
  { date: '2026/02/10', time: '09:05:30', code: '2317', name: '鴻海', side: 'buy', price: 168, shares: 3000, fee: 717, tax: 0, pnl: null },
  { date: '2026/01/20', time: '10:30:00', code: '3008', name: '大立光', side: 'buy', price: 2510, shares: 100, fee: 357, tax: 0, pnl: null },
  { date: '2026/01/15', time: '13:00:45', code: '2454', name: '聯發科', side: 'buy', price: 1200, shares: 500, fee: 855, tax: 0, pnl: null },
  { date: '2026/01/10', time: '09:45:20', code: '2330', name: '台積電', side: 'buy', price: 925, shares: 1000, fee: 1_318, tax: 0, pnl: null },
]
