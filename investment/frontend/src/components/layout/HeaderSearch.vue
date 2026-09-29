<script setup lang="ts">
/**
 * HeaderSearch — 全局股票搜尋輸入框
 *
 * 利用 `useStockSearch()` composable 提供：
 * - debounce 300ms 的 API 搜尋
 * - 鍵盤導航（↑/↓ 移動選取、Enter 確認、Esc 關閉）
 * - 模糊時延遲 200ms 再關閉選單（避免點擊被括掉）
 *
 * 選取股票後跳轉至 `/market?code=XXXX`。
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStockSearch } from '@/features/market/composables/useStockSearch'
import { formatPercent } from '@/utils/formatters'

const router = useRouter()
const searchQuery = ref('')

const { results: searchResults, isOpen: searchOpen, selectedIndex, moveUp, moveDown, close: closeSearch } = useStockSearch(searchQuery)

function selectStock(code: string) {
  router.push({ path: '/analysis/quote', query: { code } })
  searchQuery.value = ''
  closeSearch()
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveDown()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveUp()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = searchResults.value[selectedIndex.value]
    if (selectedIndex.value >= 0 && selected) {
      selectStock(selected.code)
    }
  } else if (e.key === 'Escape') {
    closeSearch()
  }
}

function onSearchBlur() {
  // Delay to allow click on dropdown item
  setTimeout(closeSearch, 200)
}
</script>

<template>
  <div class="header-search">
    <span class="header-search__icon">🔍</span>
    <input
      v-model="searchQuery"
      type="text"
      placeholder="搜尋股票代碼或名稱..."
      class="header-search__input"
      @keydown="onSearchKeydown"
      @blur="onSearchBlur"
    />
    <Transition name="dropdown">
      <div v-if="searchOpen" class="header-search__dropdown">
        <div
          v-for="(item, i) in searchResults"
          :key="item.code"
          class="header-search__result"
          :class="{ 'header-search__result--active': selectedIndex === i }"
          @mousedown.prevent="selectStock(item.code)"
        >
          <span class="header-search__result-code">{{ item.code }}</span>
          <span class="header-search__result-name">{{ item.name }}</span>
          <span class="header-search__result-price">{{ item.price ? item.price.toFixed(2) : '-' }}</span>
          <span
            class="header-search__result-change"
            :class="item.changePercent > 0 ? 'text-up' : item.changePercent < 0 ? 'text-down' : ''"
          >
            {{ item.changePercent ? formatPercent(item.changePercent) : '-' }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.header-search {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  flex: 1;
  max-width: 480px;
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

    &::placeholder {
      color: var(--color-text-muted);
    }

    &:focus {
      border-color: transparent;
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
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--duration-fast);

    &:hover,
    &--active {
      background: var(--color-bg-hover);
    }

    &-code {
      font-weight: 600;
      font-size: 13px;
      color: var(--color-accent);
      min-width: 50px;
    }

    &-name {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
    }

    &-price {
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--color-text-primary);
    }

    &-change {
      font-size: var(--font-size-sm);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      min-width: 60px;
      text-align: right;
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
