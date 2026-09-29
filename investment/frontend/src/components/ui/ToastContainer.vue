<script setup lang="ts">
/**
 * ToastContainer — 全域 Toast 通知容器
 *
 * 透過 `Teleport` 挂載到 `<body>` 層級，確保絳罩不受其他元件層級影響。
 * 直接使用 `useToast()` 單例，自動告警當前車排們的通知。
 *
 * 支援四種類型，各有對應顏色：
 * - `success` — 綠色 (✓)
 * - `error`   — 紅色 (✗)
 * - `warning` — 黃色 (⚠)
 * - `info`    — 藍色 (ℹ)
 *
 * 點擊任意 Toast 可手動關閉。
 * 本元件應在 App.vue 中全局單例化一次。
 */
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" :class="['toast-container__item', `toast-container__item--${t.type}`]"
          @click="dismiss(t.id)">
          <span class="toast-container__icon">
            <template v-if="t.type === 'success'">&#10003;</template>
            <template v-else-if="t.type === 'error'">&#10007;</template>
            <template v-else-if="t.type === 'warning'">&#9888;</template>
            <template v-else>&#8505;</template>
          </span>
          <span class="toast-container__text">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  pointer-events: none;

  &__item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
    min-width: 240px;
    max-width: 380px;

    &--success {
      background: rgba(16, 185, 129, 0.92);
    }

    &--error {
      background: rgba(239, 68, 68, 0.92);
    }

    &--warning {
      background: rgba(245, 158, 11, 0.92);
    }

    &--info {
      background: rgba(59, 130, 246, 0.92);
    }
  }

  &__icon {
    font-size: 15px;
    flex-shrink: 0;
  }

  &__text {
    line-height: 1.4;
  }
}

// ---- Transition ----
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Spring bounce */
}

.toast-leave-active {
  transition: all 0.2s var(--ease-smooth);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}
</style>
