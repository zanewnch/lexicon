import { describe, expect, it } from 'vitest'
import type { KlineBar } from '@/types/market'
import { classifyCandle } from './candlestick'

function candle(open: number, high: number, low: number, close: number): KlineBar {
  return { ts: '2026-09-24T13:30:00+08:00', open, high, low, close, volume: 1000 }
}

describe('classifyCandle', () => {
  it('recognizes a doji without calling it a reversal', () => {
    const shape = classifyCandle(candle(100, 105, 95, 100))
    expect(shape.name).toBe('十字線')
    expect(shape.interpretation).toContain('無法判斷接下來會漲或跌')
  })

  it('describes a long lower shadow without assuming the preceding trend', () => {
    const shape = classifyCandle(candle(104, 105, 90, 102))
    expect(shape.name).toBe('小實體、長下影線')
    expect(shape.interpretation).toContain('最後沒有收在最低價')
  })

  it('distinguishes dominant up and down bodies using Taiwan colors', () => {
    expect(classifyCandle(candle(90, 101, 89, 100)).name).toBe('紅K（陽線）、實體占比高')
    expect(classifyCandle(candle(100, 101, 90, 91)).name).toBe('綠K（陰線）、實體占比高')
  })

  it('reads the September 24 TSMC bar as a small body with a longer upper wick', () => {
    const shape = classifyCandle(candle(2480, 2490, 2470, 2475))
    expect(shape.name).toBe('綠K（陰線）、長上影線')
    expect(shape.interpretation).toContain('最高價又比開盤高出一大段')
  })

  it('explains a red candle with a long upper shadow in plain language', () => {
    const shape = classifyCandle(candle(100, 125, 98, 110))
    expect(shape.name).toBe('紅K（陽線）、長上影線')
    expect(shape.interpretation).toContain('收盤比開盤高，但離最高價還有一大段')
    expect(shape.interpretation).toContain('不能只憑這根 K 棒判定接下來會跌')
  })

  it('does not classify inconsistent OHLC values', () => {
    expect(classifyCandle(candle(100, 99, 90, 101)).name).toBe('資料異常')
  })
})
