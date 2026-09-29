<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/layout/PageHeader.vue'
import StepStepper from '@/features/pipeline/components/StepStepper.vue'
import { usePipelineStore } from '@/stores/pipelineStore'
import { commitPipeline, matchSignals } from '@/api/pipeline'
import { TIMEFRAME_PRESETS, SIGNAL_LABELS, type CommitRequestItem } from '@/types/pipeline'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const store = usePipelineStore()
const toast = useToast()
const { state } = storeToRefs(store)

const prices = ref<Record<string, number>>({})
const submitting = ref(false)

async function loadPrices() {
  if (!state.value.selected.length) return
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
}

onMounted(loadPrices)

const items = computed<CommitRequestItem[]>(() => {
  const perStockBudget = (state.value.sizing.capital * state.value.sizing.perStockPct) / 100
  const usable = Math.min(state.value.selected.length, state.value.sizing.maxPositions)
  return state.value.selected.slice(0, usable).map((s) => {
    const price = prices.value[s.symbol] ?? 0
    const lots = price > 0 ? Math.floor(perStockBudget / (price * 1000)) : 0
    const shares = lots * 1000
    return {
      symbol: s.symbol,
      shares,
      estimatedPrice: price,
      stopLossPrice: +(price * (1 - state.value.sizing.stopLossPct / 100)).toFixed(2),
      takeProfitPrice: +(price * (1 + state.value.sizing.takeProfitPct / 100)).toFixed(2),
    }
  })
})

const timeframeLabel = computed(() => {
  if (state.value.timeframe.preset === 'custom') return `自訂 ${state.value.timeframe.days} 天`
  return `${TIMEFRAME_PRESETS[state.value.timeframe.preset].label} (${state.value.timeframe.days} 天)`
})

async function submit() {
  submitting.value = true
  try {
    const res = await commitPipeline({
      items: items.value,
      meta: {
        timeframe: { preset: state.value.timeframe.preset, days: state.value.timeframe.days },
        entry: {
          signals: state.value.entry.signals,
          params: state.value.entry.params,
          triggerMode: state.value.entry.triggerMode,
        },
        sizing: { ...state.value.sizing },
      },
    })
    toast.success(`已送出 ${res.count} 檔候選至 Trader`)
    store.reset()
    router.push('/trading/trader')
  } catch (e) {
    toast.error('送出失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="confirm">
    <PageHeader title="策略流程" subtitle="確認與送出" />
    <StepStepper :current="4" />

    <div class="confirm__sections">
      <section>
        <h3>選股</h3>
        <div>{{ state.selected.map((s) => s.symbol).join('、') || '—' }}</div>
      </section>

      <section>
        <h3>週期</h3>
        <div>{{ timeframeLabel }}</div>
      </section>

      <section>
        <h3>進場訊號</h3>
        <div>
          {{ state.entry.signals.map((s) => SIGNAL_LABELS[s]).join('、') || '—' }}
          （{{ state.entry.triggerMode === 'all' ? '全部符合' : '任一符合' }}）
        </div>
      </section>

      <section>
        <h3>部位風控</h3>
        <div>
          資金 ${{ state.sizing.capital.toLocaleString() }} ·
          單檔 {{ state.sizing.perStockPct }}% ·
          最多 {{ state.sizing.maxPositions }} 檔 ·
          停損 {{ state.sizing.stopLossPct }}% ·
          停利 {{ state.sizing.takeProfitPct }}%
        </div>
      </section>

      <section>
        <h3>下單清單</h3>
        <table class="confirm__table">
          <thead>
            <tr><th>代碼</th><th>股數</th><th>預估價</th><th>停損</th><th>停利</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.symbol">
              <td><strong>{{ r.symbol }}</strong></td>
              <td>{{ r.shares.toLocaleString() }}</td>
              <td>{{ r.estimatedPrice.toFixed(2) }}</td>
              <td class="confirm__sl">{{ r.stopLossPrice }}</td>
              <td class="confirm__tp">{{ r.takeProfitPrice }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <div class="confirm__nav">
      <button class="confirm__back" @click="router.push('/analysis/pipeline/step4')">← 上一步</button>
      <button class="confirm__submit" :disabled="submitting || !items.length" @click="submit">
        {{ submitting ? '送出中…' : '送至 Trader' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.confirm {
  &__sections {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--gap-lg);
    margin-bottom: var(--gap-lg);

    section {
      padding: var(--gap-md) 0;
      border-bottom: 1px dashed var(--glass-border);
      &:last-child { border-bottom: none; }

      h3 {
        margin: 0 0 6px;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    margin-top: var(--gap-sm);

    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--glass-border);
    }
    th {
      background: var(--color-bg-hover);
      font-size: 12px;
      color: var(--color-text-muted);
    }
  }

  &__sl { color: #ef4444; }
  &__tp { color: #10b981; }

  &__nav {
    display: flex;
    justify-content: space-between;
  }

  &__back, &__submit {
    padding: 12px 28px;
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

  &__submit {
    background: var(--color-accent);
    color: white;
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}
</style>
