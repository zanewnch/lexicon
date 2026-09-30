<script setup lang="ts">
defineProps<{ modelValue?: any; options?: Array<{ label: string; value: any }>; label?: string; toggle?: boolean; disable?: boolean; inline?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
</script>
<template><div class="english-choice" :class="{ 'english-choice--inline': inline || toggle }"><template v-if="options"><label v-for="item in options" :key="String(item.value)" class="english-choice__item"><input type="radio" :checked="modelValue === item.value" :disabled="disable" @change="emit('update:modelValue', item.value)" />{{ item.label }}</label></template><label v-else class="english-choice__item"><input type="checkbox" :checked="Boolean(modelValue)" :disabled="disable" @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />{{ label }}</label></div></template>
