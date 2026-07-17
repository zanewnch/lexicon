<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { initializeTheme } from '../theme'
import { detectTranslationDirection, getDirectionLabels } from '../../shared/translationDirection'
import { isEnglishLookupQuery, type LookupResult } from '../../shared/lookup'

initializeTheme()

const source = ref('')
const sourceInput = ref<HTMLTextAreaElement | null>(null)
const result = ref('')
const lookup = ref<LookupResult | null>(null)
const status = ref('')
const busy = ref(false)
const sessionId = ref(0)
const labels = computed(() => getDirectionLabels(detectTranslationDirection(source.value)))
let unsubscribe: (() => void) | undefined

async function translate(): Promise<void> {
  const id = sessionId.value
  const text = source.value.trim()
  if (!text) {
    status.value = '請先輸入要翻譯的內容'
    return
  }

  const lookupMode = isEnglishLookupQuery(text)
  busy.value = true
  result.value = ''
  lookup.value = null
  status.value = lookupMode ? 'Gemma 4 查詞中…' : 'Gemma 4 翻譯中…'

  try {
    const response = await window.api.translate(text, id, lookupMode ? 'lookup' : 'translation')
    if (id !== sessionId.value) return
    if (!response.ok) {
      status.value = response.message
      return
    }

    if (response.kind === 'lookup') {
      lookup.value = response.lookup
      window.api.resizePopup(600)
    } else {
      result.value = response.text
      window.api.resizePopup(540)
    }
    status.value = ''
  } catch (error) {
    status.value = error instanceof Error ? error.message : '翻譯失敗，請重試'
  } finally {
    if (id === sessionId.value) busy.value = false
  }
}

async function copy(): Promise<void> {
  const text = lookup.value
    ? `${lookup.value.term}\n${lookup.value.ipa}\n\n${lookup.value.meaning}\n\n${lookup.value.example}\n${lookup.value.exampleTranslation}`
    : result.value
  await navigator.clipboard.writeText(text)
  status.value = lookup.value ? '已複製查詞結果' : '已複製翻譯結果'
}

function close(): void { window.api.closePopup() }

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]'))
}

function focusSourceOnEnter(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.defaultPrevented || busy.value || isInteractiveTarget(event.target)) return
  event.preventDefault()
  sourceInput.value?.focus()
}

function escape(event: KeyboardEvent): void {
  if (event.key === 'Escape') window.api.closePopup()
}

function closeWhenBlurred(): void {
  window.api.closePopup()
}

onMounted(() => {
  unsubscribe = window.api.onOpenPopup(({ text, source: origin }) => {
    sessionId.value += 1
    source.value = text ?? ''
    result.value = ''
    lookup.value = null
    status.value = origin === 'selection' ? '已取得選取文字，查詢中…' : ''
    window.api.resizePopup(304)
    if (text) void translate()
  })
  window.addEventListener('blur', closeWhenBlurred)
  document.addEventListener('keydown', escape)
  document.addEventListener('keydown', focusSourceOnEnter)
})

onUnmounted(() => {
  unsubscribe?.()
  window.removeEventListener('blur', closeWhenBlurred)
  document.removeEventListener('keydown', escape)
  document.removeEventListener('keydown', focusSourceOnEnter)
})
</script>

<template>
  <div class="lexicon-popup">
    <header class="popup-header">
      <div>
        <div class="popup-product">LEXICON</div>
        <h1 class="popup-title">{{ labels.title }}</h1>
      </div>
      <q-btn class="popup-close" flat round dense icon="close" aria-label="關閉" @click="close" />
    </header>

    <q-form class="popup-form" @submit="translate">
      <label class="popup-field-label" for="translation-source">要翻譯的{{ labels.sourceLanguage }}</label>
      <textarea id="translation-source" ref="sourceInput" v-model="source" class="popup-source" :placeholder="labels.placeholder" :disabled="busy" @keydown.enter.exact.prevent="translate" />
      <div class="popup-actions">
        <span class="popup-shortcut"><kbd>Enter</kbd> 翻譯 <span aria-hidden="true">·</span> <kbd>Shift + Enter</kbd> 換行</span>
        <q-btn class="popup-submit" unelevated no-caps color="primary" :loading="busy" label="翻譯" type="submit" />
      </div>
    </q-form>

    <div v-if="status" class="popup-status">{{ status }}</div>

    <q-card v-if="lookup" flat class="lexicon-card lookup-result q-mt-md">
      <q-card-section class="row justify-between items-start">
        <div>
          <div class="text-h4 lookup-term">{{ lookup.term }}</div>
          <div class="lookup-ipa">{{ lookup.ipa }}</div>
        </div>
        <q-btn flat dense color="primary" label="複製" @click="copy" />
      </q-card-section>
      <q-card-section class="lookup-meaning">{{ lookup.meaning }}</q-card-section>
      <q-separator />
      <q-card-section>
        <div class="lookup-example-label">Example</div>
        <div class="lookup-example">{{ lookup.example }}</div>
        <div class="lookup-example-translation">{{ lookup.exampleTranslation }}</div>
      </q-card-section>
    </q-card>

    <q-card v-else-if="result" flat class="lexicon-card q-mt-md">
      <q-card-section class="row justify-between">
        <q-badge color="positive" :label="labels.targetLanguage" />
        <q-btn flat dense label="複製" color="primary" @click="copy" />
      </q-card-section>
      <q-card-section class="lexicon-result">{{ result }}</q-card-section>
    </q-card>
  </div>
</template>
