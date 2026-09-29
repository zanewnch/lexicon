<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePipelineStore } from '@/stores/pipelineStore'
import type { PipelineStep } from '@/types/pipeline'

const props = defineProps<{
  current: PipelineStep
}>()

const store = usePipelineStore()
const router = useRouter()

interface StepDef {
  step: PipelineStep
  label: string
  path: string
}

const STEPS: StepDef[] = [
  { step: 1, label: '選股', path: '/analysis/pipeline/step1' },
  { step: 2, label: '週期', path: '/analysis/pipeline/step2' },
  { step: 3, label: '進場時機', path: '/analysis/pipeline/step3' },
  { step: 4, label: '部位風控', path: '/analysis/pipeline/step4' },
]

const reachable = computed<Record<PipelineStep, boolean>>(() => {
  return {
    1: true,
    2: store.canProceed[1],
    3: store.canProceed[1] && store.canProceed[2],
    4: store.canProceed[1] && store.canProceed[2] && store.canProceed[3],
  }
})

function go(step: StepDef) {
  if (step.step <= props.current || reachable.value[step.step]) {
    router.push(step.path)
  }
}
</script>

<template>
  <div class="stepper">
    <div
      v-for="(s, idx) in STEPS"
      :key="s.step"
      class="stepper__item"
      :class="{
        'stepper__item--active': s.step === current,
        'stepper__item--done': s.step < current,
        'stepper__item--disabled': s.step > current && !reachable[s.step],
      }"
      @click="go(s)"
    >
      <div class="stepper__circle">{{ s.step }}</div>
      <div class="stepper__label">{{ s.label }}</div>
      <div v-if="idx < STEPS.length - 1" class="stepper__line"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  padding: var(--gap-md) var(--gap-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--gap-lg);

  &__item {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex: 1;
    position: relative;

    &--disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    &--active &__circle {
      background: var(--color-accent);
      color: white;
    }

    &--done &__circle {
      background: #10b981;
      color: white;
    }
  }

  &__circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-bg-hover);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
    transition: all var(--duration-fast);
  }

  &__label {
    margin-left: 10px;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  &__line {
    flex: 1;
    height: 2px;
    background: var(--glass-border);
    margin: 0 var(--gap-md);
  }
}
</style>
