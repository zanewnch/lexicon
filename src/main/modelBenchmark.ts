import type { ComputeBackend } from './llm'

export type ModelBenchmarkRating = 'smooth' | 'usable' | 'strained' | 'not-recommended'

export type ModelBenchmark = {
  status: 'success'
  filename: string
  size: number
  modifiedAt: number
  completedAt: string
  backend: ComputeBackend
  firstTokenMs: number
  tokensPerSecond: number
  rating: ModelBenchmarkRating
  recommendation: string
} | {
  status: 'failed'
  filename: string
  size: number
  modifiedAt: number
  completedAt: string
  message: string
}

export type BenchmarkMeasurements = { firstTokenMs: number; tokensPerSecond: number }

export function evaluateBenchmark({ firstTokenMs, tokensPerSecond }: BenchmarkMeasurements): Pick<ModelBenchmark & { status: 'success' }, 'rating' | 'recommendation'> {
  if (firstTokenMs > 6_000 || tokensPerSecond < 2) {
    return { rating: 'not-recommended', recommendation: '回應過慢，不建議用於即時翻譯或 YouTube 字幕。' }
  }
  if (firstTokenMs <= 1_200 && tokensPerSecond >= 15) {
    return { rating: 'smooth', recommendation: '適合短句翻譯與即時 YouTube 字幕。' }
  }
  if (firstTokenMs <= 2_500 && tokensPerSecond >= 6) {
    return { rating: 'usable', recommendation: '一般翻譯順暢；YouTube 字幕可能偶有延遲。' }
  }
  return { rating: 'strained', recommendation: '適合短句翻譯，不建議用於即時 YouTube 字幕。' }
}

export function getMedian(values: number[]): number {
  if (!values.length) throw new Error('沒有可用的測試結果')
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function isBenchmarkCurrent(benchmark: ModelBenchmark | undefined, model: { size: number; modifiedAt: number }): boolean {
  return benchmark?.size === model.size && benchmark.modifiedAt === model.modifiedAt
}
