<script setup lang="ts">
withDefaults(defineProps<{
  hoverable?: boolean
  loading?: boolean
  padding?: string
  noBorder?: boolean
}>(), {
  hoverable: true,
  loading: false,
  noBorder: false,
})
</script>

<template>
  <div
    class="card"
    :class="{
      'card--no-hover': !hoverable,
      'card--loading': loading,
      'card--no-border': noBorder,
    }"
    :style="padding ? { '--card-padding': padding } : undefined"
  >
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>

    <div class="card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
// ── Card CSS variables (可於父層 override) ───────────────────
// --card-padding        內距 (default: 20px)
// --card-radius         圓角
// --card-bg             背景色
// --card-border-color   邊框色
// --card-shadow         陰影

.card {
  background: var(--card-bg,
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0.00) 100%
    ),
    var(--glass-bg, var(--color-bg-card))
  );
  border: 1px solid var(--card-border-color, var(--glass-border, var(--color-border)));
  border-top-color: rgba(255, 255, 255, 0.08);
  border-left-color: rgba(255, 255, 255, 0.04);
  border-radius: var(--card-radius, var(--radius-lg));
  padding: var(--card-padding, 20px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition:
    transform 0.3s var(--ease-spring),
    box-shadow 0.3s var(--ease-smooth),
    border-color 0.3s var(--ease-smooth),
    background var(--duration-normal) var(--ease-default);

  &:not(.card--no-hover):hover {
    transform: translateY(-3px) scale(1.005);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.2),
      0 0 24px var(--glow-accent),
      inset 0 1px 1px rgba(255, 255, 255, 0.08);
    border-color: var(--color-border-hover);
    border-top-color: rgba(255, 255, 255, 0.15);
    border-left-color: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  &--loading {
    opacity: 0.5;
    pointer-events: none;
  }

  &--no-border {
    border-color: transparent;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--gap-md);
    font-size: var(--font-size-md);
    font-weight: 600;
  }

  &__body {
    // flex container 由外層決定
  }

  &__footer {
    margin-top: var(--gap-md);
    padding-top: var(--gap-md);
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--gap-sm);
  }
}
</style>
