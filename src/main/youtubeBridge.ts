import { createServer, type Server, type Socket } from 'node:net'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type TranslationEngine } from './llm'
import { type TranslationJobScheduler } from './translationJobScheduler'
import { type YouTubeCaption, type YouTubeMessage, type YouTubeTranscript, isYouTubeMessage } from '../shared/youtube'

export const YOUTUBE_PIPE_NAME = process.platform === 'win32'
  ? '\\\\.\\pipe\\lexicon-youtube-bridge'
  : join(tmpdir(), 'lexicon-youtube-bridge.sock')
const MAX_MESSAGE_BYTES = 1024 * 1024

type BridgeOptions = {
  translator: TranslationEngine
  translationJobs: TranslationJobScheduler
  onCaptionPopup: (caption: YouTubeCaption) => void
  onTranscript: (transcript: YouTubeTranscript) => void
  onTranscriptSegment: (videoId: string, segmentId: string, translation: string) => void
  onTranscriptProgress: (videoId: string, completed: number, total: number) => void
}

export function startYouTubeBridge(options: BridgeOptions): Server {
  const latestSequence = new Map<string, number>()
  const server = createServer((socket) => {
    let buffer = ''
    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1); newline = buffer.indexOf('\n')
        if (Buffer.byteLength(line, 'utf8') > MAX_MESSAGE_BYTES) { send(socket, { type: 'transcript:error', videoId: '', code: 'message-too-large', message: '字幕資料過大。' }); continue }
        let message: unknown
        try { message = JSON.parse(line) } catch { send(socket, { type: 'transcript:error', videoId: '', code: 'invalid-message', message: '字幕資料無效。' }); continue }
        if (!isYouTubeMessage(message)) { send(socket, { type: 'transcript:error', videoId: '', code: 'invalid-message', message: '字幕資料無效。' }); continue }
        void handleMessage(socket, message, latestSequence, options)
      }
    })
  })
  if (process.platform !== 'win32') {
    // Unix-domain socket files can survive an unclean shutdown. It is safe to
    // remove this fixed per-user temporary path before listening again.
    void rm(YOUTUBE_PIPE_NAME, { force: true }).then(() => server.listen(YOUTUBE_PIPE_NAME))
    server.once('close', () => { void rm(YOUTUBE_PIPE_NAME, { force: true }) })
  } else {
    server.listen(YOUTUBE_PIPE_NAME)
  }
  return server
}

async function handleMessage(socket: Socket, message: YouTubeMessage, latestSequence: Map<string, number>, options: BridgeOptions): Promise<void> {
  if (message.type === 'caption:open-popup') { options.onCaptionPopup(message.caption); return }
  if (message.type === 'caption:update') {
    const { caption } = message
    if (!isCaption(caption)) { send(socket, { type: 'caption:error', videoId: caption.videoId, sequence: caption.sequence, code: 'invalid-caption', message: '字幕資料無效。' }); return }
    latestSequence.set(caption.videoId, caption.sequence)
    try {
      const translation = await options.translationJobs.submit({ id: `youtube-caption-${caption.videoId}-${caption.sequence}`, text: caption.text, direction: 'en-to-zh', priority: 'interactive', group: `caption:${caption.videoId}` }, () => options.translator.translate(caption.text, 'en-to-zh', `youtube-caption-${caption.videoId}-${caption.sequence}`))
      if (latestSequence.get(caption.videoId) === caption.sequence) send(socket, { type: 'caption:translated', videoId: caption.videoId, sequence: caption.sequence, translation })
    } catch (error) {
      send(socket, { type: 'caption:error', videoId: caption.videoId, sequence: caption.sequence, code: 'translation-failed', message: error instanceof Error ? error.message : '翻譯失敗。' })
    }
    return
  }
  if (message.type === 'transcript:open') {
    const { transcript } = message
    if (!isTranscript(transcript)) { send(socket, { type: 'transcript:error', videoId: transcript.videoId, code: 'invalid-transcript', message: '逐字稿資料無效。' }); return }
    options.translationJobs.cancelGroups('transcript:')
    const transcriptGroup = `transcript:${transcript.videoId}:${Date.now()}`
    options.onTranscript(transcript)
    let completed = 0
    for (const segment of transcript.segments) {
      try {
        const translation = await options.translationJobs.submit({ id: `youtube-transcript-${transcript.videoId}-${segment.id}`, text: segment.text, direction: 'en-to-zh', priority: 'background', group: transcriptGroup }, () => options.translator.translate(segment.text, 'en-to-zh', `youtube-transcript-${transcript.videoId}-${segment.id}`))
        options.onTranscriptSegment(transcript.videoId, segment.id, translation)
        send(socket, { type: 'transcript:segment', videoId: transcript.videoId, segmentId: segment.id, translation })
      } catch { /* Keep original text available; later segments can still translate. */ }
      completed += 1
      options.onTranscriptProgress(transcript.videoId, completed, transcript.segments.length)
      send(socket, { type: 'transcript:progress', videoId: transcript.videoId, completed, total: transcript.segments.length })
    }
  }
}

function isCaption(value: YouTubeCaption): boolean {
  return typeof value.videoId === 'string' && value.videoId.length > 0 && typeof value.sequence === 'number' && typeof value.text === 'string' && value.text.trim().length > 0 && value.text.length <= 900
}

function isTranscript(value: YouTubeTranscript): boolean {
  return typeof value.videoId === 'string' && value.videoId.length > 0 && Array.isArray(value.segments) && value.segments.length > 0 && value.segments.every((segment) => typeof segment.id === 'string' && typeof segment.text === 'string' && segment.text.length > 0 && segment.text.length <= 900)
}

function send(socket: Socket, message: YouTubeMessage): void { if (!socket.destroyed) socket.write(`${JSON.stringify(message)}\n`) }
