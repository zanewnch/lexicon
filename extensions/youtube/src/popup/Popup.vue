<script setup lang="ts">
import { ref } from 'vue'
const status = ref('')
async function openTranscript(): Promise<void> { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (!tab?.id || !tab.url?.startsWith('https://www.youtube.com/')) { status.value = '請先開啟 YouTube 影片。'; return }; await chrome.tabs.sendMessage(tab.id, { type: 'transcript:collect' }); window.close() }
</script>
<template><main><div class="brand">Lexicon</div><h1>YouTube 字幕</h1><p>使用本機模型即時翻譯英文字幕。</p><button @click="openTranscript">閱讀完整逐字稿</button><small v-if="status">{{ status }}</small></main></template>
<style scoped>main{width:260px;padding:16px;background:#0f172a;color:#e2e8f0;font-family:system-ui}.brand{color:#38bdf8;font-weight:700}h1{font-size:18px;margin:8px 0}p,small{display:block;color:#94a3b8;font-size:13px;line-height:1.5}button{width:100%;margin-top:8px;padding:9px;border:0;border-radius:7px;background:#0ea5e9;color:#fff;font-weight:700;cursor:pointer}</style>
