<script setup lang="ts">
defineProps<{
  indicators: {
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
  }[]
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function chgClass(v: number | null): string {
  if (v === null) return ''
  return v > 0 ? 'up' : v < 0 ? 'down' : ''
}

function chgText(v: number | null): string {
  if (v === null) return '\u2014'
  return (v > 0 ? '+' : '') + v.toFixed(2) + '%'
}

function miniSparkline(history: { close: number }[]): string {
  if (history.length < 2) return ''
  const vals = history.map(h => h.close)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return pts
}
</script>

<template>
  <div class="funnel-indicators">
    <div v-if="loading" class="funnel-indicators__loading">載入指標中...</div>
    <div v-else-if="error" class="funnel-indicators__error">{{ error }}</div>
    <template v-else>
      <div
        v-for="ind in indicators"
        :key="ind.id"
        class="funnel-indicators__card"
      >
        <div class="funnel-indicators__top">
          <span class="funnel-indicators__name">{{ ind.name }}</span>
          <button class="funnel-indicators__refresh-btn" @click="emit('refresh')" title="重新整理">↻</button>
        </div>
        <div class="funnel-indicators__body">
          <!-- 迷你折線圖 -->
          <svg class="funnel-indicators__spark" viewBox="0 0 80 28" preserveAspectRatio="none">
            <polyline
              v-if="ind.history.length > 1"
              :points="miniSparkline(ind.history)"
              fill="none"
              stroke="var(--color-accent)"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
          <div class="funnel-indicators__stats">
            <div class="funnel-indicators__latest">
              {{ ind.latest !== null ? ind.latest.toLocaleString() : '\u2014' }}
              <span class="funnel-indicators__unit">{{ ind.unit }}</span>
            </div>
            <div class="funnel-indicators__changes">
              <span class="funnel-indicators__chg" :class="chgClass(ind.chg_1m)">
                1M {{ chgText(ind.chg_1m) }}
              </span>
              <span class="funnel-indicators__chg" :class="chgClass(ind.chg_3m)">
                3M {{ chgText(ind.chg_3m) }}
              </span>
            </div>
          </div>
        </div>
        <div class="funnel-indicators__desc">{{ ind.desc }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.funnel-indicators {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__loading,
  &__error {
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: center;
    padding: 16px 0;
  }

  &__error {
    color: var(--color-down);
  }

  &__card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 10px;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  &__name {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__stats {
    flex: 1;
  }

  &__latest {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  &__unit {
    font-size: 10px;
    font-weight: 400;
    color: var(--color-text-muted);
    margin-left: 3px;
  }

  &__changes {
    display: flex;
    gap: 8px;
    margin-top: 3px;
  }

  &__desc {
    font-size: 10px;
    color: var(--color-text-muted);
    margin-top: 6px;
    line-height: 1.4;
  }

  &__spark {
    width: 80px;
    height: 28px;
    flex-shrink: 0;
  }

  &__refresh-btn {
    font-size: 13px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 0;
    line-height: 1;
    transition: color 0.15s;

    &:hover {
      color: var(--color-accent);
    }
  }

  &__chg {
    font-size: 10px;
    font-weight: 600;

    &.up { color: var(--color-up); }
    &.down { color: var(--color-down); }
  }
}
</style>
