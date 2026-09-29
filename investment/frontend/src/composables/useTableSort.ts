import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { SortOrder } from '@/types/common'

export function useTableSort(opts?: { resetable?: boolean; defaultField?: string; defaultOrder?: SortOrder }) {
  const sortField = ref(opts?.defaultField ?? '')
  const sortOrder = ref<SortOrder>(opts?.defaultOrder ?? 'desc')

  function toggleSort(field: string) {
    if (sortField.value === field) {
      if (opts?.resetable && sortOrder.value === 'asc') {
        sortField.value = ''
        sortOrder.value = 'desc'
      } else {
        sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
      }
    } else {
      sortField.value = field
      sortOrder.value = 'desc'
    }
  }

  function sortIcon(field: string) {
    if (sortField.value !== field) return '↕'
    return sortOrder.value === 'desc' ? '↓' : '↑'
  }

  return { sortField, sortOrder, toggleSort, sortIcon }
}

export function useSortedData<T extends Record<string, unknown>>(
  data: Ref<T[]>,
  sort: ReturnType<typeof useTableSort>,
) {
  return computed(() => {
    if (!sort.sortField.value) return data.value
    const field = sort.sortField.value as keyof T
    const mul = sort.sortOrder.value === 'desc' ? -1 : 1
    return [...data.value].sort((a, b) => ((a[field] as number) - (b[field] as number)) * mul)
  })
}
