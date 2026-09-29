<script setup lang="ts">
/**
 * SkeletonLoader — 多類型骨架屏元件
 *
 * 支援四種外觀變體（`variant` prop）：
 * - `'text'` — 一般文字行（預設）
 * - `'card'` — 卡片區塊，圓角較大
 * - `'chart'` — 圖表區塊
 * - `'circle'` — 圓形（適合頭像占位）
 *
 * `count` prop 可一次渲染多個骨架，每個動畫延遲依序叠加，
 * 產生癌波式載入效果。
 */
withDefaults(
  defineProps<{
    width?: string
    height?: string
    variant?: 'text' | 'card' | 'chart' | 'circle'
    count?: number
  }>(),
  {
    width: '100%',
    height: '16px',
    variant: 'text',
    count: 1,
  },
)
</script>

<template>
  <div class="skeleton-group" :class="`skeleton-group--${variant}`">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton"
      :class="`skeleton--${variant}`"
      :style="{
        width: variant === 'circle' ? height : width,
        height,
        animationDelay: `${i * 0.1}s`,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &--card {
    gap: var(--gap-md);
  }
}

.skeleton {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg-hover) 25%,
    var(--color-bg-active) 50%,
    var(--color-bg-hover) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease infinite;

  &--card {
    border-radius: var(--radius-lg);
  }

  &--chart {
    border-radius: var(--radius-md);
  }

  &--circle {
    border-radius: 50%;
  }
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
