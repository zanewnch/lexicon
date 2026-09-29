<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { KanbanCard, KanbanColumn } from '@/types/workflow'
import { COLUMN_ORDER } from '@/types/workflow'
import type { Note } from '@/types/notes'
import api from '@/api'
import KanbanColumnComp from '@/features/workflow/components/kanban/KanbanColumn.vue'

const router = useRouter()

const cards = ref<KanbanCard[]>([])
const notes = ref<Note[]>([])
const selectedCard = ref<KanbanCard | null>(null)
const showNoteModal = ref(false)

const STORAGE_KEY = 'workflow-kanban'

onMounted(async () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { cards.value = JSON.parse(saved) } catch {}
  }
  const { data } = await api.get<Note[]>('/notes/')
  notes.value = data
})

watch(cards, (v) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}, { deep: true })

function cardsInColumn(col: KanbanColumn) {
  return cards.value.filter(c => c.column === col)
}

function selectCard(card: KanbanCard) {
  selectedCard.value = selectedCard.value?.id === card.id ? null : { ...card }
}

function saveCardEdit() {
  if (!selectedCard.value) return
  const idx = cards.value.findIndex(c => c.id === selectedCard.value!.id)
  if (idx !== -1) {
    cards.value[idx] = { ...selectedCard.value, updatedAt: new Date().toISOString() }
  }
}

function moveCard(card: KanbanCard, direction: 1 | -1) {
  const idx = COLUMN_ORDER.indexOf(card.column)
  const newCol = COLUMN_ORDER[idx + direction]
  if (!newCol) return
  const cardIdx = cards.value.findIndex(c => c.id === card.id)
  if (cardIdx !== -1) {
    cards.value[cardIdx]!.column = newCol
    cards.value[cardIdx]!.updatedAt = new Date().toISOString()
    if (selectedCard.value?.id === card.id) {
      selectedCard.value = { ...cards.value[cardIdx]! }
    }
  }
}

function deleteCard(id: string) {
  if (!confirm('確定要刪除這張卡片？')) return
  cards.value = cards.value.filter(c => c.id !== id)
  if (selectedCard.value?.id === id) selectedCard.value = null
}

function addCard(col: KanbanColumn, data: { code: string; name: string; sector: string; note: string }) {
  const now = new Date().toISOString()
  cards.value.push({
    id: `card-${Date.now()}`,
    code: data.code.trim().toUpperCase(),
    name: data.name.trim() || data.code.trim(),
    sector: data.sector.trim(),
    column: col,
    note: data.note.trim(),
    createdAt: now,
    updatedAt: now,
  })
}

function linkNote(noteId: string) {
  if (!selectedCard.value) return
  selectedCard.value.linkedNoteId = noteId
  saveCardEdit()
  showNoteModal.value = false
}

function unlinkNote() {
  if (!selectedCard.value) return
  selectedCard.value.linkedNoteId = undefined
  saveCardEdit()
}

function goToNote(noteId: string) {
  router.push('/analysis/notes')
}

const linkedNoteName = computed(() => {
  if (!selectedCard.value?.linkedNoteId) return null
  const note = notes.value.find(n => n.id === selectedCard.value!.linkedNoteId)
  return note?.title ?? null
})

const colColors: Record<KanbanColumn, string> = {
  watchlist: '#3b82f6',
  analyzing: '#f59e0b',
  active: '#22c55e',
  closed: '#64748b',
}
</script>

<template>
  <div class="kanban">
    <!-- Columns -->
    <div class="kanban__board">
      <KanbanColumnComp
        v-for="col in COLUMN_ORDER"
        :key="col"
        :column="col"
        :cards="cardsInColumn(col)"
        :selected-card-id="selectedCard?.id ?? null"
        :color="colColors[col]"
        @select="selectCard"
        @move="moveCard"
        @delete="deleteCard"
        @add="addCard"
      />
    </div>

    <!-- Detail Panel -->
    <transition name="slide">
      <div v-if="selectedCard" class="kanban__detail">
        <div class="kanban__detail-header">
          <div>
            <span class="kanban__detail-code">{{ selectedCard.code }}</span>
            <span class="kanban__detail-name">{{ selectedCard.name }}</span>
          </div>
          <button class="kanban__btn kanban__btn--ghost" @click="selectedCard = null">✕</button>
        </div>

        <div class="kanban__detail-body">
          <label class="kanban__label">產業</label>
          <input v-model="selectedCard.sector" class="kanban__input" placeholder="半導體" @change="saveCardEdit" />

          <label class="kanban__label">進場價</label>
          <input v-model.number="selectedCard.entryPrice" type="number" class="kanban__input" placeholder="0" @change="saveCardEdit" />

          <label class="kanban__label">出場價</label>
          <input v-model.number="selectedCard.exitPrice" type="number" class="kanban__input" placeholder="0" @change="saveCardEdit" />

          <label class="kanban__label">分析備忘</label>
          <textarea v-model="selectedCard.note" class="kanban__input kanban__textarea" rows="4" placeholder="記錄分析原因..." @change="saveCardEdit" />

          <!-- Link note -->
          <label class="kanban__label">連結筆記</label>
          <div v-if="linkedNoteName" class="kanban__linked-note">
            <span>📎 {{ linkedNoteName }}</span>
            <div class="kanban__linked-note-actions">
              <button class="kanban__btn kanban__btn--ghost kanban__btn--sm" @click="goToNote(selectedCard.linkedNoteId!)">前往</button>
              <button class="kanban__btn kanban__btn--ghost kanban__btn--sm" @click="unlinkNote">解除</button>
            </div>
          </div>
          <button v-else class="kanban__btn kanban__btn--ghost" @click="showNoteModal = true">🔗 連結筆記</button>
        </div>
      </div>
    </transition>

    <!-- Note Select Modal -->
    <div v-if="showNoteModal" class="kanban__modal-overlay" @click.self="showNoteModal = false">
      <div class="kanban__modal">
        <div class="kanban__modal-header">
          <h3>選擇筆記</h3>
          <button class="kanban__btn kanban__btn--ghost" @click="showNoteModal = false">✕</button>
        </div>
        <ul class="kanban__modal-list">
          <li
            v-for="note in notes"
            :key="note.id"
            class="kanban__modal-item"
            @click="linkNote(note.id)"
          >
            <span class="kanban__modal-item-title">{{ note.title }}</span>
            <span class="kanban__modal-item-cat">{{ note.category }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kanban {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &__board {
    display: flex;
    gap: 12px;
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 20px;
  }

  // Detail panel
  &__detail {
    position: fixed;
    right: 0;
    top: var(--header-height);
    bottom: 0;
    width: 320px;
    background: var(--color-bg-card);
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    z-index: 50;

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    &-code {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-accent);
      margin-right: 6px;
    }

    &-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    &-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
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

  &__linked-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    background: var(--color-accent-soft);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--color-accent);

    &-actions {
      display: flex;
      gap: 4px;
    }
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

    &--sm {
      padding: 3px 8px;
      font-size: 11px;
    }
  }

  // Modal
  &__modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  &__modal {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    width: 420px;
    max-height: 500px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;

      h3 {
        font-size: 15px;
        font-weight: 700;
      }
    }

    &-list {
      list-style: none;
      overflow-y: auto;
      flex: 1;
    }

    &-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: background 0.12s;

      &:hover {
        background: var(--color-bg-hover);
      }

      &-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      &-cat {
        font-size: 11px;
        color: var(--color-text-muted);
      }
    }
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
