<script setup lang="ts">
import { ref } from 'vue'
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ modelValue?: string | number; label?: string; type?: string; disable?: boolean; readonly?: boolean; placeholder?: string; autogrow?: boolean }>(), { modelValue: '', type: 'text' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const input = ref<HTMLInputElement | HTMLTextAreaElement>()
function update(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
  if (target instanceof HTMLTextAreaElement) { target.style.height = 'auto'; target.style.height = `${target.scrollHeight}px` }
}
defineExpose({ focus: () => input.value?.focus() })
</script>
<template>
  <label class="english-input" :class="$attrs.class as string">
    <span v-if="label" class="english-input__label">{{ label }}</span>
    <component :is="type === 'textarea' ? 'textarea' : 'input'" ref="input" v-bind="{ ...$attrs, class: undefined }" class="english-input__control" :type="type === 'textarea' ? undefined : type" :value="modelValue" :disabled="disable" :readonly="readonly" :placeholder="placeholder" :rows="autogrow ? 3 : 5" @input="update" />
  </label>
</template>
