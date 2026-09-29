<script setup lang="ts">
import { ref } from 'vue'
import type { SignalKey, EntryParams } from '@/types/pipeline'

defineProps<{
  signalKey: SignalKey
  label: string
  checked: boolean
  params: EntryParams
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'param-change', key: keyof EntryParams, value: number): void
}>()

const expanded = ref(false)

const PARAM_FIELDS: Record<SignalKey, { key: keyof EntryParams; label: string }[]> = {
  ma_cross: [
    { key: 'ma_short', label: '短期 MA' },
    { key: 'ma_long', label: '長期 MA' },
  ],
  macd: [
    { key: 'macd_fast', label: 'Fast' },
    { key: 'macd_slow', label: 'Slow' },
    { key: 'macd_signal', label: 'Signal' },
  ],
  kd: [{ key: 'kd_period', label: '週期' }],
  breakout: [{ key: 'breakout_lookback', label: 'N 日' }],
}
</script>

<template>
  <div class="signal-row">
    <label class="signal-row__main">
      <input type="checkbox" :checked="checked" @change="emit('toggle')" />
      <span class="signal-row__label">{{ label }}</span>
      <button type="button" class="signal-row__toggle" @click.prevent="expanded = !expanded">
        進階 {{ expanded ? '▲' : '▼' }}
      </button>
    </label>
    <div v-if="expanded" class="signal-row__params">
      <div v-for="field in PARAM_FIELDS[signalKey]" :key="field.key" class="signal-row__field">
        <label>{{ field.label }}</label>
        <input
          type="number"
          :value="params[field.key]"
          min="1"
          @input="emit('param-change', field.key, Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.signal-row {
  padding: var(--gap-md);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--glass-bg);

  &__main {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    cursor: pointer;
  }

  &__label {
    flex: 1;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  &__toggle {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: var(--color-text-muted);
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
  }

  &__params {
    display: flex;
    gap: var(--gap-md);
    margin-top: var(--gap-md);
    padding-top: var(--gap-md);
    border-top: 1px dashed var(--glass-border);
    flex-wrap: wrap;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    input {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      color: var(--color-text-primary);
    }
  }
}
</style>
