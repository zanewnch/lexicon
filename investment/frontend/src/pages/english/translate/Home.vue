<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { englishApi } from '@/api/english'
import { EnglishButton, EnglishInput, EnglishCard, EnglishSection } from '@/features/english/ui'
const router = useRouter()
const source = ref(''), result = ref(''), status = ref('')
const busy = ref(false), saving = ref(false)
const recordId = ref<number | null>(null)
const direction = computed(() => /[\u3400-\u9fff]/.test(source.value) ? 'zh-to-en' : 'en-to-zh')
async function translate() {
  if (!source.value.trim()) { status.value = '請先輸入要翻譯的內容'; return }
  busy.value = true; status.value = ''; result.value = ''; recordId.value = null
  try {
    const response = await englishApi.translate(source.value.trim())
    if (!response.ok) throw new Error(response.message)
    if (response.kind === 'translation') { result.value = response.text; recordId.value = response.translationRecordId }
  } catch (error) { status.value = error instanceof Error ? error.message : '翻譯失敗' }
  finally { busy.value = false }
}
async function learn() {
  if (!recordId.value) return
  saving.value = true
  try { await englishApi.createLearningFromRecord(recordId.value); await router.push('/english/learn') }
  catch (error) { status.value = error instanceof Error ? error.message : '加入學習失敗' }
  finally { saving.value = false }
}
async function copy() { try { await navigator.clipboard.writeText(result.value); status.value = '已複製' } catch { status.value = '複製失敗，請手動選取文字' } }
</script>
<template><section class="english-translation"><h1>翻譯</h1><p class="english-translation__lead">輸入繁體中文或英文，使用本機模型翻譯成另一種語言。</p><form class="english-translation__form" @submit.prevent="translate"><EnglishInput v-model="source" type="textarea" autogrow :disable="busy" :label="direction === 'zh-to-en' ? '繁體中文內容' : '英文內容'" placeholder="輸入要翻譯的文字…" @keydown.enter.exact.prevent="translate" /><div class="english-translation__actions"><span>Enter 翻譯 · Shift+Enter 換行</span><EnglishButton type="submit" :loading="busy" label="翻譯" /></div></form><p v-if="status" role="status">{{ status }}</p><EnglishCard v-if="result"><EnglishSection><div class="english-translation__actions"><h2>{{ direction === 'zh-to-en' ? '英文' : '繁體中文' }}</h2><div><EnglishButton flat label="複製" @click="copy" /><EnglishButton :loading="saving" label="學這句" @click="learn" /></div></div><p class="english-translation__result">{{ result }}</p></EnglishSection></EnglishCard></section></template>
