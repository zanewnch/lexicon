<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/layout/PageHeader.vue'
import StepStepper from '@/features/pipeline/components/StepStepper.vue'
import SizingTable from '@/features/pipeline/components/SizingTable.vue'
import { usePipelineStore } from '@/stores/pipelineStore'
import { matchSignals } from '@/api/pipeline'

const router = useRouter()
const store = usePipelineStore()
const { state } = storeToRefs(store)

store.setStep(4)

const prices = ref<Record<string, number>>({})
const loadingPrices = ref(false)

async function loadPrices() {
  if (!state.value.selected.length) return
  loadingPrices.value = true
  try {
    const res = await matchSignals({
      symbols: state.value.selected.map((s) => s.symbol),
      signals: state.value.entry.signals.length ? state.value.entry.signals : ['ma_cross'],
      params: state.value.entry.params,
      mode: state.value.entry.triggerMode,
      lookback_days: state.value.timeframe.days,
    })
    const map: Record<string, number> = {}
    for (const r of res.results) {
      if (r.lastPrice != null) map[r.symbol] = r.lastPrice
    }
    prices.value = map
  } finally {
    loadingPrices.value = false
  }
}

onMounted(() => {
  loadPrices()
})

const sizing = computed(() => state.value.sizing)

function next() {
  router.push('/analysis/pipeline/confirm')
}
</script>

<template>
  <div class="step4">
    <PageHeader title="策略流程" subtitle="第 4 步 — 部位風控" />
    <StepStepper :current="4" />

    <div class="step4__layout">
      <div class="step4__form">
        <h3>資金配置</h3>
        <div class="step4__field">
          <label>總資金</label>
          <input
            type="number"
            :value="sizing.capital"
            @input="store.patchSizing({ capital: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="step4__field">
          <label>單檔部位 (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            :value="sizing.perStockPct"
            @input="store.patchSizing({ perStockPct: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="step4__field">
          <label>最大持股數</label>
          <input
            type="number"
            min="1"
            :value="sizing.maxPositions"
            @input="store.patchSizing({ maxPositions: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>

        <h3>風控</h3>
        <div class="step4__field">
          <label>停損 (%)</label>
          <input
            type="number"
            min="0"
            :value="sizing.stopLossPct"
            @input="store.patchSizing({ stopLossPct: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="step4__field">
          <label>停利 (%)</label>
          <input
            type="number"
            min="0"
            :value="sizing.takeProfitPct"
            @input="store.patchSizing({ takeProfitPct: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>

        <button class="step4__refresh" :disabled="loadingPrices" @click="loadPrices">
          {{ loadingPrices ? '載入中…' : '重新取現價' }}
        </button>
      </div>

      <div class="step4__preview">
        <h3>下單預覽</h3>
        <SizingTable :stocks="state.selected" :sizing="sizing" :prices="prices" />
      </div>
    </div>

    <div class="step4__nav">
      <button class="step4__back" @click="router.push('/analysis/pipeline/step3')">← 上一步</button>
      <button class="step4__next" :disabled="!store.canProceed[4]" @click="next">
        確認與送出 →
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step4 {
  &__layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--gap-lg);
    margin-bottom: var(--gap-lg);

    @media (max-width: 1000px) { grid-template-columns: 1fr; }
  }

  &__form, &__preview {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--gap-lg);

    h3 {
      margin: 0 0 var(--gap-md);
      font-size: var(--font-size-md);

      &:not(:first-child) { margin-top: var(--gap-lg); }
    }
  }

  &__field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--gap-sm);

    label { color: var(--color-text-secondary); }
    input {
      width: 140px;
      padding: 6px 10px;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      color: var(--color-text-primary);
      text-align: right;
    }
  }

  &__refresh {
    margin-top: var(--gap-md);
    width: 100%;
    padding: 8px;
    background: transparent;
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
    border-radius: var(--radius-sm);
    cursor: pointer;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
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
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}
</style>
