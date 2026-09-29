<script setup lang="ts">
/**
 * SkeletonBlock — 單一骨架屏動畫塊
 *
 * 最基礎的載入占位元件，具備橫向流光 shimmer 動畫。
 * 支援自訂 `width`、`height`、`borderRadius`，
 * 可以穮入任何位置模擬內容輪廓。
 *
 * @example
 * ```vue
 * <SkeletonBlock width="120px" height="14px" radius="4px" />
 * ```
 */
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
  }>(),
  {
    width: '100%',
    height: '16px',
    radius: '4px',
  },
)
</script>

<template>
  <div
    class="skeleton-block"
    :style="{ width, height, borderRadius: radius }"
  />
</template>

<style scoped lang="scss">
.skeleton-block {
  background: linear-gradient(
    90deg,
    var(--color-bg-hover) 25%,
    var(--color-border) 50%,
    var(--color-bg-hover) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
