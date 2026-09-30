<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { englishApi } from '@/api/english'
import type { YouTubeTranscript as Transcript } from '@/types/englishYoutube'
import YouTubeTranscript from '@/features/english/components/YouTubeTranscript.vue'
const transcript = ref<Transcript | null>(null), error = ref('')
const unsubs = [
  englishApi.onYouTubeTranscriptOpen((value) => { transcript.value = value; error.value = '' }),
  englishApi.onYouTubeTranscriptError((value) => { error.value = value.message })
]
onUnmounted(() => unsubs.forEach((unsubscribe) => unsubscribe()))
</script>
<template><section><YouTubeTranscript :transcript="transcript" :error="error" /></section></template>
