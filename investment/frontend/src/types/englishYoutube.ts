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

export type YouTubeControl =
  | { type: 'youtube:control'; action: 'seek'; videoId: string; positionMs: number }
  | { type: 'youtube:control'; action: 'playback'; videoId: string; value: 'play' | 'pause' | 'toggle' }
  | { type: 'youtube:control'; action: 'rate'; videoId: string; value: number }
  | { type: 'youtube:control'; action: 'caption-mode'; videoId: string; value: 'both' | 'english' | 'translation' | 'hidden' }
  | { type: 'youtube:control'; action: 'repeat'; videoId: string; startMs: number; endMs: number }

export type YouTubeMessage =
  | { type: 'caption:update'; caption: YouTubeCaption }
  | { type: 'caption:open-popup'; caption: YouTubeCaption }
  | { type: 'caption:translated'; videoId: string; sequence: number; translation: string }
  | { type: 'caption:error'; videoId: string; sequence: number; code: string; message: string }
  | { type: 'transcript:open'; transcript: YouTubeTranscript }
  | { type: 'transcript:segment'; videoId: string; segmentId: string; translation: string }
  | { type: 'transcript:progress'; videoId: string; completed: number; total: number }
  | { type: 'transcript:error'; videoId: string; code: string; message: string }
  | { type: 'player:position'; videoId: string; positionMs: number; playing: boolean }
  | YouTubeControl
