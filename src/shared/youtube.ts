export type YouTubeCaption = {
  videoId: string
  sequence: number
  startMs: number
  endMs: number
  text: string
}

export type YouTubeTranscriptSegment = {
  id: string
  startMs: number
  endMs: number
  text: string
  translation?: string
}

export type YouTubeTranscript = {
  videoId: string
  title: string
  language: string
  segments: YouTubeTranscriptSegment[]
}

export type YouTubeMessage =
  | { type: 'caption:update'; caption: YouTubeCaption }
  | { type: 'caption:open-popup'; caption: YouTubeCaption }
  | { type: 'caption:translated'; videoId: string; sequence: number; translation: string }
  | { type: 'caption:error'; videoId: string; sequence: number; code: string; message: string }
  | { type: 'transcript:open'; transcript: YouTubeTranscript }
  | { type: 'transcript:segment'; videoId: string; segmentId: string; translation: string }
  | { type: 'transcript:progress'; videoId: string; completed: number; total: number }
  | { type: 'transcript:error'; videoId: string; code: string; message: string }

export function isYouTubeMessage(value: unknown): value is YouTubeMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  const hasText = (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0
  const isCaption = (caption: unknown): caption is YouTubeCaption => {
    if (!caption || typeof caption !== 'object') return false
    const item = caption as Record<string, unknown>
    return hasText(item.videoId) && Number.isSafeInteger(item.sequence) && typeof item.startMs === 'number'
      && typeof item.endMs === 'number' && hasText(item.text) && item.text.length <= 900
  }
  const isTranscript = (transcript: unknown): transcript is YouTubeTranscript => {
    if (!transcript || typeof transcript !== 'object') return false
    const item = transcript as Record<string, unknown>
    return hasText(item.videoId) && typeof item.title === 'string' && hasText(item.language)
      && Array.isArray(item.segments) && item.segments.length > 0 && item.segments.every((segment) => {
        if (!segment || typeof segment !== 'object') return false
        const row = segment as Record<string, unknown>
        return hasText(row.id) && typeof row.startMs === 'number' && typeof row.endMs === 'number' && hasText(row.text) && row.text.length <= 900
      })
  }
  switch (candidate.type) {
    case 'caption:update': case 'caption:open-popup': return isCaption(candidate.caption)
    case 'transcript:open': return isTranscript(candidate.transcript)
    case 'caption:translated': return hasText(candidate.videoId) && Number.isSafeInteger(candidate.sequence) && hasText(candidate.translation)
    case 'caption:error': return hasText(candidate.videoId) && Number.isSafeInteger(candidate.sequence) && hasText(candidate.code) && hasText(candidate.message)
    case 'transcript:segment': return hasText(candidate.videoId) && hasText(candidate.segmentId) && hasText(candidate.translation)
    case 'transcript:progress': return hasText(candidate.videoId) && Number.isSafeInteger(candidate.completed) && Number.isSafeInteger(candidate.total)
    case 'transcript:error': return typeof candidate.videoId === 'string' && hasText(candidate.code) && hasText(candidate.message)
    default: return false
  }
}
