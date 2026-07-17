type Caption = { videoId: string; sequence: number; startMs: number; endMs: number; text: string }
type TranslatedCaption = { type: 'caption:translated'; videoId: string; sequence: number; translation: string }

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',
  async main() {
    await injectScript('/youtube-main-world.js', { keepInDom: true })

    let sequence = 0
    let lastKey = ''
    let timer: number | undefined
    let overlay: HTMLDivElement | undefined
    let lastCaption: Caption | undefined

    const getVideoId = (): string => new URL(location.href).searchParams.get('v') ?? ''
    const getCaptionText = (): string => [...document.querySelectorAll('.ytp-caption-segment')]
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
      .trim()

    function ensureOverlay(): HTMLDivElement | undefined {
      if (overlay?.isConnected) return overlay
      const player = document.querySelector('.html5-video-player')
      if (!player) return undefined
      overlay = document.createElement('div')
      Object.assign(overlay.style, {
        position: 'absolute', left: '5%', right: '5%', bottom: '12%', zIndex: '2147483647', color: '#fff',
        textAlign: 'center', fontSize: 'clamp(18px, 2.2vw, 30px)', fontWeight: '600', textShadow: '0 2px 5px #000', pointerEvents: 'auto'
      })
      overlay.onclick = () => { if (lastCaption) void chrome.runtime.sendMessage({ type: 'caption:open-popup', caption: lastCaption }) }
      player.append(overlay)
      return overlay
    }

    function emitCaption(): void {
      const text = getCaptionText()
      const videoId = getVideoId()
      const video = document.querySelector('video')
      if (!text || !videoId) return
      const startMs = Math.round((video?.currentTime ?? 0) * 1000)
      const key = `${videoId}:${text}:${Math.floor(startMs / 1000)}`
      if (key === lastKey) return
      lastKey = key
      lastCaption = { videoId, sequence: ++sequence, startMs, endMs: startMs + 4000, text }
      void chrome.runtime.sendMessage({ type: 'caption:update', caption: lastCaption })
    }

    new MutationObserver(() => {
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(emitCaption, 250)
    }).observe(document.body, { subtree: true, childList: true, characterData: true })

    chrome.runtime.onMessage.addListener((message: unknown) => {
      const caption = message as Partial<TranslatedCaption>
      if (caption.type === 'caption:translated' && lastCaption?.videoId === caption.videoId && lastCaption.sequence === caption.sequence && typeof caption.translation === 'string') {
        const node = ensureOverlay()
        if (node) node.textContent = caption.translation
      }
      if ((message as { type?: unknown }).type === 'transcript:collect') document.dispatchEvent(new CustomEvent('lexicon:collect-transcript'))
    })
    document.addEventListener('lexicon:transcript', (event) => void chrome.runtime.sendMessage({ type: 'transcript:open', transcript: (event as CustomEvent).detail }))
  }
})
