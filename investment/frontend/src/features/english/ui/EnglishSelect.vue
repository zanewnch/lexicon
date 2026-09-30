<script setup lang="ts">
withDefaults(defineProps<{ modelValue?: string | number; options?: Array<{ label: string; value: string | number }>; label?: string; disable?: boolean; loading?: boolean }>(), { options: () => [] })
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
function update(event: Event, options: Array<{ label: string; value: string | number }>) {
  const selected = options.find((item) => String(item.value) === (event.target as HTMLSelectElement).value)
  if (selected) emit('update:modelValue', selected.value)
}
</script>
<template><label class="english-input"><span v-if="label" class="english-input__label">{{ label }}</span><select class="english-input__control" :value="modelValue" :disabled="disable || loading" @change="update($event, options)"><option v-if="!options.some(item => item.value === modelValue)" value="" disabled>請選擇</option><option v-for="item in options" :key="item.value" :value="item.value">{{ item.label }}</option></select></label></template>
