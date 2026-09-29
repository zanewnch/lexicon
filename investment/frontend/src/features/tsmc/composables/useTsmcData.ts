import { ref, computed } from 'vue'
import api from '@/api'

export interface RevenueRow { date: string; revenue: number; mom: number | null; yoy: number | null }
export interface ProfitRow { date?: string; period?: string; roe?: number | null; gross_margin?: number | null; operating_margin?: number | null; net_margin?: number | null; eps?: number | null }
export interface InstitutionalRow { date: string; foreign_net: number; trust_net: number; dealer_net: number; total_net: number }
export interface FundamentalData {
  source: string; stock_id: string; fetched_at: string
  revenue: RevenueRow[]; profitability: ProfitRow[]; institutional: InstitutionalRow[]
}
export interface EarningsNewsItem { source_label: string; title: string; date: string; url: string; summary: string }
export interface EarningsNewsData { items: EarningsNewsItem[]; fetched_at: string; total: number }

export function chgClass(v?: number | null) { return v == null ? '' : v > 0 ? 'up' : v < 0 ? 'down' : '' }
export function chgText(v?: number | null, suffix = '%') {
  if (v == null) return '—'
  return (v > 0 ? '+' : '') + Number(v).toFixed(2) + suffix
}
export function numFmt(v?: number | null) { return v == null ? '—' : Number(v).toLocaleString() }
export function pctFmt(v?: number | null) { return v == null ? '—' : Number(v).toFixed(2) + '%' }

export function useTsmcData() {
  const loading = ref(false)
  const error = ref('')
  const fundData = ref<FundamentalData | null>(null)

  const earningsLoading = ref(false)
  const earningsError = ref('')
  const earningsData = ref<EarningsNewsData | null>(null)

  const latestProfit = computed(() => {
    const rows = fundData.value?.profitability
    return rows?.find(r => r.gross_margin != null) ?? null
  })

  async function fetchFundamental() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.get<FundamentalData>('/analysis/fundamental/', {
        params: { stock_id: '2330', source: 'mixed' },
      })
      fundData.value = data
    } catch (e: any) {
      error.value = e?.response?.data?.error || '無法取得資料，請確認後端是否運行'
    } finally {
      loading.value = false
    }
  }

  async function fetchEarningsNews() {
    earningsLoading.value = true
    earningsError.value = ''
    try {
      const { data } = await api.get<EarningsNewsData>('/analysis/earnings-news/')
      earningsData.value = data
    } catch (e: any) {
      earningsError.value = e?.response?.data?.error || '無法取得資料'
    } finally {
      earningsLoading.value = false
    }
  }

  return {
    loading, error, fundData, latestProfit, fetchFundamental,
    earningsLoading, earningsError, earningsData, fetchEarningsNews,
  }
}
