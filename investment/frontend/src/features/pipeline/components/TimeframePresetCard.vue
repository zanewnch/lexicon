<script setup lang="ts">
defineProps<{
  presetKey: string
  label: string
  days: number
  description: string
  active: boolean
}>()

defineEmits<{
  (e: 'select'): void
}>()
</script>

<template>
  <div
    class="preset-card"
    :class="{ 'preset-card--active': active }"
    @click="$emit('select')"
  >
    <div class="preset-card__header">
      <span class="preset-card__label">{{ label }}</span>
      <span class="preset-card__days">{{ days }} 天</span>
    </div>
    <div class="preset-card__desc">{{ description }}</div>
  </div>
</template>

<style scoped lang="scss">
.preset-card {
  padding: var(--gap-lg);
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all var(--duration-fast);

  &:hover {
    border-color: var(--color-accent);
    transform: translateY(-2px);
  }

  &--active {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--gap-sm);
  }

  &__label {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  &__days {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}
</style>
