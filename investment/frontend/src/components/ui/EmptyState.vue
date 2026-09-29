<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  message?: string
  icon?: string
  minHeight?: string
}>(), {
  loading: false,
  message: '暫無資料',
  icon: '',
  minHeight: '80px',
})
</script>

<template>
  <div class="empty-state" :style="minHeight ? { '--empty-min-height': minHeight } : undefined">
    <template v-if="loading">
      <span class="empty-state__spinner" />
      <span class="empty-state__text">載入中...</span>
    </template>
    <template v-else>
      <span v-if="icon || $slots.icon" class="empty-state__icon">
        <slot name="icon">{{ icon }}</slot>
      </span>
      <span class="empty-state__text">
        <slot>{{ message }}</slot>
      </span>
      <div v-if="$slots.action" class="empty-state__action">
        <slot name="action" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
// ── EmptyState CSS variables ──────────────────────────────
// --empty-min-height    最小高度（預設 80px）
// --empty-icon-size     icon 字型大小

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-sm);
  min-height: var(--empty-min-height, 80px);
  padding: var(--gap-lg) var(--gap-md);
  text-align: center;

  &__icon {
    font-size: var(--empty-icon-size, 32px);
    opacity: 0.4;
    line-height: 1;
  }

  &__text {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
  }

  &__action {
    margin-top: var(--gap-xs);
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: empty-spin 0.8s linear infinite;
  }
}

@keyframes empty-spin {
  to { transform: rotate(360deg); }
}
</style>
