<script setup lang="ts">
import type { BudgetRow, BudgetResponse } from '@/types/funnel'

defineProps<{
  rows: BudgetRow[]
  datasets: BudgetResponse['datasets']
  loading: boolean
  error: string
  parsed: boolean
  fetchedAt: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function formatFetchedAt(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm} 更新`
}

function yoyClass(v: number | null): string {
  if (v === null) return ''
  return v > 0 ? 'up' : v < 0 ? 'down' : ''
}

function yoyText(v: number | null): string {
  if (v === null) return '\u2014'
  return (v > 0 ? '+' : '') + v.toFixed(1) + '%'
}
</script>

<template>
  <div class="funnel-budget">
    <div class="funnel-budget__header">
      <span class="funnel-budget__title">歲出政事別預算年增率</span>
      <span class="funnel-budget__source">主計總處</span>
      <span v-if="fetchedAt" class="funnel-budget__meta">{{ formatFetchedAt(fetchedAt) }}</span>
      <button class="funnel-budget__refresh" @click="emit('refresh')" title="重新整理">↻</button>
    </div>

    <div v-if="loading" class="funnel-budget__state">載入中...</div>
    <div v-else-if="error" class="funnel-budget__state funnel-budget__state--error">{{ error }}</div>
    <template v-else>
      <!-- 解析成功：顯示年增率表格 -->
      <table v-if="parsed && rows.length" class="funnel-budget__table">
        <thead>
          <tr>
            <th>政事別</th>
            <th>本年度（千元）</th>
            <th>上年度（千元）</th>
            <th>年增率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <td>
              {{ row.name }}
              <span v-if="row.tag" class="funnel-budget__tag">{{ row.tag }}</span>
            </td>
            <td class="funnel-budget__num">{{ row.this_yr ? row.this_yr.toLocaleString() : '\u2014' }}</td>
            <td class="funnel-budget__num">{{ row.last_yr ? row.last_yr.toLocaleString() : '\u2014' }}</td>
            <td class="funnel-budget__yoy" :class="yoyClass(row.yoy_pct)">{{ yoyText(row.yoy_pct) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 未解析成功：顯示可下載的資料集連結 -->
      <div v-else class="funnel-budget__datasets">
        <p class="funnel-budget__hint">自動解析尚未支援此格式，可手動下載：</p>
        <ul class="funnel-budget__links">
          <li v-for="ds in datasets" :key="ds.id">
            <span class="funnel-budget__ds-title">{{ ds.title }}</span>
            <span class="funnel-budget__ds-date">{{ ds.modified }}</span>
            <span v-for="res in ds.resources" :key="res.url">
              <a :href="res.url" target="_blank" rel="noopener noreferrer" class="funnel-budget__dl">
                ↓ {{ res.format }}
              </a>
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.funnel-budget {
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  max-height: 220px;
  overflow-y: auto;

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px 6px;
    position: sticky;
    top: 0;
    background: var(--color-bg-primary);
    z-index: 1;
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-primary);
    flex: 1;
  }

  &__source {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 8px;
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
    font-weight: 600;
  }

  &__meta {
    font-size: 10px;
    color: var(--color-text-muted);
  }

  &__refresh {
    font-size: 13px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 0;
    line-height: 1;
    transition: color 0.15s;
    &:hover { color: var(--color-accent); }
  }

  &__state {
    font-size: 12px;
    color: var(--color-text-muted);
    padding: 12px 20px;
    &--error { color: var(--color-down); }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;

    th {
      text-align: left;
      padding: 5px 12px;
      color: var(--color-text-muted);
      font-weight: 600;
      font-size: 10px;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 35px;
      background: var(--color-bg-primary);
    }

    td {
      padding: 5px 12px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }
  }

  &__num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted) !important;
    font-size: 10px !important;
  }

  &__yoy {
    text-align: right;
    font-weight: 700;
    &.up { color: var(--color-up) !important; }
    &.down { color: var(--color-down) !important; }
  }

  &__tag {
    font-size: 9px;
    margin-left: 4px;
    padding: 1px 5px;
    border-radius: 6px;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }

  &__datasets {
    padding: 10px 20px;
  }

  &__hint {
    font-size: 11px;
    color: var(--color-text-muted);
    margin: 0 0 8px;
  }

  &__links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__ds-title {
    font-size: 11px;
    color: var(--color-text-primary);
    margin-right: 6px;
  }

  &__ds-date {
    font-size: 10px;
    color: var(--color-text-muted);
    margin-right: 8px;
  }

  &__dl {
    font-size: 10px;
    color: var(--color-accent);
    text-decoration: none;
    margin-right: 6px;
    &:hover { text-decoration: underline; }
  }
}
</style>
