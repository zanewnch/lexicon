import { ref, computed } from 'vue'
import api from '@/api'
import { useAsyncData } from '@/composables/useAsyncData'
import type {
  FunnelSector,
  FunnelStock,
  TechnicalResult,
  Layer2Filters,
  FilterPreset,
} from '@/types/funnel'
import { FILTER_PRESETS } from '@/types/funnel'

/**
 * 選股漏斗（Funnel）的資料與狀態管理 composable。
 *
 * 整個選股流程分為三層（步驟）：
 * 1. **Layer 1 — 類股選擇**：從「主題類股」或「產業類股」中選出感興趣的族群
 * 2. **Layer 2 — 基本面篩選**：套用財務指標過濾條件（本益比、殖利率等）
 * 3. **Layer 3 — 技術面篩選**：對 Layer 2 的結果進一步做技術分析篩選
 *
 * 使用 `FILTER_PRESETS` 提供預設篩選條件（保守 / 進取 / 存股等策略）。
 *
 * @returns 所有狀態和操作函式
 *
 * @example
 * ```ts
 * const funnel = useFunnelData()
 * await funnel.fetchSectors()
 * funnel.toggleSector('半導體')
 * funnel.applyPreset('growth')
 * await funnel.runLayer2()
 * await funnel.runLayer3()
 * ```
 */
export function useFunnelData() {
  // ---- State ----

  /** 目前所在的漏斗步驟（1 = 類股選擇，2 = 基本面篩選結果，3 = 技術面篩選結果） */
  const step = ref<1 | 2 | 3>(1)
  /** 使用者選中的類股名稱清單 */
  const selectedSectors = ref<string[]>([])
  /** Layer 2 篩選後的股票清單 */
  const layer2Results = ref<FunnelStock[]>([])
  /** Layer 3 篩選後的技術分析結果清單 */
  const layer3Results = ref<TechnicalResult[]>([])
  /** Layer 2 正在載入 */
  const layer2Loading = ref(false)
  /** Layer 3 正在載入 */
  const layer3Loading = ref(false)
  /** 目前套用的篩選預設名稱 */
  const activePreset = ref<FilterPreset>('conservative')
  /** Layer 2 使用的基本面篩選條件，可手動調整 */
  const filters = ref<Layer2Filters>({ ...FILTER_PRESETS.conservative })

  // ---- useAsyncData for sectors ----

  /** 所有可選的類股清單（含主題類股和產業類股） */
  const {
    data: sectors,
    loading: sectorsLoading,
    execute: fetchSectors,
  } = useAsyncData<FunnelSector[]>(
    () => api.get<FunnelSector[]>('/funnel/sectors/').then(r => r.data),
    { initialData: [] as FunnelSector[] },
  )

  // ---- Computed ----

  /** 主題類股（`isTheme === true`），如「AI 概念」、「生技醫療」等 */
  const themes = computed(() => (sectors.value ?? []).filter(s => s.isTheme))
  /** 傳統產業類股（`isTheme === false`），如「半導體」、「金融」等 */
  const industries = computed(() => (sectors.value ?? []).filter(s => !s.isTheme))

  /**
   * 將使用者選中的類股名稱轉換為對應的股票代號陣列。
   * 用於送給 Layer 2 API 的 `codes` 參數。
   */
  const selectedCodes = computed(() => {
    const names = new Set(selectedSectors.value)
    const codes: string[] = []
    for (const sec of (sectors.value ?? [])) {
      if (names.has(sec.name)) {
        codes.push(...sec.codes)
      }
    }
    return [...new Set(codes)]
  })

  /** 所有類股的股票總數 */
  const totalStocks = computed(() =>
    (sectors.value ?? []).reduce((sum, s) => sum + s.stockCount, 0),
  )

  // ---- Actions ----

  /**
   * 切換類股的選取狀態（選取 ↔ 取消選取）。
   * @param name - 類股名稱
   */
  function toggleSector(name: string) {
    const idx = selectedSectors.value.indexOf(name)
    if (idx >= 0) {
      selectedSectors.value.splice(idx, 1)
    } else {
      selectedSectors.value.push(name)
    }
  }

  /**
   * 套用篩選預設條件（保守 / 進取 / 存股等）。
   * 會重設 `filters` 為預設值，並更新 `activePreset`。
   * @param preset - 要套用的預設名稱
   */
  function applyPreset(preset: FilterPreset) {
    activePreset.value = preset
    filters.value = { ...FILTER_PRESETS[preset] }
  }

  /**
   * 執行 Layer 2 基本面篩選。
   * 使用目前選中的股票代號和篩選條件呼叫 API，結果存入 `layer2Results`。
   * 若沒有選中任何類股則直接返回。
   */
  async function runLayer2() {
    if (selectedCodes.value.length === 0) return
    layer2Loading.value = true
    step.value = 2
    try {
      const res = await api.post<FunnelStock[]>('/funnel/layer2/', {
        codes: selectedCodes.value,
        filters: filters.value,
      })
      layer2Results.value = res.data
    } catch {
      layer2Results.value = []
    } finally {
      layer2Loading.value = false
    }
  }

  /**
   * 執行 Layer 3 技術面篩選。
   * 使用 Layer 2 結果的股票代號呼叫 API，結果存入 `layer3Results`。
   * 若 Layer 2 結果為空則直接返回。
   */
  async function runLayer3() {
    const codes = layer2Results.value.map(s => s.code)
    if (codes.length === 0) return
    layer3Loading.value = true
    step.value = 3
    try {
      const res = await api.post<TechnicalResult[]>('/funnel/layer3/', { codes })
      layer3Results.value = res.data
    } catch {
      layer3Results.value = []
    } finally {
      layer3Loading.value = false
    }
  }

  /**
   * 重設所有漏斗狀態回到初始值（步驟 1，空選擇，保守篩選條件）。
   */
  function reset() {
    step.value = 1
    selectedSectors.value = []
    layer2Results.value = []
    layer3Results.value = []
    filters.value = { ...FILTER_PRESETS.conservative }
    activePreset.value = 'conservative'
  }

  return {
    step,
    sectors,
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
  }
}
