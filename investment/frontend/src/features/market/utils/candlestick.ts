import type { KlineBar } from '@/types/market'

export interface CandleShape {
  name: string
  interpretation: string
}

/** 只依單根 K 棒的開高低收比例描述形狀，不推斷下一根走向。 */
export function classifyCandle(bar: KlineBar): CandleShape {
  const { open, high, low, close } = bar
  if (![open, high, low, close].every(Number.isFinite)
    || high < Math.max(open, close) || low > Math.min(open, close) || high < low) {
    return { name: '資料異常', interpretation: '這根 K 棒的價格資料對不起來，暫時無法解讀。' }
  }

  const range = high - low
  if (range === 0) {
    return { name: '一字線', interpretation: '開盤、最高、最低、收盤價都一樣。可以再看看這段時間有沒有成交。' }
  }

  const body = Math.abs(close - open) / range
  const upper = (high - Math.max(open, close)) / range
  const lower = (Math.min(open, close) - low) / range
  const direction = close > open ? '紅K（陽線）' : '綠K（陰線）'
  const longUpperHint = close > open
    ? '收盤比開盤高，但離最高價還有一大段。高價沒有維持到收盤，可能遇到賣壓；不能只憑這根 K 棒判定接下來會跌。'
    : '收盤比開盤低，最高價又比開盤高出一大段。高價沒有維持到收盤，可能遇到賣壓；不能只憑這根 K 棒判定接下來會跌。'

  if (body <= 0.1) {
    if (lower >= 0.7 && upper <= 0.15) {
      return { name: '蜻蜓十字', interpretation: '開盤和收盤價很接近，也都靠近最高價；最低價卻低了很多。只看這根，無法判斷接下來會漲或跌。' }
    }
    if (upper >= 0.7 && lower <= 0.15) {
      return { name: '墓碑十字', interpretation: '開盤和收盤價很接近，也都靠近最低價；最高價卻高了很多。只看這根，無法判斷接下來會漲或跌。' }
    }
    return { name: '十字線', interpretation: '開盤和收盤價幾乎一樣。只看這根，無法判斷接下來會漲或跌。' }
  }

  if (body <= 0.3 && lower >= 0.55 && upper <= 0.2) {
    return { name: '小實體、長下影線', interpretation: '開盤和收盤價很接近，但最低價低了很多；最後沒有收在最低價。要看前後幾根 K 棒，才能知道這個形狀出現在上漲還是下跌之後。' }
  }
  if (body <= 0.3 && upper >= 0.55 && lower <= 0.2) {
    return { name: '小實體、長上影線', interpretation: `開盤和收盤價很接近。${longUpperHint}` }
  }
  if (body >= 0.7 && upper <= 0.15 && lower <= 0.15) {
    return { name: `${direction}、實體占比高`, interpretation: close > open
      ? '收盤比開盤高出不少，紅色部分占這根 K 棒大多數。只看這根，無法判斷接下來會不會繼續漲。'
      : '收盤比開盤低了不少，綠色部分占這根 K 棒大多數。只看這根，無法判斷接下來會不會繼續跌。' }
  }
  if (upper >= 0.45) {
    return { name: `${direction}、長上影線`, interpretation: longUpperHint }
  }
  if (lower >= 0.45) {
    return { name: `${direction}、長下影線`, interpretation: '最低價比開盤和收盤價低很多，但最後沒有收在最低價。可能有人在較低價買進；只看這根，不能判定接下來會漲。' }
  }
  if (body <= 0.3) {
    return { name: '小實體 K 棒', interpretation: '開盤和收盤價很接近。只看這根，無法判斷接下來會漲或跌。' }
  }
  return { name: direction, interpretation: close > open
    ? '收盤比開盤高，所以畫成紅K。只看這根，無法判斷接下來會不會繼續漲。'
    : '收盤比開盤低，所以畫成綠K。只看這根，無法判斷接下來會不會繼續跌。' }
}
