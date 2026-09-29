<!--
  App.vue — 應用程式根元件

  整體版面結構：
  ┌─────────────────────────────┐
  │  TheSidebar（左側導覽列）    │
  │  ┌───────────────────────┐  │
  │  │ TheHeader（頂部工具列）│  │
  │  ├───────────────────────┤  │
  │  │  <RouterView>         │  │
  │  │  （各頁面內容）        │  │
  │  └───────────────────────┘  │
  └─────────────────────────────┘
  ToastContainer（Teleport 到 body，顯示全域通知）

  頁面切換動畫：
  - 進入：淡入 + 向上移動 16px + blur 解除（0.35s）
  - 離開：淡出 + 向上移動 8px + blur 加深（0.15s，較快讓新頁快速出現）
-->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import TheSidebar from './components/layout/TheSidebar.vue'
import TheHeader from './components/layout/TheHeader.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import { useProfileStore } from '@/store/profile'
const TheBottomNav = defineAsyncComponent(() => import('./components/layout/TheBottomNav.vue'))

useProfileStore().fetch().catch(() => {})
</script>

<template>
  <div class="app-layout">
    <TheSidebar />
    <div class="main-area">
      <TheHeader />
      <main class="main-area__content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <TheBottomNav />
    <ToastContainer />
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background: transparent; // Let the shared, theme-tinted glass gradient show through
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  &__content {
    flex: 1;
    min-height: 0;
    padding: var(--gap-lg);
    overflow-y: auto;
  }
}

// ---- Page transition ----
.page-enter-active {
  transition: opacity 0.5s var(--ease-spring), transform 0.5s var(--ease-spring), filter 0.5s var(--ease-spring);
}

.page-leave-active {
  transition: opacity 0.25s var(--ease-smooth), transform 0.25s var(--ease-smooth), filter 0.25s var(--ease-smooth);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
  filter: blur(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
  filter: blur(4px);
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .main-area__content {
    padding: var(--gap-md);
    padding-bottom: calc(var(--gap-md) + 64px + env(safe-area-inset-bottom, 12px)); // Allow space for bottom nav
  }
}

// ---- Responsive: 480px ----
@media (max-width: 480px) {
  .main-area__content {
    padding: var(--gap-sm);
    padding-bottom: calc(var(--gap-sm) + 64px + env(safe-area-inset-bottom, 12px)); // Allow space for bottom nav
  }
}
</style>
