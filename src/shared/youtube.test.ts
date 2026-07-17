import { describe, expect, it } from 'vitest'
import { isYouTubeMessage } from './youtube'

describe('isYouTubeMessage', () => {
  it('accepts a complete caption update', () => {
    expect(isYouTubeMessage({ type: 'caption:update', caption: { videoId: 'abc', sequence: 1, startMs: 0, endMs: 100, text: 'Hello' } })).toBe(true)
  })

  it('rejects a type-only native pipe message', () => {
    expect(isYouTubeMessage({ type: 'caption:update' })).toBe(false)
    expect(isYouTubeMessage({ type: 'transcript:open', transcript: { videoId: 'abc', segments: [] } })).toBe(false)
  })
})
