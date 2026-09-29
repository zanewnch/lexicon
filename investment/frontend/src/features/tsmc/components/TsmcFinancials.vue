<script setup lang="ts">
import { ref } from 'vue'
import type { FundamentalData, ProfitRow } from '../composables/useTsmcData'
import { chgClass, chgText, numFmt, pctFmt } from '../composables/useTsmcData'

defineProps<{
  fundData: FundamentalData | null
  latestProfit: ProfitRow | null
  loading: boolean
  error: string
}>()

const emit = defineEmits<{ retry: [] }>()

type FinTab = 'revenue' | 'profitability' | 'institutional'
const finTab = ref<FinTab>('revenue')
</script>

<template>
  <div class="tsmc__section tsmc__section--wide">
    <div class="tsmc__metrics">
      <div class="tsmc__metric">
        <div class="tsmc__metric-label">毛利率（最新）</div>
        <div class="tsmc__metric-value tsmc__metric-value--up">{{ pctFmt(latestProfit?.gross_margin) }}</div>
        <div class="tsmc__metric-desc">門檻 &gt; 50%</div>
      </div>
      <div class="tsmc__metric">
        <div class="tsmc__metric-label">ROE（最新）</div>
        <div class="tsmc__metric-value tsmc__metric-value--up">{{ pctFmt(latestProfit?.roe) }}</div>
        <div class="tsmc__metric-desc">門檻 &gt; 25%</div>
      </div>
      <div class="tsmc__metric">
        <div class="tsmc__metric-label">營益率（最新）</div>
        <div class="tsmc__metric-value">{{ pctFmt(latestProfit?.operating_margin) }}</div>
        <div class="tsmc__metric-desc">三率齊升是極品</div>
      </div>
      <div class="tsmc__metric">
        <div class="tsmc__metric-label">EPS（最新）</div>
        <div class="tsmc__metric-value">{{ latestProfit?.eps != null ? Number(latestProfit.eps).toFixed(2) : '—' }}</div>
        <div class="tsmc__metric-desc">每股盈餘</div>
      </div>
    </div>

    <div v-if="loading" class="tsmc__status tsmc__status--loading">
      <span class="tsmc__spinner" />
      載入財務資料中…
    </div>
    <div v-else-if="error" class="tsmc__status tsmc__status--error">
      {{ error }}
      <button class="tsmc__refresh-btn" @click="emit('retry')" style="margin-left:12px">重試</button>
    </div>

    <template v-if="fundData && !loading">
      <div class="tsmc__data-meta">
        <span class="tsmc__data-source">{{ fundData.source }}</span>
        <span class="tsmc__data-time">更新：{{ new Date(fundData.fetched_at).toLocaleString('zh-TW') }}</span>
      </div>

      <div class="tsmc__fin-tabs">
        <button
          v-for="t in ([
            { key: 'revenue', label: '月營收' },
            { key: 'profitability', label: '獲利能力' },
            { key: 'institutional', label: '法人動向' },
          ] as { key: FinTab; label: string }[])"
          :key="t.key"
          class="tsmc__fin-tab"
          :class="{ 'tsmc__fin-tab--active': finTab === t.key }"
          @click="finTab = t.key"
        >{{ t.label }}</button>
      </div>

      <div v-if="finTab === 'revenue'" class="tsmc__table-wrap">
        <div v-if="!fundData.revenue?.length" class="tsmc__empty">
          無月營收資料（FinMind token 可能過期，或超過免費額度）
        </div>
        <table v-else class="tsmc__table">
          <thead>
            <tr>
              <th>月份</th>
              <th class="tsmc__th-r">營收（千元）</th>
              <th class="tsmc__th-r"><span class="tsmc__th-tip" title="Month over Month：與上個月相比的成長率">MoM</span></th>
              <th class="tsmc__th-r"><span class="tsmc__th-tip" title="Year over Year：與去年同期相比的成長率">YoY</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in [...fundData.revenue].reverse()" :key="r.date">
              <td>{{ r.date }}</td>
              <td class="tsmc__num">{{ numFmt(r.revenue) }}</td>
              <td class="tsmc__num" :class="chgClass(r.mom)">{{ chgText(r.mom) }}</td>
              <td class="tsmc__num" :class="chgClass(r.yoy)">{{ chgText(r.yoy) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="finTab === 'profitability'" class="tsmc__table-wrap">
        <div v-if="!fundData.profitability?.length" class="tsmc__empty">
          無獲利能力資料（FinMind 的 TaiwanStockProfitability 需要付費 token，
          請在 Workflow → 財務篩選 切換來源為 Goodinfo，或升級 FinMind 方案）
        </div>
        <table v-else class="tsmc__table">
          <thead>
            <tr>
              <th>期間</th>
              <th class="tsmc__th-r">ROE</th>
              <th class="tsmc__th-r">毛利率</th>
              <th class="tsmc__th-r">營益率</th>
              <th class="tsmc__th-r">淨利率</th>
              <th class="tsmc__th-r">EPS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in [...fundData.profitability].reverse()" :key="r.date || r.period">
              <td>{{ r.date || r.period || '—' }}</td>
              <td class="tsmc__num" :class="chgClass(r.roe)">{{ pctFmt(r.roe) }}</td>
              <td class="tsmc__num tsmc__num--accent">{{ pctFmt(r.gross_margin) }}</td>
              <td class="tsmc__num">{{ pctFmt(r.operating_margin) }}</td>
              <td class="tsmc__num">{{ pctFmt(r.net_margin) }}</td>
              <td class="tsmc__num">{{ r.eps != null ? Number(r.eps).toFixed(2) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="finTab === 'institutional'" class="tsmc__table-wrap">
        <div v-if="!fundData.institutional?.length" class="tsmc__empty">
          無法人動向資料（FinMind token 可能過期，或超過免費額度）
        </div>
        <table v-else class="tsmc__table">
          <thead>
            <tr>
              <th>日期</th>
              <th class="tsmc__th-r">外資</th>
              <th class="tsmc__th-r">投信</th>
              <th class="tsmc__th-r">自營</th>
              <th class="tsmc__th-r">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in [...fundData.institutional].reverse()" :key="r.date">
              <td>{{ r.date }}</td>
              <td class="tsmc__num" :class="chgClass(r.foreign_net)">{{ numFmt(r.foreign_net) }}</td>
              <td class="tsmc__num" :class="chgClass(r.trust_net)">{{ numFmt(r.trust_net) }}</td>
              <td class="tsmc__num" :class="chgClass(r.dealer_net)">{{ numFmt(r.dealer_net) }}</td>
              <td class="tsmc__num tsmc__num--bold" :class="chgClass(r.total_net)">{{ numFmt(r.total_net) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
