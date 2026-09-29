<script setup lang="ts">
/**
 * TheHeader — 全局頂欄工具列
 *
 * 一由四個區塊組成：
 * 1. `HeaderSearch` — 股票搜尋框（輸入代碼/名稱，自動跳轉行情頁）
 * 2. 模式切換按鈕 — SIMULATION / PRODUCTION 切換，從 `useMarketStore` 讀取狀態
 * 3. `HeaderMarketStatus` — 市場交易時段倒數
 * 4. `HeaderThemePicker` — 主題切換下拉
 *
 * 運用 `position: sticky` 固定於屏幕頂部，並水口。
 */
import { useMarketStore } from '@/store/market'
import { useProfileStore } from '@/store/profile'
import { User } from 'lucide-vue-next'
import HeaderSearch from './HeaderSearch.vue'
import HeaderTermSearch from './HeaderTermSearch.vue'
import HeaderMarketStatus from './HeaderMarketStatus.vue'
import HeaderThemePicker from './HeaderThemePicker.vue'

const app = useMarketStore()
const profile = useProfileStore()

function toggleMode() {
  if (app.isSimulation && !confirm('切換至正式券商環境？切換本身不會下單，正式委託仍須另外確認。')) return
  app.switchMode(!app.isSimulation)
}
</script>

<template>
  <header class="header">
    <div class="header__search-group">
      <HeaderSearch />
      <HeaderTermSearch />
    </div>

    <div class="header__actions">
      <button class="header__mode-toggle"
        :class="app.isSimulation ? 'header__mode-toggle--sim' : 'header__mode-toggle--prod'"
        :disabled="app.modeSwitching" :title="app.isSimulation ? '目前為模擬模式，點擊切換至正式模式' : '目前為正式模式（真實帳戶），點擊切換至模擬模式'"
        @click="toggleMode">
        <span class="header__mode-dot"></span>
        <span class="header__mode-label">
          {{ app.modeSwitching ? '切換中…' : app.isSimulation ? 'SIMULATION' : 'PRODUCTION' }}
        </span>
      </button>

      <span v-if="app.modeError" class="header__mode-error" @click="app.modeError = null">
        {{ app.modeError }} ✕
      </span>

      <HeaderMarketStatus />
      <HeaderThemePicker />

      <button class="header__icon-btn" title="通知">🔔</button>
      <button class="header__account-btn" title="帳戶">
        <img v-if="profile.avatarUrl" :src="profile.avatarUrl" class="header__avatar" alt="帳戶" />
        <User v-else :size="18" stroke-width="1.5" class="header__avatar-fallback" />
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  min-height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 16px 16px 0 16px;
  padding: 8px var(--gap-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  gap: var(--gap-md);
  position: sticky;
  top: 16px;
  z-index: 10;
  transition: transform var(--duration-normal) var(--ease-spring), box-shadow var(--duration-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &__search-group {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    flex: 1 1 auto;
    min-width: 200px;
    max-width: 800px;
  }

  &__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__mode-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.5px;
    white-space: nowrap;
    cursor: pointer;
    transition: all var(--duration-fast);
    border: 1px solid transparent;

    &:disabled {
      opacity: 0.6;
      cursor: wait;
    }

    &--sim {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;

      .header__mode-dot {
        background: #f59e0b;
      }

      &:hover:not(:disabled) {
        background: #fde68a;
      }
    }

    &--prod {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fca5a5;

      .header__mode-dot {
        background: #ef4444;
        animation: pulse 1.5s infinite;
      }

      &:hover:not(:disabled) {
        background: #fee2e2;
      }
    }
  }

  &__mode-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__mode-label {
    font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  }

  &__mode-error {
    font-size: var(--font-size-xs);
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    background: var(--color-down-soft);
    color: var(--color-down);
    cursor: pointer;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-md);
    transition: background var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__account-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    padding: 0;
    overflow: hidden;
    border: 2px solid var(--glass-border);
    transition: border-color var(--duration-fast), box-shadow var(--duration-fast);

    &:hover {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 2px var(--color-accent-soft);
    }
  }

  &__avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__avatar-fallback {
    color: var(--color-text-muted);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 currentColor;
  }

  50% {
    opacity: 0.6;
    box-shadow: 0 0 0 4px transparent;
  }
}

// ---- Responsive: 1024px ----
@media (max-width: 1024px) {
  .header {
    &__mode-label {
      display: none;
    }
  }
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .header {
    padding: 8px var(--gap-md);
    gap: var(--gap-sm);

    .header__search-group {
      min-width: 100%; // search bar takes full width on mobile
      order: 2; // move below actions
    }

    &__actions {
      gap: 8px;
      order: 1; // stay on top
      width: 100%;
      justify-content: space-between;
    }

    &__mode-label {
      display: none;
    }

    &__mode-toggle {
      padding: 5px 8px;
    }
  }
}

// ---- Responsive: 480px ----
@media (max-width: 480px) {
  .header {
    padding: 8px var(--gap-sm);
    gap: var(--gap-xs);

    &__actions {
      gap: 4px;
    }

    &__icon-btn {
      width: 30px;
      height: 30px;
      font-size: var(--font-size-sm);
    }
  }
}
</style>
