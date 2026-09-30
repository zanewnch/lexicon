<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { englishApi, initializeEnglishApi } from '@/api/english'
import Button from '@/components/ui/Button.vue'
import '@/features/english/english.scss'
const message = ref('')
let unsubscribe: (() => void) | undefined
async function refresh() {
  try {
    await initializeEnglishApi()
    const model = await englishApi.getModelStatus()
    message.value = !model.exists ? '尚未下載模型，請至設定 → 英文平台下載。既有學習資料仍可瀏覽。' : model.runtimeState === 'error' ? model.message ?? '模型載入失敗，請至設定重新選擇模型。' : model.runtimeState === 'loading' ? '本機模型載入中…' : ''
  } catch (error) { message.value = error instanceof Error ? error.message : '請先啟動 Unus' }
}
onMounted(() => { void refresh(); unsubscribe = englishApi.onModelReady(() => void refresh()) })
onUnmounted(() => unsubscribe?.())
</script>
<template><div class="english-workspace"><div v-if="message" class="english-workspace__status" role="status"><span>{{ message }}</span><RouterLink to="/settings?tab=english">英文設定</RouterLink><Button size="sm" @click="refresh">重試</Button></div><RouterView /></div></template>
