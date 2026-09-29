<script setup lang="ts">
export type BadgeVariant =
  | 'accent' | 'up' | 'down' | 'warn' | 'muted'
  | 'tse' | 'otc'
  | 'win' | 'loss' | 'even'
  | 'value' | 'swing' | 'daytrade' | 'event' | 'other'
  | 'pass' | 'fail'
  | 'active' | 'pending' | 'cancelled'

export type BadgeSize = 'sm' | 'md'

withDefaults(defineProps<{
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}>(), {
  variant: 'muted',
  size: 'sm',
  dot: false,
})
</script>

<template>
  <span class="badge-base" :class="[`badge-base--${variant}`, `badge-base--${size}`, { 'badge-base--dot': dot }]">
    <span v-if="dot" class="badge-base__dot" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
// ── Badge CSS variables (可於父層 override) ──────────────────
// --badge-bg, --badge-color, --badge-border, --badge-glow

.badge-base {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  white-space: nowrap;
  line-height: 1;
  background: var(--badge-bg);
  color: var(--badge-color);
  border-color: var(--badge-border, transparent);
  box-shadow: var(--badge-glow, none);
  transition: opacity var(--duration-fast);

  // ── Size ──────────────────────────────────────────
  &--sm { padding: 2px 7px; font-size: var(--font-size-xs); }
  &--md { padding: 4px 10px; font-size: var(--font-size-sm); }

  // ── Dot indicator ─────────────────────────────────
  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  // ── 漲跌色系 ──────────────────────────────────────
  &--up, &--win {
    --badge-bg: var(--color-up-soft);
    --badge-color: var(--color-up);
    --badge-glow: 0 0 8px var(--glow-up);
  }
  &--down, &--loss {
    --badge-bg: var(--color-down-soft);
    --badge-color: var(--color-down);
    --badge-glow: 0 0 8px var(--glow-down);
  }
  &--warn, &--even, &--pending {
    --badge-bg: var(--color-warn-soft);
    --badge-color: var(--color-warn);
  }

  // ── 中性 / 強調 ────────────────────────────────────
  &--accent, &--tse, &--active, &--pass {
    --badge-bg: var(--color-accent-soft);
    --badge-color: var(--color-accent);
  }
  &--muted, &--cancelled {
    --badge-bg: var(--color-bg-hover);
    --badge-color: var(--color-text-muted);
  }

  // ── 交易所 ─────────────────────────────────────────
  &--otc {
    --badge-bg: rgba(168, 85, 247, 0.15);
    --badge-color: #a855f7;
  }

  // ── 盈虧平 ─────────────────────────────────────────
  &--fail {
    --badge-bg: var(--color-down-soft);
    --badge-color: var(--color-down);
  }

  // ── 策略類型 ───────────────────────────────────────
  &--value   { --badge-bg: rgba(59, 130, 246, 0.12); --badge-color: #60a5fa; }
  &--swing   { --badge-bg: rgba(34, 197, 94, 0.12);  --badge-color: #4ade80; }
  &--daytrade{ --badge-bg: rgba(239, 68, 68, 0.12);  --badge-color: #f87171; }
  &--event   { --badge-bg: rgba(245, 158, 11, 0.12); --badge-color: #fbbf24; }
  &--other   { --badge-bg: var(--color-bg-hover);    --badge-color: var(--color-text-secondary); }
}
</style>
