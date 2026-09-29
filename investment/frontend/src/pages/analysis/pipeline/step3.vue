<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/layout/PageHeader.vue'
import StepStepper from '@/features/pipeline/components/StepStepper.vue'
import SignalCheckboxRow from '@/features/pipeline/components/SignalCheckboxRow.vue'
import { usePipelineStore } from '@/stores/pipelineStore'
import { SIGNAL_LABELS, type EntryParams, type SignalKey, type MatchResponse } from '@/types/pipeline'
import { matchSignals } from '@/api/pipeline'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const store = usePipelineStore()
const toast = useToast()
const { state } = storeToRefs(store)

store.setStep(3)

const SIGNAL_KEYS: SignalKey[] = ['ma_cross', 'macd', 'kd', 'breakout']

const matching = ref(false)
const matchResult = ref<MatchResponse | null>(null)

function isChecked(k: SignalKey) {
  return state.value.entry.signals.includes(k)
}

function onParamChange(key: keyof EntryParams, value: number) {
  store.setEntryParam(key, value)
  matchResult.value = null
}

function onToggle(k: SignalKey) {
  store.toggleSignal(k)
  matchResult.value = null
}

async function runMatch() {
  if (!state.value.selected.length) {
    toast.warning('請先回到 Step 1 選股')
    return
  }
  if (!state.value.entry.signals.length) {
    toast.warning('請至少勾選一個訊號')
    return
  }
  matching.value = true
  try {
    matchResult.value = await matchSignals({
      symbols: state.value.selected.map((s) => s.symbol),
      signals: state.value.entry.signals,
      params: state.value.entry.params,
      mode: state.value.entry.triggerMode,
      lookback_days: state.value.timeframe.days,
    })
  } catch (e) {
    toast.error('訊號比對失敗，請稍後再試')
  } finally {
    matching.value = false
  }
}

function next() {
  router.push('/analysis/pipeline/step4')
}
</script>

<template>
  <div class="step3">
    <PageHeader title="策略流程" subtitle="第 3 步 — 進場時機" />
    <StepStepper :current="3" />

    <div class="step3__layout">
      <div class="step3__signals">
        <h3>選擇進場訊號</h3>
        <div class="step3__list">
          <SignalCheckboxRow
            v-for="key in SIGNAL_KEYS"
            :key="key"
            :signal-key="key"
            :label="SIGNAL_LABELS[key]"
            :checked="isChecked(key)"
            :params="state.entry.params"
            @toggle="onToggle(key)"
            @param-change="onParamChange"
          />
        </div>

        <div class="step3__mode">
          <label>觸發條件：</label>
          <label>
            <input
              type="radio"
              :checked="state.entry.triggerMode === 'all'"
              @change="store.setTriggerMode('all'); matchResult = null"
            />
            全部符合
          </label>
          <label>
            <input
              type="radio"
              :checked="state.entry.triggerMode === 'any'"
              @change="store.setTriggerMode('any'); matchResult = null"
            />
            任一符合
          </label>
        </div>
      </div>

      <div class="step3__match">
        <div class="step3__match-head">
          <h3>即時比對</h3>
          <button :disabled="matching" @click="runMatch">
            {{ matching ? '比對中…' : '執行比對' }}
          </button>
        </div>

        <div v-if="!matchResult" class="step3__match-empty">
          點「執行比對」以套用目前的訊號條件。
        </div>

        <div v-else class="step3__match-result">
          <div class="step3__match-summary">
            <strong>{{ matchResult.matchedCount }}</strong> / {{ matchResult.totalCount }} 檔符合
          </div>
          <ul>
            <li
              v-for="r in matchResult.results"
              :key="r.symbol"
              :class="{ 'step3__match-item--hit': r.matched }"
            >
              <span class="step3__match-sym">{{ r.symbol }}</span>
              <span class="step3__match-price">{{ r.lastPrice ? r.lastPrice.toFixed(2) : '—' }}</span>
              <span class="step3__match-hits">
                {{ r.matched ? '✓' : '·' }}
                {{ r.signalsHit.map((s) => SIGNAL_LABELS[s]).join('、') || '無' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="step3__nav">
      <button class="step3__back" @click="router.push('/analysis/pipeline/step2')">← 上一步</button>
      <button class="step3__next" :disabled="!store.canProceed[3]" @click="next">
        下一步：部位風控 →
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step3 {
  &__layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);
    margin-bottom: var(--gap-lg);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }

  &__signals, &__match {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--gap-lg);

    h3 {
      margin: 0 0 var(--gap-md);
      font-size: var(--font-size-md);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
    margin-bottom: var(--gap-md);
  }

  &__mode {
    display: flex;
    gap: var(--gap-md);
    align-items: center;
    padding-top: var(--gap-md);
    border-top: 1px dashed var(--glass-border);
    color: var(--color-text-secondary);
  }

  &__match-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--gap-md);

    button {
      padding: 8px 16px;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 500;
      cursor: pointer;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  }

  &__match-empty {
    padding: var(--gap-lg);
    color: var(--color-text-muted);
    text-align: center;
  }

  &__match-summary {
    padding: var(--gap-md);
    background: var(--color-accent-soft);
    border-radius: var(--radius-md);
    margin-bottom: var(--gap-md);
    text-align: center;

    strong {
      font-size: var(--font-size-xl);
      color: var(--color-accent);
    }
  }

  &__match-result ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 320px;
    overflow-y: auto;

    li {
      display: grid;
      grid-template-columns: 80px 80px 1fr;
      gap: var(--gap-sm);
      padding: 8px 12px;
      border-bottom: 1px solid var(--glass-border);
      font-size: 13px;
      color: var(--color-text-muted);

      &.step3__match-item--hit {
        background: var(--color-accent-soft);
        color: var(--color-text-primary);
      }
    }
  }

  &__match-sym { font-weight: 700; }

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
