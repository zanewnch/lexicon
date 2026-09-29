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

  it('accepts player position updates and safe playback controls', () => {
    expect(isYouTubeMessage({ type: 'player:position', videoId: 'abc', positionMs: 1200, playing: true })).toBe(true)
    expect(isYouTubeMessage({ type: 'youtube:control', action: 'seek', videoId: 'abc', positionMs: 1200 })).toBe(true)
    expect(isYouTubeMessage({ type: 'youtube:control', action: 'caption-mode', videoId: 'abc', value: 'translation' })).toBe(true)
    expect(isYouTubeMessage({ type: 'youtube:control', action: 'rate', videoId: 'abc', value: 4 })).toBe(false)
  })
})
