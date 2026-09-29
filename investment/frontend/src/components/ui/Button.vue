<script setup lang="ts">
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
}>(), {
  variant: 'secondary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  block: false,
})

defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template>
  <button
    class="btn-base"
    :class="[
      `btn-base--${variant}`,
      `btn-base--${size}`,
      { 'btn-base--loading': loading, 'btn-base--block': block }
    ]"
    :type="type"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-base__spinner" aria-hidden="true" />
    <span v-if="$slots.icon && !loading" class="btn-base__icon">
      <slot name="icon" />
    </span>
    <slot />
  </button>
</template>

<style scoped lang="scss">
// ── Button CSS variables (可於父層 override) ─────────────────
// --btn-bg, --btn-color, --btn-border, --btn-hover-bg, --btn-hover-color

.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background var(--duration-fast),
    color var(--duration-fast),
    border-color var(--duration-fast),
    opacity var(--duration-fast),
    transform 0.15s var(--ease-spring);

  background: var(--btn-bg, transparent);
  color: var(--btn-color, var(--color-text-primary));
  border-color: var(--btn-border, transparent);

  &:hover:not(:disabled) {
    background: var(--btn-hover-bg, var(--btn-bg));
    color: var(--btn-hover-color, var(--btn-color));
  }
  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  // ── Size ─────────────────────────────────────────
  &--sm  { padding: var(--btn-padding-sm);  min-height: var(--btn-height-sm);  font-size: var(--btn-font-sm); }
  &--md  { padding: var(--btn-padding-md);  min-height: var(--btn-height-md);  font-size: var(--btn-font-md); }
  &--lg  { padding: var(--btn-padding-lg);  min-height: var(--btn-height-lg);  font-size: var(--btn-font-lg); }

  // ── Block ─────────────────────────────────────────
  &--block { width: 100%; }

  // ── Variant ──────────────────────────────────────
  &--primary {
    --btn-bg: var(--color-accent);
    --btn-color: #fff;
    --btn-hover-bg: var(--color-accent-hover);
    --btn-hover-color: #fff;
  }
  &--secondary {
    --btn-bg: var(--color-bg-secondary);
    --btn-color: var(--color-text-secondary);
    --btn-border: var(--color-border);
    --btn-hover-bg: var(--color-bg-hover);
    --btn-hover-color: var(--color-text-primary);
  }
  &--ghost {
    --btn-bg: transparent;
    --btn-color: var(--color-text-secondary);
    --btn-hover-bg: var(--color-bg-hover);
    --btn-hover-color: var(--color-text-primary);
  }
  &--danger {
    --btn-bg: var(--color-down-soft);
    --btn-color: var(--color-down);
    --btn-hover-bg: var(--color-down-soft);
  }

  // ── Loading ───────────────────────────────────────
  &--loading { opacity: 0.7; cursor: wait; }

  &__spinner {
    width: 13px;
    height: 13px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: btn-spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    font-style: normal;
  }
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>
