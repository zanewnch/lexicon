<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'
import type { PolicyNewsItem, PolicyNewsResponse, BudgetRow, BudgetResponse } from '@/types/funnel'
import FunnelScoring from '@/features/workflow/components/funnel/FunnelScoring.vue'
import FunnelPolicy from '@/features/workflow/components/funnel/FunnelPolicy.vue'
import FunnelBudget from '@/features/workflow/components/funnel/FunnelBudget.vue'

// ── 週期反轉指標 ──────────────────────────────────────────────
interface Indicator {
  id: string
  name: string
  category: string
  unit: string
  desc: string
  latest: number | null
  latest_date: string | null
  chg_1m: number | null
  chg_3m: number | null
  history: { date: string; close: number }[]
}

const indicators = ref<Indicator[]>([])
const indicatorsLoading = ref(false)
const indicatorsError = ref('')

async function fetchIndicators() {
  indicatorsLoading.value = true
  indicatorsError.value = ''
  try {
    const { data } = await api.get<Indicator[]>('/analysis/indicators/')
    indicators.value = data
  } catch (e) {
    indicatorsError.value = '無法取得指標資料，請確認後端是否運行'
  } finally {
    indicatorsLoading.value = false
  }
}

// ── 季度評分（本地儲存）──────────────────────────────────────
const STORAGE_KEY = 'funnel-scores'

interface DimensionScore {
  score: number
  note: string
  updatedAt: string
}

interface FunnelScores {
  policy: DimensionScore
  tech: DimensionScore
  cycle: DimensionScore
  quarter: string
}

function currentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

function defaultScores(): FunnelScores {
  const now = new Date().toISOString()
  return {
    policy: { score: 2, note: '', updatedAt: now },
    tech:   { score: 2, note: '', updatedAt: now },
    cycle:  { score: 2, note: '', updatedAt: now },
    quarter: currentQuarter(),
  }
}

const scores = ref<FunnelScores>(defaultScores())

function saveScores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.value))
}

function setScore(dim: 'policy' | 'tech' | 'cycle', val: number) {
  scores.value[dim].score = val
  scores.value[dim].updatedAt = new Date().toISOString()
  saveScores()
}

function setNote(dim: 'policy' | 'tech' | 'cycle', val: string) {
  scores.value[dim].note = val
  scores.value[dim].updatedAt = new Date().toISOString()
  saveScores()
}

// ── 政策情報 ──────────────────────────────────────────────────
const policyItems     = ref<PolicyNewsItem[]>([])
const policyLoading   = ref(false)
const policyError     = ref('')
const policyFetchedAt = ref('')

async function fetchPolicyNews() {
  policyLoading.value = true
  policyError.value = ''
  try {
    const { data } = await api.get<PolicyNewsResponse>('/analysis/policy/')
    policyItems.value     = data.items
    policyFetchedAt.value = data.fetched_at
  } catch {
    policyError.value = '無法取得政策情報，請確認後端是否運行'
  } finally {
    policyLoading.value = false
  }
}

// ── 政府預算 ──────────────────────────────────────────────────
const budgetRows      = ref<BudgetRow[]>([])
const budgetDatasets  = ref<BudgetResponse['datasets']>([])
const budgetLoading   = ref(false)
const budgetError     = ref('')
const budgetParsed    = ref(false)
const budgetFetchedAt = ref('')

async function fetchBudget() {
  budgetLoading.value = true
  budgetError.value = ''
  try {
    const { data } = await api.get<BudgetResponse>('/analysis/budget/')
    budgetRows.value      = data.rows
    budgetDatasets.value  = data.datasets
    budgetParsed.value    = data.parsed
    budgetFetchedAt.value = data.fetched_at
  } catch {
    budgetError.value = '無法取得預算資料'
  } finally {
    budgetLoading.value = false
  }
}

// ── 生命週期 ─────────────────────────────────────────────────
onMounted(() => {
  fetchIndicators()
  fetchPolicyNews()
  fetchBudget()

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { scores.value = JSON.parse(saved) } catch {}
  }
})
</script>

<template>
  <div class="funnel">
    <FunnelScoring
      :scores="scores"
      :indicators="indicators"
      :indicators-loading="indicatorsLoading"
      :indicators-error="indicatorsError"
      @update:score="setScore"
      @update:note="setNote"
      @refresh-indicators="fetchIndicators"
    />

    <FunnelPolicy
      :items="policyItems"
      :loading="policyLoading"
      :error="policyError"
      :fetched-at="policyFetchedAt"
      @refresh="fetchPolicyNews"
    />

    <FunnelBudget
      :rows="budgetRows"
      :datasets="budgetDatasets"
      :loading="budgetLoading"
      :error="budgetError"
      :parsed="budgetParsed"
      :fetched-at="budgetFetchedAt"
      @refresh="fetchBudget"
    />
  </div>
</template>

<style scoped lang="scss">
.funnel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
