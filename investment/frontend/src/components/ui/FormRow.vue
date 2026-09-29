<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  cols?: number
  gap?: string
  wrap?: boolean
}>(), {
  cols: 0,
  gap: 'var(--gap-md)',
  wrap: true,
})

const rowStyle = computed<CSSProperties>(() => ({
  gap: props.gap,
  flexWrap: props.wrap ? 'wrap' : ('nowrap' as const),
  ...(props.cols > 0
    ? { display: 'grid', gridTemplateColumns: `repeat(${props.cols}, 1fr)` }
    : { display: 'flex' }),
}))
</script>

<template>
  <div class="form-row" :style="rowStyle">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.form-row {
  width: 100%;

  // 非 grid 模式：讓每個 FormField 平均分配空間
  :deep(.form-field) {
    flex: 1 1 0;
    min-width: 120px;
  }
}
</style>
