<script setup lang="ts">
/**
 * HeaderThemePicker — 主題切換下拉選單
 *
 * 顯示目前主題的圆形色塗預覽和名稱，
 * 點擊新展開所有可選主題的 Grid 選單。
 *
 * 利用 `useAppStore()` 儲存目前主題，選擇後自動儲存到 localStorage。
 * 點擊選單外部自動關閉（通過 `document.addEventListener` 實現）。
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore, themes } from '@/store/app'

const app = useAppStore()
const showThemeMenu = ref(false)

function selectTheme(id: typeof app.currentTheme) {
  app.setTheme(id)
  showThemeMenu.value = false
}

function onClickOutside(e: MouseEvent) {
  const picker = document.querySelector('.theme-picker')
  if (picker && !picker.contains(e.target as Node)) {
    showThemeMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="theme-picker">
    <button
      class="theme-picker__trigger"
      title="切換主題"
      @click="showThemeMenu = !showThemeMenu"
    >
      <span class="theme-picker__swatch" :style="{ background: themes.find(t => t.id === app.currentTheme)?.preview }"></span>
      <span class="theme-picker__label">{{ themes.find(t => t.id === app.currentTheme)?.name }}</span>
      <span class="theme-picker__arrow">▾</span>
    </button>
    <Transition name="dropdown">
      <div v-if="showThemeMenu" class="theme-picker__menu">
        <button
          v-for="theme in themes"
          :key="theme.id"
          class="theme-picker__option"
          :class="{ 'theme-picker__option--active': app.currentTheme === theme.id }"
          @click="selectTheme(theme.id)"
        >
          <span class="theme-picker__option-swatch" :style="{ background: theme.preview }"></span>
          <span class="theme-picker__option-name">{{ theme.name }}</span>
          <span v-if="app.currentTheme === theme.id" class="theme-picker__check">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.theme-picker {
  position: relative;

  &__trigger {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }

  &__swatch {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--color-border-hover);
    flex-shrink: 0;
  }

  &__label {
    font-weight: 500;
    white-space: nowrap;
  }

  &__arrow {
    font-size: 10px;
    color: var(--color-text-muted);
  }

  &__menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-hover);
    border-radius: var(--radius-md);
    padding: 6px;
    padding-top: 12px;
    min-width: 480px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2px;
    box-shadow: var(--shadow-dropdown);
    z-index: 200;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      color: var(--color-accent);
      background: var(--color-accent-soft);
    }

    &-swatch {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--color-border-hover);
      flex-shrink: 0;
    }

    &-name {
      flex: 1;
      font-weight: 500;
    }
  }

  &__check {
    font-size: var(--font-size-base);
    color: var(--color-accent);
    font-weight: 700;
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
