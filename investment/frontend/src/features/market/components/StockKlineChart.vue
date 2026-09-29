<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Chart as VueChart } from 'vue-chartjs'
import {
  Chart as ChartJS, BarController, BarElement, LineController, LineElement,
  PointElement, CategoryScale, LinearScale, Tooltip, type Plugin,
} from 'chart.js'
import type { KlineBar } from '@/types/market'
import { classifyCandle } from '@/features/market/utils/candlestick'

ChartJS.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{
  bars: KlineBar[]
  loading: boolean
  name: string
  code: string
}>()
const emit = defineEmits<{ periodChange: [period: string, limit: number, keepPrevious?: boolean] }>()

const periods = [
  { label: '5分', value: '5Min', limit: 90 },
  { label: '15分', value: '15Min', limit: 90 },
  { label: '30分', value: '30Min', limit: 90 },
  { label: '60分', value: '60Min', limit: 90 },
  { label: '日', value: 'Day', limit: 60 },
  { label: '週', value: 'Week', limit: 26 },
  { label: '月', value: 'Month', limit: 12 },
] as const
const selectedPeriod = ref('Day')
const selectedIndex = ref(-1)
const volumeMode = ref<'volume' | 'none'>('volume')
const averages = [
  { period: 5, color: '#8ab9f4' },
  { period: 10, color: '#7064dc' },
  { period: 20, color: '#d98b55' },
  { period: 60, color: '#ddc362' },
  { period: 120, color: '#93513e' },
  { period: 240, color: '#8b9199' },
] as const
const enabled = ref<Record<number, boolean>>({ 5: true, 10: true, 20: true, 60: false, 120: false, 240: false })

const visibleBars = computed(() => props.bars.slice(-50))
const activeBar = computed(() => visibleBars.value[selectedIndex.value] ?? visibleBars.value[visibleBars.value.length - 1])
const activeShape = computed(() => activeBar.value ? classifyCandle(activeBar.value) : null)
const latestDate = computed(() => props.bars[props.bars.length - 1]?.ts.slice(0, 10).replace(/-/g, '/') ?? '')
const activeDate = computed(() => activeBar.value?.ts.slice(0, 10).replace(/-/g, '/') ?? '')
const activeTime = computed(() => activeBar.value?.ts.slice(11, 16) ?? '')
const volumeValue = computed(() => activeBar.value?.volume ?? 0)
const selectedAbsoluteIndex = computed(() => props.bars.length - visibleBars.value.length + (selectedIndex.value < 0 ? visibleBars.value.length - 1 : selectedIndex.value))
const changeFromPrevious = computed(() => activeBar.value && selectedAbsoluteIndex.value > 0
  ? activeBar.value.close - props.bars[selectedAbsoluteIndex.value - 1]!.close
  : null)

function averageAt(period: number, index: number): number | null {
  if (index < period - 1) return null
  let sum = 0
  for (let i = index - period + 1; i <= index; i++) sum += props.bars[i]!.close
  return sum / period
}

function averageVolumeAt(period: number, index: number): number | null {
  if (index < period - 1) return null
  let sum = 0
  for (let i = index - period + 1; i <= index; i++) sum += props.bars[i]!.volume
  return sum / period
}

function number(value: number | null | undefined): string {
  return value == null ? '—' : Number(value.toFixed(2)).toLocaleString('zh-TW')
}

function direction(value: number | null, previous: number | null): string {
  if (value == null || previous == null) return ''
  return value > previous ? '▲' : value < previous ? '▼' : ''
}

const chartData = computed(() => {
  const offset = props.bars.length - visibleBars.value.length
  return {
    labels: visibleBars.value.map((bar) => selectedPeriod.value.endsWith('Min')
      ? bar.ts.slice(5, 16).replace('T', ' ')
      : bar.ts.slice(5, 10)),
    datasets: [
      {
        type: 'bar' as const,
        label: '成交量',
        data: visibleBars.value.map((bar) => volumeMode.value === 'volume' ? bar.volume : 0),
        yAxisID: 'volume',
        backgroundColor: visibleBars.value.map((bar) => bar.close >= bar.open ? '#d85a62aa' : '#53a77baa'),
        barPercentage: 0.64,
        categoryPercentage: 1,
      },
      {
        type: 'line' as const,
        label: '收盤',
        data: visibleBars.value.map((bar) => bar.close),
        yAxisID: 'price',
        borderWidth: 0,
        pointRadius: 0,
        pointHitRadius: 12,
      },
      ...averages.filter((ma) => enabled.value[ma.period]).map((ma) => ({
        type: 'line' as const,
        label: `MA${ma.period}`,
        data: visibleBars.value.map((_, i) => averageAt(ma.period, offset + i)),
        yAxisID: 'price',
        borderColor: ma.color,
        borderWidth: 1.7,
        pointRadius: 0,
        spanGaps: false,
        tension: 0,
      })),
    ],
  }
})

// Chart.js supplies scales, resizing and pointer hit testing; the plugin paints OHLC bodies and wicks.
const candlePlugin: Plugin = {
  id: 'stockCandles',
  beforeDatasetsDraw(chart) {
    const x = chart.scales.x
    const y = chart.scales.price
    if (!x || !y || visibleBars.value.length === 0) return
    const ctx = chart.ctx
    const spacing = x.getPixelForValue(Math.min(1, visibleBars.value.length - 1)) - x.getPixelForValue(0)
    const width = Math.max(3, Math.min(16, Math.abs(spacing || chart.chartArea.width / visibleBars.value.length) * 0.58))
    ctx.save()
    visibleBars.value.forEach((bar, index) => {
      const px = x.getPixelForValue(index)
      const open = y.getPixelForValue(bar.open)
      const close = y.getPixelForValue(bar.close)
      const high = y.getPixelForValue(bar.high)
      const low = y.getPixelForValue(bar.low)
      const color = bar.close >= bar.open ? '#d85a62' : '#53a77b'
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(px, high)
      ctx.lineTo(px, low)
      ctx.stroke()
      ctx.fillRect(px - width / 2, Math.min(open, close), width, Math.max(1.5, Math.abs(close - open)))
    })
    ctx.restore()
  },
}

const chartOptions = computed(() => {
  const offset = props.bars.length - visibleBars.value.length
  const averageValues = averages
    .filter((ma) => enabled.value[ma.period])
    .flatMap((ma) => visibleBars.value.map((_, index) => averageAt(ma.period, offset + index)))
    .filter((value): value is number => value !== null)
  const lows = [...visibleBars.value.map((bar) => bar.low), ...averageValues]
  const highs = [...visibleBars.value.map((bar) => bar.high), ...averageValues]
  const min = Math.min(...lows)
  const max = Math.max(...highs)
  const pad = Number.isFinite(min) ? Math.max((max - min) * 0.07, min * 0.003) : 1
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: 'index' as const, intersect: false },
    onHover: (_event: unknown, elements: Array<{ index: number }>) => { selectedIndex.value = elements[0]?.index ?? -1 },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8795a8', maxTicksLimit: 7, maxRotation: 0 },
        border: { color: '#71809644' },
      },
      price: {
        position: 'right' as const,
        min: Number.isFinite(min) ? min - pad : undefined,
        max: Number.isFinite(max) ? max + pad : undefined,
        grid: { color: '#71809630' },
        ticks: { color: '#8795a8', maxTicksLimit: 6, callback: (value: number | string) => number(Number(value)) },
        border: { display: false },
      },
      volume: {
        position: 'left' as const,
        min: 0,
        max: Math.max(...visibleBars.value.map((bar) => bar.volume), 1) * 4,
        display: false,
        grid: { display: false },
      },
    },
  }
})

function changePeriod(period: typeof periods[number]) {
  if (selectedPeriod.value === period.value) return
  selectedPeriod.value = period.value
  selectedIndex.value = -1
  emit('periodChange', period.value, period.limit)
}

function onAverageToggle(period: number) {
  if (enabled.value[period] && props.bars.length < period) {
    emit('periodChange', selectedPeriod.value, Math.min(365, period + 30), true)
  }
}

watch(() => props.code, () => {
  selectedPeriod.value = 'Day'
  selectedIndex.value = -1
})
watch(() => props.bars, () => { selectedIndex.value = -1 })
</script>

<template>
  <div class="stock-kline">
    <div class="stock-kline__periods" role="group" aria-label="K 線週期">
      <button v-for="period in periods" :key="period.value" type="button"
        class="stock-kline__period" :class="{ 'stock-kline__period--active': selectedPeriod === period.value }"
        :aria-pressed="selectedPeriod === period.value" @click="changePeriod(period)">{{ period.label }}</button>
    </div>

    <div class="stock-kline__heading">
      <strong>{{ name }} ({{ code }})</strong>
      <span>{{ latestDate }}</span>
    </div>

    <div v-if="activeBar" class="stock-kline__readout">
      <span>{{ activeDate }} {{ selectedPeriod.endsWith('Min') ? activeTime : '' }}</span>
      <span>開 <b>{{ number(activeBar.open) }}</b></span>
      <span>高 <b class="stock-kline__up">{{ number(activeBar.high) }}</b></span>
      <span>低 <b class="stock-kline__down">{{ number(activeBar.low) }}</b></span>
      <span>收 <b :class="activeBar.close >= activeBar.open ? 'stock-kline__up' : 'stock-kline__down'">{{ number(activeBar.close) }}</b></span>
      <span>量(張) <b>{{ volumeValue.toLocaleString('zh-TW') }}</b></span>
      <span>漲跌 <b :class="(changeFromPrevious ?? 0) >= 0 ? 'stock-kline__up' : 'stock-kline__down'">{{ number(changeFromPrevious) }}</b></span>
    </div>

    <div class="stock-kline__guide" aria-label="K 棒構造固定說明">
      <strong class="stock-kline__guide-title">K 棒怎麼看</strong>
      <div class="stock-kline__guide-items">
        <div class="stock-kline__guide-item">
          <span class="stock-kline__guide-marker stock-kline__guide-marker--body" aria-hidden="true"></span>
          <span><b>實體（粗色塊）</b>是開盤價到收盤價；紅色代表收盤較高，綠色代表收盤較低。</span>
        </div>
        <div class="stock-kline__guide-item">
          <span class="stock-kline__guide-marker stock-kline__guide-marker--wick" aria-hidden="true"></span>
          <span><b>影線（上下細線）</b>是你說的「虛線」：上端到最高價，下端到最低價。</span>
        </div>
      </div>
    </div>

    <div v-if="activeShape" class="stock-kline__shape-hint">
      <span class="stock-kline__shape-label">單根 K 棒形狀（依比例分類）</span>
      <strong>{{ activeShape.name }}</strong>
      <span>{{ activeShape.interpretation }}</span>
    </div>

    <div class="stock-kline__averages" role="group" aria-label="移動平均線">
      <label v-for="ma in averages" :key="ma.period" class="stock-kline__average"
        :style="{ '--ma-color': ma.color }"
        :title="bars.length < ma.period ? `勾選以載入 MA${ma.period} 所需的歷史 K 線` : `顯示或隱藏 MA${ma.period}`">
        <input v-model="enabled[ma.period]" type="checkbox" @change="onAverageToggle(ma.period)" />
        <span>MA{{ ma.period }}</span>
        <b>{{ number(averageAt(ma.period, selectedAbsoluteIndex)) }}</b>
        <span :class="direction(averageAt(ma.period, selectedAbsoluteIndex), averageAt(ma.period, selectedAbsoluteIndex - 1)) === '▲' ? 'stock-kline__up' : 'stock-kline__down'">{{ direction(averageAt(ma.period, selectedAbsoluteIndex), averageAt(ma.period, selectedAbsoluteIndex - 1)) }}</span>
      </label>
    </div>

    <div v-if="loading" class="stock-kline__state">K 線資料載入中…</div>
    <div v-else-if="bars.length === 0" class="stock-kline__state">目前沒有 K 線資料</div>
    <div v-else class="stock-kline__canvas">
      <VueChart type="bar" :data="chartData" :options="chartOptions" :plugins="[candlePlugin]" />
    </div>

    <div class="stock-kline__volume">
      <label for="stock-volume-mode">副圖</label>
      <select id="stock-volume-mode" v-model="volumeMode">
        <option value="volume">成交量</option>
        <option value="none">隱藏</option>
      </select>
      <template v-if="volumeMode === 'volume' && activeBar">
        <span>量(張) {{ volumeValue.toLocaleString('zh-TW') }}</span>
        <span>MV5 {{ number(averageVolumeAt(5, selectedAbsoluteIndex)) }}</span>
        <span>MV20 {{ number(averageVolumeAt(20, selectedAbsoluteIndex)) }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stock-kline {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  gap: 10px;
  font-variant-numeric: tabular-nums;

  &__periods { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
  &__period { padding: 8px 4px; border: 0; border-right: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); font-size: 14px; cursor: pointer; }
  &__period:last-child { border-right: 0; }
  &__period:hover { background: var(--color-bg-hover); }
  &__period--active { background: var(--color-accent-soft); color: var(--color-accent); font-weight: 700; }
  &__heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 18px; }
  &__heading span { color: var(--color-text-muted); font-size: 14px; }
  &__readout, &__averages, &__volume { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; }
  &__readout b, &__average b { color: var(--color-text-primary); }
  &__guide { display: grid; gap: 5px; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 12px; line-height: 1.45; }
  &__guide-title { color: var(--color-text-primary); font-size: 13px; }
  &__guide-items { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 18px; }
  &__guide-item { display: flex; align-items: center; gap: 9px; min-width: 0; }
  &__guide-item b { color: var(--color-text-primary); }
  &__guide-marker { position: relative; flex: 0 0 18px; height: 24px; }
  &__guide-marker--body::before { content: ''; position: absolute; top: 4px; left: 5px; width: 8px; height: 16px; background: #d85a62; }
  &__guide-marker--wick::before { content: ''; position: absolute; top: 1px; left: 8px; width: 2px; height: 22px; background: #d85a62; }
  &__shape-hint { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 9px; padding: 7px 10px; border-radius: 6px; background: var(--color-accent-soft); font-size: 12px; line-height: 1.45; color: var(--color-text-secondary); }
  &__shape-hint strong { color: var(--color-text-primary); font-size: 13px; }
  &__shape-label { color: var(--color-accent); font-weight: 600; }
  &__averages { gap: 8px 16px; }
  &__average { display: inline-flex; align-items: center; gap: 4px; color: var(--ma-color); cursor: pointer; }
  &__average input { accent-color: var(--ma-color); margin: 0 2px 0 0; }
  &__up { color: #d85a62 !important; }
  &__down { color: #53a77b !important; }
  &__canvas { position: relative; flex: 1; min-height: 200px; }
  &__state { flex: 1; min-height: 260px; display: grid; place-items: center; color: var(--color-text-muted); }
  &__volume { border-top: 1px solid var(--color-border); padding-top: 9px; color: var(--color-text-secondary); }
  &__volume select { border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-card); color: var(--color-text-primary); padding: 4px 8px; }
}

@media (max-width: 700px) {
  .stock-kline { gap: 8px; }
  .stock-kline__period { font-size: 12px; }
  .stock-kline__readout, .stock-kline__averages, .stock-kline__volume { font-size: 12px; gap: 5px 10px; }
  .stock-kline__guide-items { grid-template-columns: 1fr; }
}
</style>
