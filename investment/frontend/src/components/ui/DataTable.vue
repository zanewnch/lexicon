<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
  sticky?: boolean
}

type SortDir = 'asc' | 'desc' | null

const props = withDefaults(defineProps<{
  columns: TableColumn<T>[]
  rows: T[]
  loading?: boolean
  compact?: boolean
  sticky?: boolean
  rowKey?: string
  emptyMessage?: string
  defaultSortKey?: string
  defaultSortDir?: SortDir
}>(), {
  loading: false,
  compact: false,
  sticky: false,
  rowKey: 'id',
  emptyMessage: '暫無資料',
  defaultSortKey: '',
  defaultSortDir: null,
})

const emit = defineEmits<{
  'row-click': [row: T]
  'sort': [key: string, dir: SortDir]
}>()

// ── 排序狀態 ─────────────────────────────────────────────
const sortKey = ref<string>(props.defaultSortKey)
const sortDir = ref<SortDir>(props.defaultSortDir)

function toggleSort(col: TableColumn<T>) {
  if (!col.sortable) return
  if (sortKey.value !== col.key) {
    sortKey.value = col.key
    sortDir.value = 'desc'
  } else {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : sortDir.value === 'asc' ? null : 'desc'
    if (sortDir.value === null) sortKey.value = ''
  }
  emit('sort', sortKey.value, sortDir.value)
}

const sortedRows = computed(() => {
  if (!sortKey.value || sortDir.value === null) return props.rows
  return [...props.rows].sort((a, b) => {
    const va = a[sortKey.value] as number | string
    const vb = b[sortKey.value] as number | string
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

function sortIcon(col: TableColumn<T>) {
  if (!col.sortable) return ''
  if (sortKey.value !== col.key) return '⇅'
  if (sortDir.value === 'asc') return '↑'
  if (sortDir.value === 'desc') return '↓'
  return '⇅'
}
</script>

<template>
  <div
    class="data-table-wrap"
    :class="{
      'data-table-wrap--loading': loading,
      'data-table-wrap--compact': compact,
    }"
  >
    <table class="data-table" :class="{ 'data-table--sticky': sticky, 'data-table--compact': compact }">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              col.sortable ? 'data-table__sortable' : '',
              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
              col.sticky ? 'data-table__sticky' : '',
            ]"
            :style="col.width ? { width: col.width, minWidth: col.width } : undefined"
            @click="toggleSort(col)"
          >
            <span class="data-table__th-inner">
              <slot :name="`head-${col.key}`" :col="col">{{ col.label }}</slot>
              <span v-if="col.sortable" class="data-table__sort-icon" :class="{ 'data-table__sort-icon--active': sortKey === col.key }">
                {{ sortIcon(col) }}
              </span>
            </span>
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="loading">
          <tr v-for="n in 5" :key="`skel-${n}`" class="data-table__skeleton-row">
            <td v-for="col in columns" :key="col.key">
              <span class="data-table__skeleton-cell shimmer" />
            </td>
          </tr>
        </template>

        <template v-else-if="sortedRows.length === 0">
          <tr>
            <td :colspan="columns.length" class="data-table__empty">
              <slot name="empty">{{ emptyMessage }}</slot>
            </td>
          </tr>
        </template>

        <template v-else>
          <tr
            v-for="row in sortedRows"
            :key="String(row[rowKey] ?? Math.random())"
            @click="emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
                col.sticky ? 'data-table__sticky' : '',
              ]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
// ── DataTable CSS variables ────────────────────────────────
// --table-row-hover-bg   hover 列背景
// --table-header-color   th 文字色
// --table-border-color   格線色

.data-table-wrap {
  width: 100%;
  overflow-x: auto;

  &--loading { opacity: 0.6; pointer-events: none; }
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 10px 12px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--table-header-color, var(--color-text-muted));
    border-bottom: 1px solid var(--table-border-color, var(--color-border));
    white-space: nowrap;
  }

  td {
    padding: 10px 12px;
    font-variant-numeric: tabular-nums;
    border-bottom: 1px solid var(--table-border-color, var(--color-border));
    white-space: nowrap;
  }

  tbody tr {
    transition: background var(--duration-fast);
    cursor: pointer;

    &:hover { background: var(--table-row-hover-bg, var(--color-bg-hover)); }
    &:last-child td { border-bottom: none; }
  }

  // ── Variants ──────────────────────────────────────
  &--sticky th {
    position: sticky;
    top: 0;
    background: var(--color-bg-card);
    z-index: 2;
  }

  &--compact td,
  &--compact th {
    padding: var(--gap-sm) 10px;
    font-size: 13px;
  }

  // ── Sortable th ───────────────────────────────────
  &__sortable { cursor: pointer; user-select: none; }
  &__th-inner {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  &__sort-icon {
    font-size: 10px;
    opacity: 0.4;
    transition: opacity var(--duration-fast), color var(--duration-fast);
    &--active { opacity: 1; color: var(--color-accent); }
  }

  // ── Sticky column ─────────────────────────────────
  &__sticky {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--color-bg-card);
  }

  // ── Empty ─────────────────────────────────────────
  &__empty {
    text-align: center;
    padding: 48px 20px;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    border-bottom: none !important;
  }

  // ── Skeleton rows ─────────────────────────────────
  &__skeleton-row td { border-bottom: 1px solid var(--color-border); }
  &__skeleton-cell {
    display: block;
    height: 14px;
    border-radius: var(--radius-sm);
    width: 80%;
  }
}

.text-center { text-align: center; }
</style>
