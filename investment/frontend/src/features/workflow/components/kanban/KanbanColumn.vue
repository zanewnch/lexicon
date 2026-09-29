<script setup lang="ts">
import { ref } from 'vue'
import type { KanbanCard, KanbanColumn } from '@/types/workflow'
import { COLUMN_LABELS } from '@/types/workflow'
import KanbanCardComp from './KanbanCard.vue'

const props = defineProps<{
  column: KanbanColumn
  cards: KanbanCard[]
  selectedCardId: string | null
  color: string
}>()

const emit = defineEmits<{
  select: [card: KanbanCard]
  move: [card: KanbanCard, direction: 1 | -1]
  delete: [id: string]
  add: [column: KanbanColumn, data: { code: string; name: string; sector: string; note: string }]
}>()

const showAddForm = ref(false)
const newCard = ref({ code: '', name: '', sector: '', note: '' })

function openAddForm() {
  showAddForm.value = true
  newCard.value = { code: '', name: '', sector: '', note: '' }
}

function submitAdd() {
  if (!newCard.value.code.trim()) return
  emit('add', props.column, { ...newCard.value })
  showAddForm.value = false
}
</script>

<template>
  <div class="kanban-col">
    <div class="kanban-col__header" :style="{ borderTopColor: color }">
      <span class="kanban-col__title">{{ COLUMN_LABELS[column] }}</span>
      <span class="kanban-col__count">{{ cards.length }}</span>
      <button class="kanban-col__add-btn" @click="openAddForm" title="新增">+</button>
    </div>

    <!-- Add Form -->
    <div v-if="showAddForm" class="kanban-col__add-form">
      <input v-model="newCard.code" placeholder="股票代碼 (如 2330)" class="kanban-col__input" />
      <input v-model="newCard.name" placeholder="股票名稱 (如 台積電)" class="kanban-col__input" />
      <input v-model="newCard.sector" placeholder="產業 (如 半導體)" class="kanban-col__input" />
      <textarea v-model="newCard.note" placeholder="備忘..." class="kanban-col__input kanban-col__textarea" rows="2" />
      <div class="kanban-col__form-actions">
        <button class="kanban-col__btn kanban-col__btn--ghost" @click="showAddForm = false">取消</button>
        <button class="kanban-col__btn kanban-col__btn--primary" @click="submitAdd">新增</button>
      </div>
    </div>

    <!-- Cards -->
    <div class="kanban-col__cards">
      <KanbanCardComp
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :column="column"
        :is-selected="selectedCardId === card.id"
        @select="emit('select', $event)"
        @move="(c, d) => emit('move', c, d)"
        @delete="emit('delete', $event)"
      />

      <div v-if="cards.length === 0" class="kanban-col__empty">
        點擊 + 新增股票
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kanban-col {
  flex: 1;
  min-width: 220px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
    border-top: 3px solid transparent;
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
    flex: 1;
  }

  &__count {
    font-size: 11px;
    font-weight: 600;
    background: var(--color-bg-hover);
    color: var(--color-text-muted);
    padding: 1px 6px;
    border-radius: 8px;
  }

  &__add-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;

    &:hover {
      background: var(--color-accent);
      color: #fff;
      border-color: var(--color-accent);
    }
  }

  &__add-form {
    padding: 10px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  &__form-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  &__cards {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__empty {
    text-align: center;
    font-size: 12px;
    color: var(--color-text-muted);
    padding: 24px 0;
  }

  &__input {
    width: 100%;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__textarea {
    resize: vertical;
    font-family: inherit;
    line-height: 1.6;
  }

  &__btn {
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.15s;

    &--primary {
      background: var(--color-accent);
      color: #fff;
      &:hover { opacity: 0.9; }
    }

    &--ghost {
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      &:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
    }
  }
}
</style>
