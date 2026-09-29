<script setup lang="ts">
withDefaults(defineProps<{
  width?: string
  borderRight?: boolean
}>(), {
  width: '260px',
  borderRight: true,
})
</script>

<template>
  <div class="sidebar-panel" :style="{ '--sidebar-panel-width': width }">
    <!-- 左側清單欄 -->
    <aside class="sidebar-panel__sidebar" :class="{ 'sidebar-panel__sidebar--border': borderRight }">
      <div v-if="$slots.header" class="sidebar-panel__sidebar-header">
        <slot name="header" />
      </div>

      <div v-if="$slots.search" class="sidebar-panel__search">
        <slot name="search" />
      </div>

      <ul class="sidebar-panel__list">
        <slot name="list" />
      </ul>
    </aside>

    <!-- 右側內容區 -->
    <div class="sidebar-panel__detail">
      <slot name="detail">
        <slot />
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ── SidebarPanel CSS variables ────────────────────────────────
// --sidebar-panel-width   左欄寬度（預設 260px）
// --sidebar-panel-bg      左欄背景色

.sidebar-panel {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  // ── 左側欄 ────────────────────────────────────────
  &__sidebar {
    width: var(--sidebar-panel-width, 260px);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--sidebar-panel-bg, var(--color-bg-secondary));
    overflow-y: auto;

    &--border {
      border-right: 1px solid var(--color-border);
    }
  }

  &__sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--gap-md);
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
  }

  &__search {
    padding: var(--gap-sm) var(--gap-md);
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
  }

  &__list {
    flex: 1;
    list-style: none;
    padding: var(--gap-sm) 0;
    margin: 0;
    overflow-y: auto;
  }

  // ── 右側內容 ───────────────────────────────────────
  &__detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: var(--gap-lg);
  }
}
</style>
