import { defineStore } from 'pinia'
import { computed, reactive, watch } from 'vue'
import {
  DEFAULT_PIPELINE_STATE,
  TIMEFRAME_PRESETS,
  type EntryParams,
  type PipelineState,
  type PipelineStep,
  type PipelineStock,
  type SignalKey,
  type SizingState,
  type TimeframePreset,
  type TriggerMode,
} from '@/types/pipeline'

const STORAGE_KEY = 'pipeline:v1'

function loadFromStorage(): PipelineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefault()
    const parsed = JSON.parse(raw) as Partial<PipelineState>
    return {
      ...cloneDefault(),
      ...parsed,
      timeframe: { ...DEFAULT_PIPELINE_STATE.timeframe, ...(parsed.timeframe ?? {}) },
      entry: {
        ...DEFAULT_PIPELINE_STATE.entry,
        ...(parsed.entry ?? {}),
        params: { ...DEFAULT_PIPELINE_STATE.entry.params, ...(parsed.entry?.params ?? {}) },
      },
      sizing: { ...DEFAULT_PIPELINE_STATE.sizing, ...(parsed.sizing ?? {}) },
      selected: Array.isArray(parsed.selected) ? parsed.selected : [],
    }
  } catch {
    return cloneDefault()
  }
}

function cloneDefault(): PipelineState {
  return JSON.parse(JSON.stringify(DEFAULT_PIPELINE_STATE)) as PipelineState
}

export const usePipelineStore = defineStore('pipeline', () => {
  const state = reactive<PipelineState>(loadFromStorage())

  watch(
    () => state,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    },
    { deep: true },
  )

  // ---- Step 1 ----
  function addStocks(stocks: PipelineStock[]) {
    const exists = new Set(state.selected.map((s) => s.symbol))
    for (const s of stocks) {
      if (!exists.has(s.symbol)) {
        state.selected.push(s)
        exists.add(s.symbol)
      }
    }
  }

  function removeStock(symbol: string) {
    state.selected = state.selected.filter((s) => s.symbol !== symbol)
  }

  function clearStocks() {
    state.selected = []
  }

  // ---- Step 2 ----
  function setTimeframePreset(preset: TimeframePreset, customDays?: number) {
    state.timeframe.preset = preset
    if (preset === 'custom') {
      state.timeframe.days = customDays ?? state.timeframe.days
    } else {
      const cfg = TIMEFRAME_PRESETS[preset]
      state.timeframe.days = cfg.days
      state.entry.params = { ...cfg.params }
    }
  }

  function setCustomDays(days: number) {
    state.timeframe.preset = 'custom'
    state.timeframe.days = days
  }

  // ---- Step 3 ----
  function toggleSignal(key: SignalKey) {
    const i = state.entry.signals.indexOf(key)
    if (i >= 0) state.entry.signals.splice(i, 1)
    else state.entry.signals.push(key)
  }

  function setTriggerMode(mode: TriggerMode) {
    state.entry.triggerMode = mode
  }

  function setEntryParam<K extends keyof EntryParams>(key: K, value: number) {
    state.entry.params[key] = value
  }

  // ---- Step 4 ----
  function patchSizing(patch: Partial<SizingState>) {
    Object.assign(state.sizing, patch)
  }

  // ---- Navigation ----
  function setStep(step: PipelineStep) {
    state.step = step
  }

  const canProceed = computed<Record<PipelineStep, boolean>>(() => ({
    1: state.selected.length > 0,
    2: state.timeframe.days > 0,
    3: state.entry.signals.length > 0,
    4: state.sizing.capital > 0 && state.sizing.maxPositions > 0,
  }))

  function reset() {
    Object.assign(state, cloneDefault())
  }

  return {
    state,
    canProceed,
    addStocks,
    removeStock,
    clearStocks,
    setTimeframePreset,
    setCustomDays,
    toggleSignal,
    setTriggerMode,
    setEntryParam,
    patchSizing,
    setStep,
    reset,
  }
})
