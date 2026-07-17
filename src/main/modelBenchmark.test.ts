import { describe, expect, it } from 'vitest'
import { evaluateBenchmark, getMedian, isBenchmarkCurrent, type ModelBenchmark } from './modelBenchmark'

describe('model benchmark evaluation', () => {
  it.each([
    [{ firstTokenMs: 800, tokensPerSecond: 20 }, 'smooth'],
    [{ firstTokenMs: 1_800, tokensPerSecond: 8 }, 'usable'],
    [{ firstTokenMs: 3_000, tokensPerSecond: 4 }, 'strained'],
    [{ firstTokenMs: 7_000, tokensPerSecond: 20 }, 'not-recommended'],
    [{ firstTokenMs: 500, tokensPerSecond: 1 }, 'not-recommended']
  ] as const)('rates %o as %s', (measurement, rating) => {
    expect(evaluateBenchmark(measurement).rating).toBe(rating)
  })

  it('uses a median and invalidates results when the file changes', () => {
    expect(getMedian([8, 2, 5])).toBe(5)
    const benchmark: ModelBenchmark = { status: 'success', filename: 'test.gguf', size: 10, modifiedAt: 20, completedAt: '2026-01-01T00:00:00.000Z', backend: 'cpu', firstTokenMs: 100, tokensPerSecond: 20, rating: 'smooth', recommendation: 'ok' }
    expect(isBenchmarkCurrent(benchmark, { size: 10, modifiedAt: 20 })).toBe(true)
    expect(isBenchmarkCurrent(benchmark, { size: 11, modifiedAt: 20 })).toBe(false)
  })
})
