<script setup lang="ts">
import { englishApi } from '@/api/english'
import { EnglishBadge, EnglishButton, EnglishCard, EnglishChoice, EnglishIcon, EnglishInput, EnglishItem, EnglishItemLabel, EnglishItemSection, EnglishList, EnglishProgress, EnglishSection } from '../ui'
import type { LookupResult, YouTubeControl, YouTubeTranscript, YouTubeTranscriptSegment } from '@/types/english'

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ transcript: YouTubeTranscript | null; error?: string }>()
const completed = ref(0)
const query = ref('')
const savingSegmentId = ref<string | null>(null)
const status = ref('')
const lookupBusy = ref(false)
const lookupResult = ref<LookupResult | null>(null)
const savingWord = ref(false)
const positionMs = ref(0)
const playing = ref(false)
const rate = ref(1)
const captionMode = ref<'both' | 'english' | 'translation' | 'hidden'>('both')
const lastPersistedSecond = ref(-1)
type SavedVideo = { videoId: string; title: string; language: string; lastPositionMs: number; favorite: boolean; updatedAt: string }
const savedVideos = ref<SavedVideo[]>([])
onMounted(async () => {
  try {
    const saved = await englishApi.getSetting('youtube-videos')
    savedVideos.value = saved ? JSON.parse(saved) : loadSavedVideos()
  } catch (error) { status.value = error instanceof Error ? error.message : '影片紀錄讀取失敗' }
})
const unsubs: Array<() => void> = []

const segments = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (!props.transcript) return []
  return text ? props.transcript.segments.filter((segment) => `${segment.text} ${segment.translation ?? ''}`.toLowerCase().includes(text)) : props.transcript.segments
})
const progressLabel = computed(() => props.transcript ? `${completed.value} / ${props.transcript.segments.length} 段已翻譯` : '')
const activeSegmentId = computed(() => {
  if (!props.transcript) return null
  return props.transcript.segments.find((segment) => positionMs.value >= segment.startMs && positionMs.value < segment.endMs)?.id ?? null
})
const videoProgress = computed(() => {
  if (!props.transcript?.segments.length) return 0
  const duration = props.transcript.segments[props.transcript.segments.length - 1]!.endMs
  return duration > 0 ? Math.min(100, Math.round((positionMs.value / duration) * 100)) : 0
})
const currentVideo = computed(() => props.transcript ? savedVideos.value.find((video) => video.videoId === props.transcript?.videoId) : undefined)
const recentVideos = computed(() => [...savedVideos.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5))
const captionOptions = [
  { label: '雙語', value: 'both' },
  { label: '英文', value: 'english' },
  { label: '中文', value: 'translation' },
  { label: '隱藏', value: 'hidden' }
]
const rateOptions = [
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1 },
  { label: '1.25×', value: 1.25 }
]

function timestamp(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean)
}

function cleanWord(token: string): string {
  return token.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '')
}

function loadSavedVideos(): SavedVideo[] {
  try {
    const value = JSON.parse(localStorage.getItem('lexicon.youtube.videos') ?? '[]')
    return Array.isArray(value) ? value.filter((item) => item && typeof item.videoId === 'string' && typeof item.title === 'string') : []
  } catch { return [] }
}

function persistSavedVideos(): void {
  try { void englishApi.setSetting('youtube-videos', JSON.stringify(savedVideos.value.slice(0, 30))).catch((error) => { status.value = error.message }) } catch { /* Keep the current session usable if storage is unavailable. */ }
}

function rememberVideo(position = positionMs.value): void {
  if (!props.transcript) return
  const existing = savedVideos.value.find((video) => video.videoId === props.transcript?.videoId)
  const next: SavedVideo = {
    videoId: props.transcript.videoId,
    title: props.transcript.title,
    language: props.transcript.language,
    lastPositionMs: position,
    favorite: existing?.favorite ?? false,
    updatedAt: new Date().toISOString()
  }
  savedVideos.value = [next, ...savedVideos.value.filter((video) => video.videoId !== next.videoId)]
  persistSavedVideos()
}

function toggleFavoriteVideo(): void {
  if (!props.transcript) return
  const existing = savedVideos.value.find((video) => video.videoId === props.transcript?.videoId)
  rememberVideo()
  const saved = savedVideos.value.find((video) => video.videoId === props.transcript?.videoId)
  if (saved) saved.favorite = !(existing?.favorite ?? false)
  persistSavedVideos()
}

async function sendControl(control: YouTubeControl): Promise<boolean> {
  const result = await englishApi.controlYouTube(control)
  if (!result.ok) { status.value = result.message; return false }
  status.value = ''
  return true
}

async function seek(segment: YouTubeTranscriptSegment, startPlayback = false): Promise<void> {
  const videoId = props.transcript?.videoId ?? ''
  const sent = await sendControl(startPlayback ? { type: 'youtube:control', action: 'repeat', videoId, startMs: segment.startMs, endMs: segment.endMs } : { type: 'youtube:control', action: 'seek', videoId, positionMs: segment.startMs })
  if (sent) { positionMs.value = segment.startMs; playing.value = startPlayback }
}

async function togglePlayback(): Promise<void> {
  const sent = await sendControl({ type: 'youtube:control', action: 'playback', videoId: props.transcript?.videoId ?? '', value: 'toggle' })
  if (sent) playing.value = !playing.value
}

async function setRate(value: number): Promise<void> {
  const sent = await sendControl({ type: 'youtube:control', action: 'rate', videoId: props.transcript?.videoId ?? '', value })
  if (sent) rate.value = value
}

async function setCaptionMode(value: string): Promise<void> {
  if (!['both', 'english', 'translation', 'hidden'].includes(value)) return
  const next = value as 'both' | 'english' | 'translation' | 'hidden'
  const sent = await sendControl({ type: 'youtube:control', action: 'caption-mode', videoId: props.transcript?.videoId ?? '', value: next })
  if (sent) captionMode.value = next
}

async function learnSegment(segment: YouTubeTranscriptSegment): Promise<void> {
  if (!segment.translation) return
  savingSegmentId.value = segment.id; status.value = ''
  try { await englishApi.createLearningFromSource(segment.text, segment.translation, 'en-to-zh', 'youtube'); status.value = '已加入我的表達' }
  catch (error) { status.value = error instanceof Error ? error.message : '建立學習項目失敗' }
  finally { savingSegmentId.value = null }
}

async function lookupWord(token: string): Promise<void> {
  const word = cleanWord(token)
  if (!word || word.length < 2) return
  lookupBusy.value = true; lookupResult.value = null; status.value = ''
  try {
    const result = await englishApi.translate(word, undefined, 'lookup')
    if (result.ok && result.kind === 'lookup') lookupResult.value = result.lookup
    else if (!result.ok) status.value = result.message
  } catch (error) { status.value = error instanceof Error ? error.message : '查詢單字失敗' }
  finally { lookupBusy.value = false }
}

async function learnWord(): Promise<void> {
  if (!lookupResult.value) return
  savingWord.value = true; status.value = ''
  try {
    await englishApi.createLearningFromSource(lookupResult.value.term, lookupResult.value.meaning, 'en-to-zh', 'youtube-word')
    status.value = '單字已加入我的表達'
  } catch (error) { status.value = error instanceof Error ? error.message : '建立單字學習項目失敗' }
  finally { savingWord.value = false }
}

onMounted(() => {
  unsubs.push(englishApi.onYouTubeTranscriptSegment(({ videoId, segmentId, translation }) => {
    if (props.transcript?.videoId !== videoId) return
    const segment = props.transcript.segments.find((item) => item.id === segmentId); if (segment) segment.translation = translation
  }))
  unsubs.push(englishApi.onYouTubeTranscriptProgress(({ videoId, completed: value }) => { if (props.transcript?.videoId === videoId) completed.value = value }))
  unsubs.push(englishApi.onYouTubeTranscriptError(({ videoId, message }) => { if (!props.transcript || props.transcript.videoId === videoId) status.value = message }))
  unsubs.push(englishApi.onYouTubePlayerPosition(({ videoId, positionMs: value, playing: valuePlaying }) => {
    if (props.transcript?.videoId !== videoId) return
    positionMs.value = value; playing.value = valuePlaying
    const second = Math.floor(value / 1000)
    if (value > 0 && second % 5 === 0 && second !== lastPersistedSecond.value) { lastPersistedSecond.value = second; rememberVideo(value) }
  }))
})
watch(() => props.transcript?.videoId, () => { positionMs.value = 0; completed.value = 0; lastPersistedSecond.value = -1; lookupResult.value = null; status.value = '' })
onBeforeUnmount(() => unsubs.forEach((unsubscribe) => unsubscribe()))
</script>

<template>
  <div v-if="props.transcript" class="youtube-workspace">
    <div class="youtube-hero">
      <div>
        <div class="english-ui__text-overline english-ui__text-primary">YouTube · Learn from the moment</div>
        <div class="english-ui__text-h3 youtube-title">{{ props.transcript.title }}</div>
        <div class="english-ui__text-body2 english-ui__text-grey-5 english-ui__q-mt-sm">{{ props.transcript.language }} · {{ progressLabel }}</div>
      </div>
      <EnglishBadge color="positive" outline label="本機翻譯" />
    </div>

    <EnglishCard flat class="english-card youtube-control-card english-ui__q-mt-lg">
      <EnglishSection class="youtube-control-row">
        <EnglishButton round unelevated color="primary" :icon="playing ? 'pause' : 'play_arrow'" :aria-label="playing ? '暫停影片' : '播放影片'" @click="togglePlayback" />
        <div class="youtube-position"><div class="english-ui__text-caption english-ui__text-grey-5">目前位置</div><div class="english-ui__text-subtitle2">{{ timestamp(positionMs) }} · {{ activeSegmentId ? '同步中' : '等待影片' }}</div></div>
        <div class="youtube-control-group"><span class="english-ui__text-caption english-ui__text-grey-5">速度</span><EnglishChoice :model-value="rate" dense unelevated toggle-color="primary" :options="rateOptions" @update:model-value="setRate" /></div>
        <div class="youtube-control-group youtube-caption-toggle"><span class="english-ui__text-caption english-ui__text-grey-5">字幕</span><EnglishChoice :model-value="captionMode" dense unelevated toggle-color="primary" :options="captionOptions" @update:model-value="setCaptionMode" /></div>
      </EnglishSection>
      <EnglishSection class="youtube-control-hint">點任一句跳到影片位置；按「重播」反覆聽這一句。</EnglishSection>
    </EnglishCard>

    <div class="youtube-study-grid english-ui__q-mt-lg">
      <section class="youtube-transcript-column">
        <div class="youtube-section-heading"><div><div class="english-ui__text-overline english-ui__text-primary">Transcript</div><div class="english-ui__text-h6">逐句學習</div></div><EnglishInput v-model="query" outlined dense clearable label="搜尋字幕" class="youtube-search" /></div>
        <EnglishList bordered separator class="youtube-transcript-list english-ui__q-mt-md">
          <EnglishItem v-for="segment in segments" :key="segment.id" class="youtube-segment english-ui__q-py-md" :class="{ 'youtube-segment-active': activeSegmentId === segment.id }">
            <EnglishItemSection side top><button class="youtube-timestamp" :aria-label="`跳到 ${timestamp(segment.startMs)}`" @click="seek(segment)">{{ timestamp(segment.startMs) }}</button></EnglishItemSection>
            <EnglishItemSection>
              <EnglishItemLabel class="youtube-english-line">
                <template v-for="(token, index) in tokenize(segment.text)" :key="`${segment.id}-${index}`"><span v-if="/^\s+$/.test(token)">{{ token }}</span><button v-else class="youtube-word" @click="lookupWord(token)">{{ token }}</button></template>
              </EnglishItemLabel>
              <EnglishItemLabel v-if="segment.translation" caption class="youtube-translation-line english-ui__q-mt-sm">{{ segment.translation }}</EnglishItemLabel>
              <EnglishItemLabel v-else caption class="english-ui__q-mt-sm">翻譯中…</EnglishItemLabel>
            </EnglishItemSection>
            <EnglishItemSection side top class="youtube-segment-actions"><EnglishButton flat dense round icon="replay" color="primary" :aria-label="`重播 ${timestamp(segment.startMs)}`" @click="seek(segment, true)" /><EnglishButton v-if="segment.translation" flat dense color="primary" label="學這句" :loading="savingSegmentId === segment.id" @click="learnSegment(segment)" /></EnglishItemSection>
          </EnglishItem>
          <EnglishItem v-if="!segments.length"><EnglishItemSection class="english-ui__text-grey-5">沒有符合的逐字稿段落。</EnglishItemSection></EnglishItem>
        </EnglishList>
      </section>

      <aside class="youtube-side-column">
        <EnglishCard flat class="english-card youtube-lookup-card">
          <EnglishSection><div class="english-ui__text-overline english-ui__text-primary">Tap a word</div><div class="english-ui__text-h6">即時查詞</div><div v-if="lookupBusy" class="english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-md">本機模型查詢中…</div><template v-else-if="lookupResult"><div class="youtube-lookup-term english-ui__q-mt-md">{{ lookupResult.term }}</div><div class="english-ui__text-caption english-ui__text-grey-5">{{ lookupResult.ipa }}</div><div class="youtube-lookup-meaning english-ui__q-mt-sm">{{ lookupResult.meaning }}</div><div class="english-ui__text-caption english-ui__q-mt-md">{{ lookupResult.example }}</div><div class="english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-xs">{{ lookupResult.exampleTranslation }}</div><EnglishButton flat dense color="primary" class="english-ui__q-mt-md" label="學這個字" :loading="savingWord" @click="learnWord" /></template><div v-else class="english-ui__text-body2 english-ui__text-grey-5 english-ui__q-mt-md">點逐字稿中的英文單字，查看意思與例句。</div></EnglishSection>
        </EnglishCard>
        <EnglishCard flat class="english-card youtube-video-card english-ui__q-mt-md"><EnglishSection><div class="english-ui__row english-ui__items-center english-ui__justify-between"><div><div class="english-ui__text-overline english-ui__text-primary">Your video</div><div class="english-ui__text-subtitle1">影片進度</div></div><EnglishButton flat dense :icon="currentVideo?.favorite ? 'bookmark' : 'bookmark_border'" :label="currentVideo?.favorite ? '已收藏' : '收藏影片'" @click="toggleFavoriteVideo" /></div><EnglishProgress class="english-ui__q-mt-md" rounded size="7px" color="primary" track-color="grey-8" :value="videoProgress / 100" /><div class="english-ui__row english-ui__justify-between english-ui__text-caption english-ui__text-grey-5 english-ui__q-mt-sm"><span>{{ videoProgress }}% 已看</span><span>{{ timestamp(positionMs) }}</span></div></EnglishSection></EnglishCard>
        <EnglishCard flat class="english-card youtube-method-card english-ui__q-mt-md"><EnglishSection><div class="english-ui__text-overline english-ui__text-primary">Learning loop</div><div class="english-ui__text-subtitle1">看懂，再變成自己的句子</div><div class="english-ui__text-body2 english-ui__text-grey-5 english-ui__q-mt-sm">先用雙語字幕理解，再隱藏中文重聽；遇到真正想用的句子，就加入「我的表達」。</div><div class="youtube-loop-steps english-ui__q-mt-lg"><span>理解</span><span>重播</span><span>收藏</span><span>複習</span></div></EnglishSection></EnglishCard>
      </aside>
    </div>
    <div v-if="status" class="english-ui__q-mt-md youtube-status">{{ status }}</div>
  </div>
  <div v-else-if="props.error" class="youtube-empty">
    <div class="youtube-empty-mark youtube-empty-mark-error">!</div>
    <div class="english-ui__text-h5">這部影片沒有可用的英文逐字稿</div>
    <div class="english-ui__text-body2 english-ui__text-grey-5 english-ui__q-mt-sm">{{ props.error }}</div>
    <div class="english-ui__text-caption english-ui__text-grey-6 english-ui__q-mt-md">請確認 YouTube 已載入英文字幕，再重新從 Extension 開啟逐字稿。</div>
  </div>
  <div v-else class="youtube-empty">
    <div class="youtube-empty-mark">▶</div>
    <div class="english-ui__text-h5">把 YouTube 變成你的英文課本</div>
    <div class="english-ui__text-body2 english-ui__text-grey-5 english-ui__q-mt-sm">在 YouTube 開啟 Unus Extension，再選擇「閱讀完整逐字稿」。你會在這裡得到同步字幕、單字查詢與逐句練習。</div>
    <EnglishList v-if="recentVideos.length" bordered separator class="youtube-recent-list english-ui__q-mt-xl english-ui__text-left"><EnglishItem v-for="video in recentVideos" :key="video.videoId"><EnglishItemSection><EnglishItemLabel>{{ video.title }}</EnglishItemLabel><EnglishItemLabel caption>{{ video.favorite ? '已收藏' : '最近觀看' }} · {{ timestamp(video.lastPositionMs) }}</EnglishItemLabel></EnglishItemSection><EnglishItemSection side><EnglishIcon v-if="video.favorite" name="bookmark" color="primary" /></EnglishItemSection></EnglishItem></EnglishList>
  </div>
</template>
