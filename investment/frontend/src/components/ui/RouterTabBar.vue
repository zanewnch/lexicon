<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { LocationQuery } from 'vue-router'

defineProps<{
  tabs: { path: string; label: string }[]
  forwardQuery?: boolean
}>()

const route = useRoute()

function tabTo(path: string, forwardQuery?: boolean): { path: string; query?: LocationQuery } {
  return forwardQuery ? { path, query: route.query } : { path }
}
</script>

<template>
  <div class="router-tab-bar">
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tabTo(tab.path, forwardQuery)"
      class="router-tab-bar__tab"
      :class="{ 'router-tab-bar__tab--active': route.path === tab.path }"
    >
      {{ tab.label }}
    </router-link>
  </div>
</template>

<style scoped lang="scss">
.router-tab-bar {
  display: flex;
  gap: 2px;

  &__tab {
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
      font-weight: 600;
    }
  }
}
</style>
