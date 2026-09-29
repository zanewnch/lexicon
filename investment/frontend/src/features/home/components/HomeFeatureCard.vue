<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  icon: Component
  iconColor?: string
  title: string
  description: string
  to: string
  badge?: string | number
  highlight?: string
  highlightColor?: 'positive' | 'negative' | 'neutral'
}>()
</script>

<template>
  <RouterLink :to="props.to" class="home-feature-card">
    <div class="home-feature-card__header">
      <span class="home-feature-card__icon" :style="props.iconColor ? { color: props.iconColor } : {}">
        <component :is="props.icon" :size="22" />
      </span>
      <span v-if="props.badge != null" class="home-feature-card__badge">{{ props.badge }}</span>
    </div>
    <div class="home-feature-card__body">
      <span class="home-feature-card__title">{{ props.title }}</span>
      <span class="home-feature-card__desc">{{ props.description }}</span>
    </div>
    <div
      v-if="props.highlight"
      class="home-feature-card__highlight"
      :class="`home-feature-card__highlight--${props.highlightColor ?? 'neutral'}`"
    >
      {{ props.highlight }}
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
.home-feature-card {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  padding: var(--gap-lg);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition:
    border-color 0.2s var(--ease-smooth),
    background 0.2s var(--ease-smooth),
    transform 0.2s var(--ease-smooth),
    box-shadow 0.2s var(--ease-smooth);

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-bg-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-hover);
    color: var(--color-accent); // fallback, overridden by inline style when iconColor is set
    flex-shrink: 0;
  }

  &__badge {
    font-size: var(--font-size-xs);
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--color-accent);
    color: var(--color-bg);
    font-variant-numeric: tabular-nums;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: var(--font-size-base);
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  &__highlight {
    font-size: var(--font-size-sm);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    margin-top: auto;
    padding-top: var(--gap-sm);
    border-top: 1px solid var(--color-border);

    &--positive { color: var(--color-up); }
    &--negative { color: var(--color-down); }
    &--neutral  { color: var(--color-text-secondary); }
  }
}
</style>
