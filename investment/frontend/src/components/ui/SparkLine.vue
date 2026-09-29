<script setup lang="ts">
/**
 * SparkLine — 軍型折線圖元件（基於 Chart.js）
 *
 * 提供简潔的線圖顯示，適合卸展走勢、資產走勢、指數變化等小圖。
 * - 支援變聯區域劀（`fill: true` + 漸層色）
 * - 支援 Crosshair 插件（已自動注冊）
 * - `showAxes` 可控制軸線顯示，`showTooltip` 可控制提示框
 * - `color` prop 控制線條顏色及漸層背景，預設綠色 `#22c55e`
 *
 * @example
 * ```vue
 * <SparkLine :data="trendData" color="#3b82f6" :height="120" :show-axes="true" />
 * ```
 */
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js'
import crosshairPlugin from '@/plugins/chartCrosshair'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, crosshairPlugin)

const props = withDefaults(
  defineProps<{
    data: number[]
    labels?: string[]
    color?: string
    height?: number
    showTooltip?: boolean
    showAxes?: boolean
  }>(),
  {
    color: '#22c55e',
    height: 60,
    showTooltip: true,
    showAxes: false,
  },
)

const chartData = computed(() => {
  const fallbackLabels = props.labels && props.labels.length > 0
    ? props.labels
    : props.data.map((_, i) => String(i))
  return {
    labels: fallbackLabels,
    datasets: [
      {
        data: props.data,
        borderColor: props.color,
        borderWidth: 1.5,
        fill: true,
        backgroundColor: (ctx: any) => {
          const canvas = ctx.chart.ctx
          const gradient = canvas.createLinearGradient(0, 0, 0, ctx.chart.height)
          gradient.addColorStop(0, props.color + '25')
          gradient.addColorStop(0.6, props.color + '10')
          gradient.addColorStop(1, props.color + '00')
          return gradient
        },
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: props.color,
        pointHoverBorderColor: '#0f172a',
        pointHoverBorderWidth: 2,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: props.showAxes ? { top: 8, right: 0, bottom: 0, left: 0 } : 0,
  },
  animation: {
    duration: 600,
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    tooltip: {
      enabled: props.showTooltip,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#f1f5f9',
      titleFont: { size: 11 },
      bodyFont: { size: 13, weight: 'bold' as const },
      padding: { top: 6, bottom: 6, left: 10, right: 10 },
      displayColors: false,
      cornerRadius: 6,
      callbacks: {
        label: (ctx: any) => ctx.parsed.y.toLocaleString('zh-TW'),
      },
    },
    legend: {
      display: false,
    },
    crosshair: {
      color: 'rgba(148, 163, 184, 0.3)',
    },
  },
  scales: {
    x: {
      display: props.showAxes,
      grid: {
        color: 'rgba(51, 65, 85, 0.15)',
        drawTicks: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#64748b',
        font: { size: 10 },
        maxTicksLimit: 8,
        maxRotation: 0,
        padding: 4,
      },
    },
    y: {
      display: props.showAxes,
      position: 'right' as const,
      grid: {
        color: 'rgba(51, 65, 85, 0.3)',
        drawTicks: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#64748b',
        font: { size: 10 },
        maxTicksLimit: 5,
        padding: 8,
        callback: (value: any) => Number(value).toLocaleString('zh-TW'),
      },
    },
  },
}))
</script>

<template>
  <div class="sparkline" :style="{ height: height ? `${height}px` : '100%' }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped lang="scss">
.sparkline {
  width: 100%;
  position: relative;
}
</style>
