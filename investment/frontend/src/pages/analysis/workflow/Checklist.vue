<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { ChecklistSession, ChecklistItem } from '@/types/workflow'
import { DEFAULT_CHECKLIST_ITEMS } from '@/types/workflow'

const sessions = ref<ChecklistSession[]>([])
const selectedId = ref<string | null>(null)
const isCreating = ref(false)

const newStock = ref({ code: '', name: '' })

const STORAGE_KEY = 'workflow-checklist'

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      sessions.value = JSON.parse(saved)
      selectedId.value = sessions.value[0]?.id ?? null
    } catch {}
  }
})

watch(sessions, (v) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}, { deep: true })

const selectedSession = computed(() =>
  sessions.value.find(s => s.id === selectedId.value) ?? null
)

const allPassed = computed(() => {
  if (!selectedSession.value) return false
  return selectedSession.value.items.every(i => i.checked)
})

function startCreate() {
  isCreating.value = true
  newStock.value = { code: '', name: '' }
}

function cancelCreate() {
  isCreating.value = false
}

function createSession() {
  if (!newStock.value.code.trim()) return
  const session: ChecklistSession = {
    id: `cl-${Date.now()}`,
    stockCode: newStock.value.code.trim().toUpperCase(),
    stockName: newStock.value.name.trim() || newStock.value.code.trim(),
    items: DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i, checked: false })),
    expectedScenario: '',
    stopLoss: null,
    positionSizePct: null,
    createdAt: new Date().toISOString(),
    passed: false,
  }
  sessions.value.unshift(session)
  selectedId.value = session.id
  isCreating.value = false
}

function toggleItem(item: ChecklistItem) {
  item.checked = !item.checked
  if (selectedSession.value) {
    selectedSession.value.passed = selectedSession.value.items.every(i => i.checked)
  }
}

function deleteSession(id: string) {
  if (!confirm('確定要刪除這份清單？')) return
  sessions.value = sessions.value.filter(s => s.id !== id)
  if (selectedId.value === id) {
    selectedId.value = sessions.value[0]?.id ?? null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
}

const passedCount = computed(() => {
  if (!selectedSession.value) return 0
  return selectedSession.value.items.filter(i => i.checked).length
})
</script>

<template>
  <div class="checklist">
    <!-- Left Sidebar -->
    <aside class="checklist__sidebar">
      <div class="checklist__sidebar-header">
        <h2 class="checklist__sidebar-title">SOP 清單</h2>
        <button class="checklist__btn checklist__btn--new" @click="startCreate">+ 新增</button>
      </div>

      <!-- Create form -->
      <div v-if="isCreating" class="checklist__create-form">
        <input v-model="newStock.code" placeholder="股票代碼 (如 2330)" class="checklist__input" @keyup.enter="createSession" />
        <input v-model="newStock.name" placeholder="股票名稱 (如 台積電)" class="checklist__input" />
        <div class="checklist__create-actions">
          <button class="checklist__btn checklist__btn--ghost" @click="cancelCreate">取消</button>
          <button class="checklist__btn checklist__btn--primary" @click="createSession">建立</button>
        </div>
      </div>

      <ul class="checklist__list">
        <li
          v-for="s in sessions"
          :key="s.id"
          class="checklist__item"
          :class="{ 'checklist__item--active': selectedId === s.id }"
          @click="selectedId = s.id"
        >
          <div class="checklist__item-top">
            <span class="checklist__item-badge" :class="s.passed ? 'checklist__item-badge--pass' : 'checklist__item-badge--fail'">
              {{ s.passed ? '✓' : '…' }}
            </span>
            <span class="checklist__item-code">{{ s.stockCode }}</span>
            <span class="checklist__item-name">{{ s.stockName }}</span>
          </div>
          <div class="checklist__item-meta">
            <span class="checklist__item-date">{{ formatDate(s.createdAt) }}</span>
            <span class="checklist__item-progress">{{ s.items.filter(i => i.checked).length }}/{{ s.items.length }}</span>
          </div>
        </li>
        <li v-if="sessions.length === 0" class="checklist__empty-list">
          點擊「+ 新增」建立第一份清單
        </li>
      </ul>
    </aside>

    <!-- Main Content -->
    <div class="checklist__main">
      <template v-if="selectedSession">
        <!-- Header -->
        <div class="checklist__header">
          <div class="checklist__header-left">
            <span class="checklist__stock-code">{{ selectedSession.stockCode }}</span>
            <span class="checklist__stock-name">{{ selectedSession.stockName }}</span>
          </div>
          <div class="checklist__header-right">
            <div
              class="checklist__verdict"
              :class="allPassed ? 'checklist__verdict--pass' : 'checklist__verdict--fail'"
            >
              {{ allPassed ? '✓ 可下單' : `✗ 條件未滿足 (${passedCount}/${selectedSession.items.length})` }}
            </div>
            <button class="checklist__btn checklist__btn--danger" @click="deleteSession(selectedSession.id)">刪除</button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="checklist__progress-bar">
          <div
            class="checklist__progress-fill"
            :class="allPassed ? 'checklist__progress-fill--pass' : ''"
            :style="{ width: `${(passedCount / selectedSession.items.length) * 100}%` }"
          />
        </div>

        <div class="checklist__body">
          <!-- Checklist items -->
          <div class="checklist__items">
            <div
              v-for="(item, idx) in selectedSession.items"
              :key="item.id"
              class="checklist__check-item"
              :class="{ 'checklist__check-item--checked': item.checked }"
              @click="toggleItem(item)"
            >
              <div class="checklist__check-box">
                <span v-if="item.checked">✓</span>
              </div>
              <div class="checklist__check-content">
                <span class="checklist__check-num">{{ idx + 1 }}</span>
                <span class="checklist__check-label">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <!-- Additional fields -->
          <div class="checklist__fields">
            <div class="checklist__field-group">
              <label class="checklist__label">預期劇本</label>
              <textarea
                v-model="selectedSession.expectedScenario"
                class="checklist__input checklist__textarea"
                rows="3"
                placeholder="如果我的分析正確，接下來股價會如何走？什麼時候該出場？"
              />
            </div>
            <div class="checklist__field-row">
              <div class="checklist__field-group">
                <label class="checklist__label">停損點（元）</label>
                <input
                  v-model.number="selectedSession.stopLoss"
                  type="number"
                  class="checklist__input"
                  placeholder="0"
                />
              </div>
              <div class="checklist__field-group">
                <label class="checklist__label">部位大小（%）</label>
                <input
                  v-model.number="selectedSession.positionSizePct"
                  type="number"
                  class="checklist__input"
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="checklist__placeholder">
        <div class="checklist__placeholder-icon">✅</div>
        <p>選擇左側清單，或點擊「+ 新增」建立買入前核對清單</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.checklist {
  display: flex;
  height: 100%;
  overflow: hidden;

  // Sidebar
  &__sidebar {
    width: 260px;
    flex-shrink: 0;
    border-right: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
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
    }

    &-title {
      font-size: 14px;
      font-weight: 700;
    }
  }

  &__create-form {
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  &__create-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  &__list {
    list-style: none;
    overflow-y: auto;
    flex: 1;
    padding: 4px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    padding: 10px 10px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background 0.12s;
    border: 1px solid transparent;

    &:hover { background: var(--color-bg-hover); }

    &--active {
      background: var(--color-accent-soft);
      border-color: var(--color-accent);
    }

    &-top {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 4px;
    }

    &-badge {
      font-size: 10px;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &--pass { background: rgba(34,197,94,0.2); color: var(--color-up); }
      &--fail { background: var(--color-bg-hover); color: var(--color-text-muted); }
    }

    &-code {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-accent);
    }

    &-name {
      font-size: 12px;
      color: var(--color-text-primary);
    }

    &-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: 21px;
    }

    &-date {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    &-progress {
      font-size: 11px;
      color: var(--color-text-muted);
    }
  }

  &__empty-list {
    text-align: center;
    font-size: 12px;
    color: var(--color-text-muted);
    padding: 32px 0;
  }

  // Main
  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    &-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  &__stock-code {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-accent);
  }

  &__stock-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__verdict {
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: var(--radius-sm);

    &--pass {
      background: rgba(34,197,94,0.15);
      color: var(--color-up);
      border: 1px solid var(--color-up);
    }

    &--fail {
      background: rgba(239,68,68,0.1);
      color: var(--color-down);
      border: 1px solid var(--color-down);
    }
  }

  &__progress-bar {
    height: 3px;
    background: var(--color-border);
    flex-shrink: 0;
  }

  &__progress-fill {
    height: 100%;
    background: var(--color-accent);
    transition: width 0.3s ease;

    &--pass { background: var(--color-up); }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__check-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: var(--color-accent); }

    &--checked {
      background: rgba(34,197,94,0.05);
      border-color: var(--color-up);

      .checklist__check-label {
        color: var(--color-text-muted);
        text-decoration: line-through;
      }
    }
  }

  &__check-box {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-up);
    background: transparent;
    transition: all 0.15s;

    .checklist__check-item--checked & {
      background: rgba(34,197,94,0.2);
      border-color: var(--color-up);
    }
  }

  &__check-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__check-num {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
    width: 16px;
    flex-shrink: 0;
  }

  &__check-label {
    font-size: 14px;
    color: var(--color-text-primary);
    transition: color 0.15s;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
  }

  &__field-row {
    display: flex;
    gap: 16px;

    .checklist__field-group {
      flex: 1;
    }
  }

  &__field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__input {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;

    &:focus { border-color: var(--color-accent); }
    &::placeholder { color: var(--color-text-muted); }
  }

  &__textarea {
    resize: vertical;
    font-family: inherit;
    line-height: 1.6;
  }

  // Buttons
  &__btn {
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.15s;

    &--new {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      background: var(--color-accent-soft);
      color: var(--color-accent);
      border: none;
      cursor: pointer;
      border-radius: var(--radius-sm);
      &:hover { background: var(--color-accent); color: #fff; }
    }

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

    &--danger {
      background: transparent;
      color: var(--color-down);
      border: 1px solid var(--color-down);
      &:hover { background: rgba(239,68,68,0.1); }
    }
  }

  // Placeholder
  &__placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--color-text-muted);
    font-size: 14px;

    &-icon {
      font-size: 48px;
      opacity: 0.3;
    }
  }
}
</style>
