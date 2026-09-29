<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFunnelData } from '@/features/explorer/composables/useFunnelData'
import { usePipelineStore } from '@/stores/pipelineStore'
import { useToast } from '@/composables/useToast'
import type { Layer2Filters, FilterPreset } from '@/types/funnel'
import FunnelStep1 from './funnel/FunnelStep1.vue'
import FunnelStep2 from './funnel/FunnelStep2.vue'
import FunnelStep3 from './funnel/FunnelStep3.vue'

const emit = defineEmits<{
  goToStock: [code: string]
}>()

const router = useRouter()
const pipelineStore = usePipelineStore()
const toast = useToast()

function sendToPipeline() {
  if (!layer3Results.value.length) {
    toast.warning('尚無技術面結果可送出')
    return
  }
  pipelineStore.addStocks(
    layer3Results.value.map((r) => ({
      symbol: r.code,
      score: r.score,
    })),
  )
  toast.success(`已送出 ${layer3Results.value.length} 檔到策略流程`)
  router.push('/analysis/pipeline/step1')
}

const {
  step,
  themes,
  industries,
  selectedSectors,
  selectedCodes,
  totalStocks,
  layer2Results,
  layer3Results,
  sectorsLoading,
  layer2Loading,
  layer3Loading,
  activePreset,
  filters,
  fetchSectors,
  toggleSector,
  applyPreset,
  runLayer2,
  runLayer3,
  reset,
} = useFunnelData()

const steps = [
  { num: 1, label: '產業趨勢' },
  { num: 2, label: '基本面' },
  { num: 3, label: '技術面' },
]

function handleProceedToLayer2() {
  runLayer2()
}

function handleRunLayer2() {
  runLayer2()
}

function handleProceedToLayer3() {
  runLayer3()
}

function handleUpdateFilters(f: Layer2Filters) {
  filters.value = f
}

function handleApplyPreset(p: FilterPreset) {
  applyPreset(p)
}

onMounted(() => {
  fetchSectors()
})
</script>

<template>
  <div class="explorer-funnel">
    <!-- Progress stepper -->
    <div class="explorer-funnel__stepper">
      <template v-for="(s, i) in steps" :key="s.num">
        <div
          class="explorer-funnel__step"
          :class="{
            'explorer-funnel__step--active': step === s.num,
            'explorer-funnel__step--completed': step > s.num,
          }"
        >
          <span class="explorer-funnel__step-num">{{ s.num }}</span>
          <span class="explorer-funnel__step-label">{{ s.label }}</span>
        </div>
        <div v-if="i < steps.length - 1" class="explorer-funnel__connector" />
      </template>
    </div>

    <!-- Funnel counts -->
    <div class="explorer-funnel__counts">
      <span class="explorer-funnel__count-item">全市場</span>
      <span class="explorer-funnel__count-arrow">&rarr;</span>
      <span
        class="explorer-funnel__count-item"
        :class="{ 'explorer-funnel__count-item--active': step >= 1 }"
      >
        產業 {{ selectedCodes.length }} 檔
      </span>
      <template v-if="step >= 2">
        <span class="explorer-funnel__count-arrow">&rarr;</span>
        <span
          class="explorer-funnel__count-item"
          :class="{ 'explorer-funnel__count-item--active': step >= 2 }"
        >
          基本面 {{ layer2Results.length }} 檔
        </span>
      </template>
      <template v-if="step >= 3">
        <span class="explorer-funnel__count-arrow">&rarr;</span>
        <span
          class="explorer-funnel__count-item explorer-funnel__count-item--active"
        >
          技術面 {{ layer3Results.length }} 檔
        </span>
      </template>
    </div>

    <!-- Reset -->
    <button v-if="step > 1" class="explorer-funnel__reset" @click="reset">
      重新開始
    </button>

    <!-- Step 1 -->
    <FunnelStep1
      v-if="step >= 1"
      :themes="themes"
      :industries="industries"
      :selected-sectors="selectedSectors"
      :loading="sectorsLoading"
      @toggle="toggleSector"
      @proceed="handleProceedToLayer2"
    />

    <!-- Step 2 -->
    <FunnelStep2
      v-if="step >= 2"
      :results="layer2Results"
      :loading="layer2Loading"
      :filters="filters"
      :active-preset="activePreset"
      :input-count="selectedCodes.length"
      @update:filters="handleUpdateFilters"
      @apply-preset="handleApplyPreset"
      @run="handleRunLayer2"
      @go-to-stock="emit('goToStock', $event)"
    />

    <!-- Proceed to Step 3 -->
    <div v-if="step === 2 && layer2Results.length > 0 && !layer2Loading" class="explorer-funnel__proceed">
      <button class="explorer-funnel__proceed-btn" @click="handleProceedToLayer3">
        進入第三關 — 技術面評分 ({{ layer2Results.length }} 檔)
      </button>
    </div>

    <!-- Step 3 -->
    <FunnelStep3
      v-if="step >= 3"
      :results="layer3Results"
      :loading="layer3Loading"
      :input-count="layer2Results.length"
      @go-to-stock="emit('goToStock', $event)"
    />

    <!-- Send to Pipeline -->
    <div v-if="step >= 3 && layer3Results.length > 0 && !layer3Loading" class="explorer-funnel__send">
      <button class="explorer-funnel__send-btn" @click="sendToPipeline">
        送至策略流程 → 選週期、進場時機、部位風控（{{ layer3Results.length }} 檔）
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.explorer-funnel {
  &__stepper {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    margin-bottom: var(--gap-lg);
  }

  &__step {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-muted);
    transition: color var(--duration-fast);

    &--active {
      color: var(--color-accent);
    }

    &--completed {
      color: var(--color-text-secondary);
    }
  }

  &__step-num {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: var(--font-size-sm);
    font-weight: 700;
    border: 2px solid currentColor;

    .explorer-funnel__step--active & {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }

    .explorer-funnel__step--completed & {
      background: var(--color-text-muted);
      border-color: var(--color-text-muted);
      color: #fff;
    }
  }

  &__step-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  &__connector {
    flex: 1;
    max-width: 60px;
    height: 1px;
    background: var(--color-border);
  }

  &__counts {
    display: flex;
    align-items: center;
    gap: var(--gap-xs);
    margin-bottom: var(--gap-lg);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    flex-wrap: wrap;
  }

  &__count-arrow {
    color: var(--color-text-muted);
  }

  &__count-item {
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);

    &--active {
      color: var(--color-accent);
      border-color: var(--color-accent);
      font-weight: 600;
    }
  }

  &__reset {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--gap-lg);
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: transparent;

    &:hover {
      color: var(--color-text-primary);
      border-color: var(--color-text-secondary);
    }
  }

  &__proceed {
    display: flex;
    justify-content: center;
    padding: var(--gap-lg) 0;
  }

  &__proceed-btn {
    padding: 12px 32px;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: var(--font-size-base);
    background: var(--color-accent);
    color: #fff;
    transition: opacity var(--duration-fast);

    &:hover {
      opacity: 0.9;
    }
  }

  &__send {
    display: flex;
    justify-content: center;
    padding: var(--gap-lg) 0;
  }

  &__send-btn {
    padding: 12px 32px;
    border-radius: var(--radius-md);
    font-weight: 600;
    background: #22c55e;
    color: #fff;
    border: none;
    cursor: pointer;
    transition: opacity var(--duration-fast);

    &:hover { opacity: 0.9; }
  }
}
</style>
