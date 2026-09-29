<script setup lang="ts">
import RouterTabBar from '@/components/ui/RouterTabBar.vue'

const tabs = [
  { path: '/strategy', label: '我的策略' },
  { path: '/strategy/create', label: '建立策略' },
]
</script>

<template>
  <div class="strategy-layout">
    <div class="strategy-layout__header">
      <h1 class="strategy-layout__title">策略中心</h1>
      <RouterTabBar :tabs="tabs" />
    </div>
    <div class="strategy-layout__content">
      <router-view />
    </div>
  </div>
</template>

<style scoped lang="scss">
.strategy-layout {
  height: calc(100vh - var(--header-height) - 48px);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--gap-lg);
    margin-bottom: var(--gap-md);
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
  }

  &__content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
