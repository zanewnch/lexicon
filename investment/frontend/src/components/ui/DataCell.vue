<script setup lang="ts">
/**
 * DataCell — 資料格結服載入元件
 *
 * 當 `loading` 為 true 時顯示 Skeleton 占位動畫，
 * 資料載入完成後透過 <slot> 顯示實際內容。
 * 常用於表格中每個數字格的載入狀態控制。
 *
 * @example
 * ```vue
 * <DataCell :loading="isLoading" width="80px">
 *   {{ stock.price }}
 * </DataCell>
 * ```
 */
import SkeletonBlock from './SkeletonBlock.vue'

withDefaults(
  defineProps<{
    loading?: boolean
    width?: string
  }>(),
  {
    loading: false,
    width: '60px',
  },
)
</script>

<template>
  <SkeletonBlock v-if="loading" :width="width" height="14px" />
  <slot v-else />
</template>
