<script setup lang="ts">
import type { ModuleGuide } from '@/types/featureGuide'

defineProps<{
  modules: ModuleGuide[]
  activeId: string
}>()

defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="fg-list">
    <ul class="fg-list__items">
      <li
        v-for="mod in modules"
        :key="mod.id"
        class="fg-list__item"
        :class="{ 'fg-list__item--active': mod.id === activeId }"
        @click="$emit('select', mod.id)"
      >
        <span class="fg-list__dot" :style="{ background: mod.iconColor }" />
        <div class="fg-list__text">
          <span class="fg-list__label">{{ mod.label }}</span>
          <span class="fg-list__sub">{{ mod.subtitle.split(' · ')[0] }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.fg-list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  height: 100%;
  overflow-y: auto;

  &__items {
    list-style: none;
    margin: 0;
    padding: var(--gap-sm) 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background var(--duration-fast);
    border-left: 3px solid transparent;

    &:hover {
      background: var(--color-bg-hover);
    }

    &--active {
      background: var(--color-accent-soft);
      border-left-color: var(--color-accent);

      .fg-list__label {
        color: var(--color-accent);
      }
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sub {
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
