<script setup lang="ts">
import type { PolicyNewsItem } from '@/types/funnel'

defineProps<{
  items: PolicyNewsItem[]
  loading: boolean
  error: string
  fetchedAt: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function sourceBadgeClass(source: PolicyNewsItem['source']): string {
  return source === 'ey_gov' ? 'funnel-policy__badge--gov' : 'funnel-policy__badge--anue'
}

function formatFetchedAt(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm} 更新`
}
</script>

<template>
  <div class="funnel-policy">
    <div class="funnel-policy__header">
      <span class="funnel-policy__title">最新政策情報</span>
      <span v-if="fetchedAt" class="funnel-policy__meta">{{ formatFetchedAt(fetchedAt) }}</span>
      <button class="funnel-policy__refresh" @click="emit('refresh')" title="重新整理">↻</button>
    </div>

    <div v-if="loading" class="funnel-policy__state">載入中...</div>
    <div v-else-if="error" class="funnel-policy__state funnel-policy__state--error">{{ error }}</div>
    <ul v-else class="funnel-policy__list">
      <li
        v-for="(item, idx) in items"
        :key="`${item.source}-${idx}`"
        class="funnel-policy__item"
      >
        <span class="funnel-policy__badge" :class="sourceBadgeClass(item.source)">{{ item.source_label }}</span>
        <a class="funnel-policy__link" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
        <span v-if="item.date" class="funnel-policy__date">{{ item.date }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.funnel-policy {
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  max-height: 240px;
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

  &__list {
    list-style: none;
    margin: 0;
    padding: 8px 16px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__item {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 5px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    transition: border-color 0.15s;

    &:hover { border-color: var(--color-accent); }
  }

  &__badge {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 8px;
    white-space: nowrap;
    flex-shrink: 0;

    &--gov {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    &--anue {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }
  }

  &__link {
    font-size: 12px;
    color: var(--color-text-primary);
    text-decoration: none;
    flex: 1;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    &:hover { color: var(--color-accent); }
  }

  &__date {
    font-size: 10px;
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
}
</style>
