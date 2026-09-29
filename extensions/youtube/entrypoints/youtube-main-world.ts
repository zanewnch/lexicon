type TranscriptError = { videoId: string; code: string; message: string }

export default defineUnlistedScript(() => {
  document.addEventListener('lexicon:collect-transcript', async () => {
    const videoId = new URL(location.href).searchParams.get('v') ?? ''
    try {
      const tracks = (window as any).ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
      const track = tracks.find((item: any) => item.languageCode?.startsWith('en'))
      if (!track) throw new Error('此影片沒有可取得的英文字幕。')
      const payload = await fetch(`${track.baseUrl}&fmt=json3`).then((result) => {
        if (!result.ok) throw new Error('無法讀取此影片字幕。')
        return result.json()
      })
      const segments = (payload.events ?? [])
        .filter((event: any) => event.segs?.length)
        .map((event: any, index: number) => ({
          id: `${event.tStartMs}-${index}`,
          startMs: event.tStartMs ?? 0,
          endMs: (event.tStartMs ?? 0) + (event.dDurationMs ?? 0),
          text: event.segs.map((segment: any) => segment.utf8).join('').replace(/\n/g, ' ').trim()
        }))
        .filter((segment: any) => segment.text)
      if (!segments.length) throw new Error('此影片沒有可讀取的英文逐字稿。')
      document.dispatchEvent(new CustomEvent('lexicon:transcript', {
        detail: { videoId, title: document.title.replace(' - YouTube', ''), language: track.languageCode, segments }
      }))
    } catch (error) {
      const detail: TranscriptError = { videoId, code: 'transcript-unavailable', message: error instanceof Error ? error.message : '無法讀取此影片字幕。' }
      document.dispatchEvent(new CustomEvent('lexicon:transcript-error', { detail }))
    }
  })
})
