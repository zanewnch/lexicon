<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  value?: string | number
  valueClass?: string
  size?: 'md' | 'lg'
}>(), {
  size: 'md',
})
</script>

<template>
  <div class="summary-item-base" :class="`summary-item-base--${size}`">
    <span class="summary-item-base__label">
      <slot name="label">{{ label }}</slot>
    </span>
    <span class="summary-item-base__value" :class="valueClass">
      <slot>{{ value }}</slot>
    </span>
  </div>
</template>

<style scoped lang="scss">
.summary-item-base {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    small {
      font-size: var(--font-size-base);
      font-weight: 500;
      margin-left: 4px;
    }
  }

  &--md &__value {
    font-size: var(--font-size-lg);
  }

  &--lg &__value {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.3px;
    line-height: 1.2;

    small {
      font-size: var(--font-size-sm);
      font-weight: 600;
      margin-left: 6px;
      opacity: 0.8;
    }
  }
}
</style>
