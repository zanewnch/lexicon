<script setup lang="ts">
/**
 * SkeletonWrap — 骨架屏 / 內容切換包裝元件
 *
 * 接受兩個 named slot：
 * - `#skeleton` — `loading` 為 true 時顯示的骨架屏
 * - `#default` — `loading` 為 false 時顯示的實際內容
 *
 * 使用 `display: contents` 使包裝層不影響布局。
 *
 * @example
 * ```vue
 * <SkeletonWrap :loading="isLoading">
 *   <template #skeleton><SkeletonLoader :count="3" /></template>
 *   <MyTable :data="data" />
 * </SkeletonWrap>
 * ```
 */
defineProps<{
  loading: boolean
}>()
</script>

<template>
  <div class="skeleton-wrap">
    <template v-if="loading">
      <slot name="skeleton" />
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<style scoped lang="scss">
.skeleton-wrap {
  display: contents;
}
</style>
