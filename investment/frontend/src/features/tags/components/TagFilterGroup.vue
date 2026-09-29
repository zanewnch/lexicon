<script setup lang="ts">
defineProps<{
  label: string
  items: string[]
  selected: string[]
  wrap?: boolean
}>()

const emit = defineEmits<{ toggle: [value: string] }>()
</script>

<template>
  <div class="tag-group">
    <span class="tag-group__label">{{ label }}</span>
    <div class="tag-group__chips" :class="{ 'tag-group__chips--wrap': wrap }">
      <button
        v-for="val in items"
        :key="val"
        class="tag-group__chip"
        :class="{ 'tag-group__chip--active': selected.includes(val) }"
        @click="emit('toggle', val)"
      >
        {{ val }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &__label {
    flex: 0 0 70px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted, #8b8fa8);
    padding-top: 6px;
  }

  &__chips {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    overflow-x: auto;

    &--wrap { flex-wrap: wrap; }
  }

  &__chip {
    padding: 4px 12px;
    border-radius: 14px;
    border: 1px solid var(--color-border, #2d3147);
    background: transparent;
    color: var(--color-text);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;

    &:hover { border-color: var(--color-accent, #6366f1); }

    &--active {
      background: var(--color-accent, #6366f1);
      color: #fff;
      border-color: var(--color-accent, #6366f1);
    }
  }
}
</style>
