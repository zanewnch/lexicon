<script setup lang="ts">
import type { KanbanCard, KanbanColumn } from '@/types/workflow'
import { COLUMN_ORDER, COLUMN_LABELS } from '@/types/workflow'

const props = defineProps<{
  card: KanbanCard
  column: KanbanColumn
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [card: KanbanCard]
  move: [card: KanbanCard, direction: 1 | -1]
  delete: [id: string]
}>()

const colIndex = COLUMN_ORDER.indexOf(props.column)
const canMoveLeft = colIndex > 0
const canMoveRight = colIndex < COLUMN_ORDER.length - 1

function pnlColor() {
  if (props.card.exitPrice == null || props.card.entryPrice == null) return ''
  return props.card.exitPrice >= props.card.entryPrice ? 'text-up' : 'text-down'
}

function pnlPct() {
  if (props.card.exitPrice == null || props.card.entryPrice == null) return null
  return ((props.card.exitPrice - props.card.entryPrice) / props.card.entryPrice * 100).toFixed(1)
}
</script>

<template>
  <div
    class="kanban-card"
    :class="{ 'kanban-card--selected': isSelected }"
    @click="emit('select', card)"
  >
    <div class="kanban-card__top">
      <span class="kanban-card__code">{{ card.code }}</span>
      <span class="kanban-card__name">{{ card.name }}</span>
    </div>
    <div class="kanban-card__sector" v-if="card.sector">{{ card.sector }}</div>

    <!-- Active: show entry price -->
    <div v-if="column === 'active' && card.entryPrice" class="kanban-card__price">
      進場：{{ card.entryPrice }}
    </div>

    <!-- Closed: show pnl -->
    <div v-if="column === 'closed' && pnlPct() !== null" class="kanban-card__pnl" :class="pnlColor()">
      {{ Number(pnlPct()) > 0 ? '+' : '' }}{{ pnlPct() }}%
    </div>

    <div v-if="card.linkedNoteId" class="kanban-card__note-badge">🔗 筆記</div>

    <!-- Move buttons -->
    <div class="kanban-card__actions" @click.stop>
      <button
        v-if="canMoveLeft"
        class="kanban-card__move-btn"
        title="向左移動"
        @click="emit('move', card, -1)"
      >←</button>
      <button
        v-if="canMoveRight"
        class="kanban-card__move-btn kanban-card__move-btn--forward"
        :title="`移至${COLUMN_LABELS[COLUMN_ORDER[colIndex + 1]!]}`"
        @click="emit('move', card, 1)"
      >→</button>
      <button
        class="kanban-card__move-btn kanban-card__move-btn--del"
        title="刪除"
        @click="emit('delete', card.id)"
      >✕</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kanban-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;

  &:hover {
    border-color: var(--color-accent);
  }

  &--selected {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  &__code {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-accent);
    background: var(--color-accent-soft);
    padding: 1px 5px;
    border-radius: 3px;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__sector {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }

  &__price {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }

  &__pnl {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  &__note-badge {
    font-size: 10px;
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }

  &__actions {
    display: flex;
    gap: 4px;
    margin-top: 6px;
  }

  &__move-btn {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.12s;

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--forward {
      color: var(--color-accent);
      border-color: var(--color-accent);

      &:hover {
        background: var(--color-accent-soft);
      }
    }

    &--del {
      margin-left: auto;
      &:hover {
        color: var(--color-down);
        border-color: var(--color-down);
      }
    }
  }
}

.text-up { color: var(--color-up); }
.text-down { color: var(--color-down); }
</style>
