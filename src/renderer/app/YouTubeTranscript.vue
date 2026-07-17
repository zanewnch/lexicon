<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ transcript: YouTubeTranscript | null }>()
const completed = ref(0)
const query = ref('')
const savingSegmentId = ref<string | null>(null)
const status = ref('')
const unsubs: Array<() => void> = []

const segments = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (!props.transcript) return []
  return text ? props.transcript.segments.filter((segment) => `${segment.text} ${segment.translation ?? ''}`.toLowerCase().includes(text)) : props.transcript.segments
})
const progressLabel = computed(() => props.transcript ? `${completed.value} / ${props.transcript.segments.length} 段已翻譯` : '')
function timestamp(milliseconds: number): string { const seconds = Math.floor(milliseconds / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
async function learnSegment(segment: YouTubeTranscriptSegment): Promise<void> {
  if (!segment.translation) return
  savingSegmentId.value = segment.id; status.value = ''
  try { await window.api.createLearningFromSource(segment.text, segment.translation, 'en-to-zh', 'youtube'); status.value = '已加入我的表達' }
  catch (error) { status.value = error instanceof Error ? error.message : '建立學習項目失敗' }
  finally { savingSegmentId.value = null }
}

onMounted(() => {
  unsubs.push(window.api.onYouTubeTranscriptSegment(({ videoId, segmentId, translation }) => {
    if (props.transcript?.videoId !== videoId) return
    const segment = props.transcript.segments.find((item) => item.id === segmentId); if (segment) segment.translation = translation
  }))
  unsubs.push(window.api.onYouTubeTranscriptProgress(({ videoId, completed: value }) => { if (props.transcript?.videoId === videoId) completed.value = value }))
})
onBeforeUnmount(() => unsubs.forEach((unsubscribe) => unsubscribe()))
</script>

<template>
  <div v-if="props.transcript">
    <div class="row items-start justify-between q-col-gutter-md"><div><div class="text-overline text-primary">YouTube · Local translation</div><div class="text-h4">{{ props.transcript.title }}</div><div class="text-body2 text-grey-5 q-mt-sm">{{ props.transcript.language }} · {{ progressLabel }}</div></div><q-badge color="positive" outline label="背景翻譯中" /></div>
    <q-input v-model="query" outlined dense clearable class="q-mt-lg" label="搜尋逐字稿" />
    <q-list bordered separator class="q-mt-md rounded-borders"><q-item v-for="segment in segments" :key="segment.id" class="q-py-md items-start"><q-item-section side top><q-badge outline color="primary" :label="timestamp(segment.startMs)" /></q-item-section><q-item-section><q-item-label>{{ segment.text }}</q-item-label><q-item-label v-if="segment.translation" caption class="q-mt-sm text-body2">{{ segment.translation }}</q-item-label><q-item-label v-else caption class="q-mt-sm">翻譯中…</q-item-label></q-item-section><q-item-section v-if="segment.translation" side top><q-btn flat dense color="primary" :loading="savingSegmentId === segment.id" label="學這句" @click="learnSegment(segment)" /></q-item-section></q-item><q-item v-if="!segments.length"><q-item-section class="text-grey-5">沒有符合的逐字稿段落。</q-item-section></q-item></q-list>
    <div v-if="status" class="q-mt-md text-positive">{{ status }}</div>
  </div>
  <q-card v-else flat class="lexicon-card"><q-card-section><div class="text-h6">尚未收到 YouTube 逐字稿</div><div class="text-caption text-grey-5 q-mt-sm">在 YouTube 點 Lexicon Extension 圖示後，完整逐字稿會出現在這裡。</div></q-card-section></q-card>
</template>
