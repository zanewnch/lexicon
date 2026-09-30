<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
function escape(event: KeyboardEvent) { if (event.key === 'Escape') emit('update:modelValue', false) }
onMounted(() => document.addEventListener('keydown', escape))
onUnmounted(() => document.removeEventListener('keydown', escape))
</script>
<template><Teleport to="body"><div v-if="modelValue" class="english-workspace english-dialog" role="dialog" aria-modal="true" aria-label="今日學習完成" @click.self="emit('update:modelValue', false)"><div class="english-dialog__content"><slot /><button class="english-dialog__close" aria-label="關閉" @click="emit('update:modelValue', false)">×</button></div></div></Teleport></template>
