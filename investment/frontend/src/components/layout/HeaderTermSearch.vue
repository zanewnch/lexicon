<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/api'

interface TermResult {
  key: string
  term: string
  description: string
  category: string
  example: string
}

const query = ref('')
const isOpen = ref(false)
const selectedIndex = ref(-1)
const activeTerm = ref<TermResult | null>(null)
const results = ref<TermResult[]>([])

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(query, (val) => {
  activeTerm.value = null
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val.trim()) {
    results.value = []
    isOpen.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    const { data } = await api.get('/glossary/search/', { params: { q: val.trim() } })
    results.value = data
    isOpen.value = data.length > 0
    selectedIndex.value = -1
  }, 250)
})

function selectTerm(term: TermResult) {
  activeTerm.value = term
  query.value = term.term
  isOpen.value = false
  selectedIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = results.value[selectedIndex.value]
    if (item) selectTerm(item)
  } else if (e.key === 'Escape') {
    isOpen.value = false
    activeTerm.value = null
    query.value = ''
  }
}

function onBlur() {
  setTimeout(() => { isOpen.value = false }, 200)
}

function closeModal() {
  activeTerm.value = null
  query.value = ''
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('term-modal__overlay')) {
    closeModal()
  }
}

function onModalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}
</script>

<template>
  <div class="term-search">
    <span class="term-search__icon">📖</span>
    <input
      v-model="query"
      type="text"
      placeholder="搜尋術語..."
      class="term-search__input"
      @keydown="onKeydown"
      @blur="onBlur"
    />

    <!-- 搜尋結果下拉 -->
    <Transition name="dropdown">
      <div v-if="isOpen && results.length" class="term-search__dropdown">
        <div
          v-for="(item, i) in results"
          :key="item.key"
          class="term-search__result"
          :class="{ 'term-search__result--active': selectedIndex === i }"
          @mousedown.prevent="selectTerm(item)"
        >
          <span class="term-search__result-term">{{ item.term }}</span>
          <span class="term-search__result-category">{{ item.category }}</span>
          <span class="term-search__result-desc">{{ item.description }}</span>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 術語說明 Modal（Teleport 至 body 避免 z-index 問題） -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="activeTerm"
        class="term-modal__overlay"
        role="dialog"
        aria-modal="true"
        @click="onOverlayClick"
        @keydown="onModalKeydown"
      >
        <div class="term-modal">
          <div class="term-modal__header">
            <div class="term-modal__title-group">
              <span class="term-modal__icon">📖</span>
              <h2 class="term-modal__title">{{ activeTerm.term }}</h2>
              <span class="term-modal__category">{{ activeTerm.category }}</span>
            </div>
            <button class="term-modal__close" @click="closeModal" aria-label="關閉">✕</button>
          </div>
          <div class="term-modal__body">
            <p class="term-modal__description">{{ activeTerm.description }}</p>
            <div v-if="activeTerm.example" class="term-modal__example">
              <span class="term-modal__example-label">例</span>
              <p class="term-modal__example-text">{{ activeTerm.example }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.term-search {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  flex: 1;
  max-width: 320px;
  transition: border-color var(--duration-fast);
  position: relative;

  &:focus-within {
    border-color: var(--color-accent);
  }

  &__icon {
    font-size: var(--font-size-base);
    flex-shrink: 0;
  }

  &__input {
    border: none;
    background: transparent;
    padding: 8px 0;
    width: 100%;
    color: var(--color-text-primary);

    &::placeholder {
      color: var(--color-text-muted);
    }

    &:focus {
      outline: none;
    }
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 500;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-hover);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 4px;
    max-height: 360px;
    overflow-y: auto;
  }

  &__result {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 2px 8px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover,
    &--active {
      background: var(--color-bg-hover);
    }

    &-term {
      grid-column: 1;
      grid-row: 1;
      font-weight: 600;
      font-size: 13px;
      color: var(--color-accent);
    }

    &-category {
      grid-column: 2;
      grid-row: 1;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      background: var(--color-bg-hover);
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      align-self: center;
      white-space: nowrap;
    }

    &-desc {
      grid-column: 1 / -1;
      grid-row: 2;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
}

// ── Modal（不用 scoped 也可，但這裡用 :global 讓 Teleport 到 body 的元素也能套用）
:global(.term-modal__overlay) {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

:global(.term-modal) {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
}

:global(.term-modal__header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-sidebar);
}

:global(.term-modal__title-group) {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

:global(.term-modal__icon) {
  font-size: 18px;
  flex-shrink: 0;
}

:global(.term-modal__title) {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-accent);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.term-modal__category) {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

:global(.term-modal__close) {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-muted);
  transition: background var(--duration-fast), color var(--duration-fast);
  flex-shrink: 0;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

:global(.term-modal__body) {
  padding: 20px;
}

:global(.term-modal__description) {
  font-size: 14px;
  line-height: 1.75;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
  white-space: pre-wrap;
}

:global(.term-modal__example) {
  display: flex;
  gap: 8px;
  background: var(--color-bg-hover);
  border-left: 3px solid var(--color-accent);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
}

:global(.term-modal__example-label) {
  font-weight: 700;
  font-size: 12px;
  color: var(--color-accent);
  flex-shrink: 0;
}

:global(.term-modal__example-text) {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary);
  margin: 0;
  white-space: pre-wrap;
}

// ── Dropdown transition
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

// ── Modal transition
:global(.modal-enter-active),
:global(.modal-leave-active) {
  transition: opacity 0.2s ease;

  .term-modal {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

:global(.modal-enter-from),
:global(.modal-leave-to) {
  opacity: 0;

  .term-modal {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
