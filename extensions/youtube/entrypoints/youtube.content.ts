type Caption = { videoId: string; sequence: number; startMs: number; endMs: number; text: string }
type TranslatedCaption = { type: 'caption:translated'; videoId: string; sequence: number; translation: string }
type CaptionMode = 'both' | 'english' | 'translation' | 'hidden'
type YouTubeControl =
  | { type: 'youtube:control'; action: 'seek'; videoId: string; positionMs: number }
  | { type: 'youtube:control'; action: 'playback'; videoId: string; value: 'play' | 'pause' | 'toggle' }
  | { type: 'youtube:control'; action: 'rate'; videoId: string; value: number }
  | { type: 'youtube:control'; action: 'caption-mode'; videoId: string; value: CaptionMode }
  | { type: 'youtube:control'; action: 'repeat'; videoId: string; startMs: number; endMs: number }

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',
  async main() {
    await injectScript('/youtube-main-world.js', { keepInDom: true })

    let sequence = 0
    let lastKey = ''
    let lastVideoId = ''
    let timer: number | undefined
    let positionTimer: number | undefined
    let repeatTimer: number | undefined
    let overlay: HTMLDivElement | undefined
    let modeStyle: HTMLStyleElement | undefined
    let lastCaption: Caption | undefined
    let captionTranslation = ''
    let captionMode: CaptionMode = 'both'

    const getVideoId = (): string => new URL(location.href).searchParams.get('v') ?? ''
    const getVideo = (): HTMLVideoElement | undefined => document.querySelector('video') ?? undefined
    const getCaptionText = (): string => [...document.querySelectorAll('.ytp-caption-segment')]
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
      .trim()

    function ensureModeStyle(): HTMLStyleElement {
      if (modeStyle?.isConnected) return modeStyle
      modeStyle = document.createElement('style')
      modeStyle.id = 'lexicon-youtube-caption-mode'
      document.head.append(modeStyle)
      return modeStyle
    }

    function renderCaptionMode(): void {
      ensureModeStyle().textContent = captionMode === 'english' || captionMode === 'both'
        ? ''
        : '.ytp-caption-window-container { visibility: hidden !important; }'
      if (overlay) {
        overlay.style.visibility = captionMode === 'translation' || captionMode === 'both' ? 'visible' : 'hidden'
        overlay.textContent = captionTranslation
      }
    }

    function ensureOverlay(): HTMLDivElement | undefined {
      if (overlay?.isConnected) return overlay
      const player = document.querySelector('.html5-video-player')
      if (!player) return undefined
      overlay = document.createElement('div')
      overlay.id = 'lexicon-youtube-translation'
      Object.assign(overlay.style, {
        position: 'absolute', left: '5%', right: '5%', bottom: '7%', zIndex: '2147483647', color: '#dbeafe',
        textAlign: 'center', fontSize: 'clamp(18px, 2.2vw, 30px)', fontWeight: '600', textShadow: '0 2px 5px #000',
        pointerEvents: 'auto', cursor: 'pointer', lineHeight: '1.35', transition: 'opacity 120ms ease'
      })
      overlay.title = '點擊查看這句的完整翻譯'
      overlay.onclick = () => { if (lastCaption) void chrome.runtime.sendMessage({ type: 'caption:open-popup', caption: lastCaption }) }
      player.append(overlay)
      renderCaptionMode()
      return overlay
    }

    function resetForVideo(videoId: string): void {
      if (videoId === lastVideoId) return
      lastVideoId = videoId
      lastKey = ''
      lastCaption = undefined
      captionTranslation = ''
      if (overlay) overlay.textContent = ''
    }

    function emitCaption(): void {
      const text = getCaptionText()
      const videoId = getVideoId()
      const video = getVideo()
      resetForVideo(videoId)
      if (!text || !videoId) return
      const startMs = Math.round((video?.currentTime ?? 0) * 1000)
      const key = `${videoId}:${text}:${Math.floor(startMs / 1000)}`
      if (key === lastKey) return
      lastKey = key
      captionTranslation = ''
      if (overlay) overlay.textContent = ''
      lastCaption = { videoId, sequence: ++sequence, startMs, endMs: startMs + 4000, text }
      void chrome.runtime.sendMessage({ type: 'caption:update', caption: lastCaption })
    }

    function emitPosition(): void {
      const videoId = getVideoId()
      const video = getVideo()
      if (!videoId || !video) return
      resetForVideo(videoId)
      void chrome.runtime.sendMessage({ type: 'player:position', videoId, positionMs: Math.round(video.currentTime * 1000), playing: !video.paused })
    }

    function applyControl(control: YouTubeControl): void {
      const videoId = getVideoId()
      const video = getVideo()
      if (!video || control.videoId !== videoId) return
      if (control.action === 'seek') {
        video.currentTime = control.positionMs / 1000
        emitPosition()
        return
      }
      if (control.action === 'playback') {
        if (control.value === 'play') void video.play()
        else if (control.value === 'pause') video.pause()
        else if (video.paused) void video.play()
        else video.pause()
        return
      }
      if (control.action === 'rate') { video.playbackRate = control.value; return }
      if (control.action === 'caption-mode') { captionMode = control.value; renderCaptionMode(); return }
      clearTimeout(repeatTimer)
      video.currentTime = control.startMs / 1000
      void video.play()
      repeatTimer = window.setTimeout(() => video.pause(), Math.max(500, control.endMs - control.startMs))
    }

    new MutationObserver(() => {
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(emitCaption, 250)
    }).observe(document.body, { subtree: true, childList: true, characterData: true })

    positionTimer = window.setInterval(emitPosition, 500)
    chrome.runtime.onMessage.addListener((message: unknown) => {
      const caption = message as Partial<TranslatedCaption>
      if (caption.type === 'caption:translated' && lastCaption?.videoId === caption.videoId && lastCaption.sequence === caption.sequence && typeof caption.translation === 'string') {
        captionTranslation = caption.translation
        const node = ensureOverlay()
        if (node) { node.textContent = captionTranslation; renderCaptionMode() }
      }
      if ((message as { type?: unknown }).type === 'transcript:collect') document.dispatchEvent(new CustomEvent('lexicon:collect-transcript'))
      if ((message as { type?: unknown }).type === 'youtube:control') applyControl(message as YouTubeControl)
    })
    document.addEventListener('lexicon:transcript', (event) => void chrome.runtime.sendMessage({ type: 'transcript:open', transcript: (event as CustomEvent).detail }))
    document.addEventListener('lexicon:transcript-error', (event) => void chrome.runtime.sendMessage({ type: 'transcript:error', ...(event as CustomEvent).detail }))

    window.addEventListener('beforeunload', () => {
      clearTimeout(timer)
      clearTimeout(repeatTimer)
      if (positionTimer) clearInterval(positionTimer)
    }, { once: true })
  }
})
