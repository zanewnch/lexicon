// DUMMY DATA — All values below are simulated for UI prototyping.
// TODO: Replace each section with a real API call when backend is ready.

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

export interface TradeOrderBookLevel {
  price: number
  volume: number
}

export interface TradeOrderBook {
  asks: TradeOrderBookLevel[]
  bids: TradeOrderBookLevel[]
}

export interface Order {
  id: string
  time: string
  code: string
  name: string
  side: 'buy' | 'sell'
  type: string
  price: number
  shares: number
  filled: number
  status: string
}

export interface AccountBalance {
  cashBalance: number
  buyingPower: number
  marginUsed: number
}

// TODO: replace with GET /api/stock/:code (real-time quote)
export const dummyTradeQuote: TradeQuote = {
  code: '2330',
  name: '台積電',
  price: 985,
  change: 15,
  percent: 1.55,
  up: true,
  high: 988,
  low: 972,
  open: 975,
  prevClose: 970,
  volume: 28_432,
  limitUp: 1067,
  limitDown: 873,
}

// TODO: replace with WebSocket /ws/orderbook/:code
export const dummyTradeOrderBook: TradeOrderBook = {
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

// TODO: replace with GET /api/account/orders?date=today
export const dummyOrders: Order[] = [
  { id: 'O001', time: '13:22:05', code: '2330', name: '台積電', side: 'buy', type: '限價', price: 982, shares: 1000, filled: 1000, status: '已成交' },
  { id: 'O002', time: '13:15:30', code: '2317', name: '鴻海', side: 'buy', type: '限價', price: 176, shares: 3000, filled: 2000, status: '部分成交' },
  { id: 'O003', time: '11:05:30', code: '2603', name: '長榮', side: 'sell', type: '限價', price: 170, shares: 2000, filled: 2000, status: '已成交' },
  { id: 'O004', time: '10:20:00', code: '2454', name: '聯發科', side: 'buy', type: '限價', price: 1270, shares: 500, filled: 0, status: '委託中' },
  { id: 'O005', time: '09:12:18', code: '2881', name: '富邦金', side: 'buy', type: '市價', price: 0, shares: 3000, filled: 3000, status: '已成交' },
  { id: 'O006', time: '09:05:00', code: '2412', name: '中華電', side: 'sell', type: '限價', price: 135, shares: 1000, filled: 0, status: '已取消' },
]

// TODO: replace with GET /api/account/balance
export const dummyAccountBalance: AccountBalance = {
  cashBalance: 1_245_600,
  buyingPower: 3_736_800,
  marginUsed: 2_491_200,
}
