import { ref, computed, onMounted } from 'vue'
import api from '@/api'

export interface TagOptions {
  industry: string[]
  liquidity: string[]
  cap_size: string[]
  style: string[]
  momentum: string[]
  trend: string[]
  valuation: string[]
  dividend: string[]
  flags: string[]
  special: string[]
}

export interface StockRow {
  code: string
  name: string
  exchange: 'TSE' | 'OTC'
  price: number
  changePercent: number
  pe: number
  pb: number
  dividendYield: number
  turnover: number
  tags: {
    industry: string
    liquidity: string
    cap_size: string
    style: string
    momentum: string
    trend: string
    valuation: string
    dividend: string
    flags: string[]
    special: string[]
  }
}

type Selected = TagOptions & { exchange: string[] }

const emptySelected = (): Selected => ({
  industry: [], liquidity: [], cap_size: [], style: [],
  momentum: [], trend: [], valuation: [], dividend: [],
  flags: [], special: [], exchange: [],
})

interface TagOptionsPayload extends TagOptions {
  trendTagsUpdatedAt?: string | null
}

interface FilterResponse {
  count: number
  offset: number
  limit: number
  results: StockRow[]
}

const PAGE_SIZE = 100

export function useTagFilter() {
  const options = ref<TagOptions>({
    industry: [], liquidity: [], cap_size: [], style: [],
    momentum: [], trend: [], valuation: [], dividend: [],
    flags: [], special: [],
  })
  const trendTagsUpdatedAt = ref<string | null>(null)

  const selected = ref<Selected>(emptySelected())
  const results = ref<StockRow[]>([])
  const total = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const initialLoading = ref(true)

  const hasFilter = computed(() =>
    Object.values(selected.value).some((arr) => arr.length > 0),
  )
  const hasMore = computed(() => results.value.length < total.value)

  async function loadOptions() {
    try {
      const { data } = await api.get<TagOptionsPayload>('/tags/options/')
      const { trendTagsUpdatedAt: ts, ...opts } = data
      options.value = opts
      trendTagsUpdatedAt.value = ts ?? null
    } catch (err) {
      console.error('[TagFilter] load options failed', err)
    }
  }

  async function _fetchPage(offset: number): Promise<FilterResponse | null> {
    try {
      const { data } = await api.post<FilterResponse>('/tags/filter/', {
        ...selected.value,
        offset,
        limit: PAGE_SIZE,
      })
      return data
    } catch (err) {
      console.error('[TagFilter] filter failed', err)
      return null
    }
  }

  async function fetchResults() {
    loading.value = true
    const data = await _fetchPage(0)
    if (data) {
      results.value = data.results
      total.value = data.count
    } else {
      results.value = []
      total.value = 0
    }
    loading.value = false
  }

  async function loadMore() {
    if (loadingMore.value || loading.value || !hasMore.value) return
    loadingMore.value = true
    const data = await _fetchPage(results.value.length)
    if (data) {
      results.value = results.value.concat(data.results)
      total.value = data.count
    }
    loadingMore.value = false
  }

  function resetFilters() {
    selected.value = emptySelected()
    fetchResults()
  }

  function toggleValue(group: keyof Selected, value: string) {
    const arr = selected.value[group]
    const idx = arr.indexOf(value)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(value)
    fetchResults()
  }

  function isSelected(group: keyof Selected, value: string) {
    return selected.value[group].includes(value)
  }

  function formatTurnover(value: number) {
    if (!value) return '-'
    if (value >= 1e8) return `${(value / 1e8).toFixed(2)} 億`
    if (value >= 1e4) return `${(value / 1e4).toFixed(0)} 萬`
    return String(value)
  }

  onMounted(async () => {
    await loadOptions()
    await fetchResults()
    initialLoading.value = false
  })

  return {
    options, selected, results, total, loading, loadingMore, initialLoading,
    trendTagsUpdatedAt,
    hasFilter, hasMore, resetFilters, toggleValue, isSelected, formatTurnover,
    loadMore,
  }
}
