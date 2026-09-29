<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/layout/PageHeader.vue'
import StepStepper from '@/features/pipeline/components/StepStepper.vue'
import TimeframePresetCard from '@/features/pipeline/components/TimeframePresetCard.vue'
import { usePipelineStore } from '@/stores/pipelineStore'
import { TIMEFRAME_PRESETS, type TimeframePreset } from '@/types/pipeline'

const router = useRouter()
const store = usePipelineStore()
const { state } = storeToRefs(store)

store.setStep(2)

const customDays = ref(state.value.timeframe.preset === 'custom' ? state.value.timeframe.days : 30)

const PRESET_KEYS: Exclude<TimeframePreset, 'custom'>[] = ['short', 'mid', 'long']

function selectPreset(key: TimeframePreset) {
  if (key === 'custom') {
    store.setCustomDays(customDays.value)
  } else {
    store.setTimeframePreset(key)
  }
}

function onCustomDaysInput(v: string) {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return
  customDays.value = n
  if (state.value.timeframe.preset === 'custom') {
    store.setCustomDays(n)
  }
}

function next() {
  router.push('/analysis/pipeline/step3')
}
</script>

<template>
  <div class="step2">
    <PageHeader title="策略流程" subtitle="第 2 步 — 選週期" />
    <StepStepper :current="2" />

    <div class="step2__grid">
      <TimeframePresetCard
        v-for="key in PRESET_KEYS"
        :key="key"
        :preset-key="key"
        :label="TIMEFRAME_PRESETS[key].label"
        :days="TIMEFRAME_PRESETS[key].days"
        :description="TIMEFRAME_PRESETS[key].description"
        :active="state.timeframe.preset === key"
        @select="selectPreset(key)"
      />

      <div
        class="custom-card"
        :class="{ 'custom-card--active': state.timeframe.preset === 'custom' }"
        @click="selectPreset('custom')"
      >
        <div class="custom-card__label">自訂</div>
        <div class="custom-card__input">
          <input
            type="number"
            min="1"
            :value="customDays"
            @input="onCustomDaysInput(($event.target as HTMLInputElement).value)"
          />
          <span>天</span>
        </div>
      </div>
    </div>

    <div class="step2__hint">
      週期會決定 Step 3 的指標預設參數（短線用 5/20MA、波段用 20/60MA、長線用 60/240MA）。
    </div>

    <div class="step2__nav">
      <button class="step2__back" @click="router.push('/analysis/pipeline/step1')">← 上一步</button>
      <button class="step2__next" @click="next">下一步：進場時機 →</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step2 {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--gap-md);
    margin-bottom: var(--gap-lg);
  }

  &__hint {
    background: var(--color-accent-soft);
    color: var(--color-text-secondary);
    padding: var(--gap-md);
    border-radius: var(--radius-md);
    font-size: 13px;
    margin-bottom: var(--gap-lg);
  }

  &__nav {
    display: flex;
    justify-content: space-between;
  }

  &__back, &__next {
    padding: 12px 24px;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  &__back {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: var(--color-text-secondary);
  }

  &__next {
    background: var(--color-accent);
    color: white;
  }
}

.custom-card {
  padding: var(--gap-lg);
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all var(--duration-fast);

  &:hover { border-color: var(--color-accent); }
  &--active { border-color: var(--color-accent); background: var(--color-accent-soft); }

  &__label {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin-bottom: var(--gap-md);
  }

  &__input {
    display: flex;
    align-items: center;
    gap: 8px;

    input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      color: var(--color-text-primary);
    }
  }
}
</style>
