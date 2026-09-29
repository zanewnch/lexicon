<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label?: string
  value?: string | number
  sub?: string
  valueClass?: string
}>()

const flashClass = ref('')

watch(() => props.value, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    flashClass.value = 'flash'
    setTimeout(() => {
      flashClass.value = ''
    }, 300)
  }
})
</script>

<template>
  <div class="stat-card">
    <span class="stat-card__label">
      <slot name="label">{{ label }}</slot>
    </span>
    <span class="stat-card__value" :class="[valueClass, flashClass]">
      <slot>{{ value }}</slot>
    </span>
    <span v-if="$slots.sub || sub" class="stat-card__sub">
      <slot name="sub">{{ sub }}</slot>
    </span>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 100%), var(--glass-bg, var(--color-bg-card));
  border: 1px solid var(--glass-border, var(--color-border));
  border-top-color: rgba(255, 255, 255, 0.08);
  border-left-color: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.04);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: transform var(--duration-fast), filter var(--duration-fast);
    transform-origin: left center;
  }

  &__value.flash {
    transform: scale(1.1);
    filter: brightness(1.5) drop-shadow(0 0 4px var(--glow-accent));
  }

  &__sub {
    font-size: var(--font-size-sm);
  }
}
</style>
