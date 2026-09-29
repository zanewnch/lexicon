<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import type { Candidate } from '@/types/trading'
import EmptyState from '@/components/ui/EmptyState.vue'

const router = useRouter()
const candidates = ref<Candidate[]>([])
const loading = ref(false)
const showAll = ref(false)

const filtered = computed(() =>
  showAll.value ? candidates.value : candidates.value.filter(c => !c.consumed),
)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get<Candidate[]>('/scanner/candidates/', {
      params: showAll.value ? { all: 1 } : {},
    })
    candidates.value = data
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="candidates">
    <div class="candidates__header">
      <h1 class="candidates__title">選股候選</h1>
      <label class="candidates__toggle">
        <input type="checkbox" v-model="showAll" @change="load" />
        顯示已採用
      </label>
    </div>

    <div v-if="loading" class="candidates__loading text-muted">載入中…</div>

    <EmptyState v-else-if="!filtered.length" message="目前沒有候選股，請先執行 Scanner" />

    <table v-else class="candidates__table">
      <thead>
        <tr>
          <th>代號</th>
          <th>分數</th>
          <th>建立時間</th>
          <th>狀態</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in filtered"
          :key="c.id"
          class="candidates__row"
          @click="router.push({ path: '/analysis/quote', query: { code: c.symbol } })"
        >
          <td class="candidates__symbol">{{ c.symbol }}</td>
          <td>{{ c.score != null ? c.score.toFixed(2) : '—' }}</td>
          <td>{{ new Date(c.createdAt).toLocaleString('zh-TW') }}</td>
          <td>
            <span :class="c.consumed ? 'candidates__badge candidates__badge--used' : 'candidates__badge candidates__badge--new'">
              {{ c.consumed ? '已採用' : '待進場' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.candidates {
  padding: var(--gap-xl);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--gap-lg);
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--gap-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  &__loading {
    padding: var(--gap-xl);
    text-align: center;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);

    th {
      padding: var(--gap-sm) var(--gap-md);
      text-align: left;
      font-weight: 600;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--glass-border);
    }
  }

  &__row {
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
    }

    td {
      padding: var(--gap-sm) var(--gap-md);
      border-bottom: 1px solid var(--glass-border);
      color: var(--color-text-secondary);
    }
  }

  &__symbol {
    font-weight: 600;
    color: var(--color-text-primary) !important;
  }

  &__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 600;

    &--new {
      background: color-mix(in srgb, #22c55e 15%, transparent);
      color: #22c55e;
    }

    &--used {
      background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
      color: var(--color-text-muted);
    }
  }
}
</style>
