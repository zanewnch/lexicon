<script setup lang="ts">
defineProps<{
  title?: string
  noMargin?: boolean
}>()
</script>

<template>
  <div class="section-header-base" :class="{ 'section-header-base--no-margin': noMargin }">
    <h2 class="section-header-base__title">
      <slot name="title">{{ title }}</slot>
      <slot name="title-suffix" />
    </h2>
    <div v-if="$slots.actions" class="section-header-base__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.section-header-base {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  margin-bottom: var(--gap-md);

  &--no-margin {
    margin-bottom: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }
}
</style>
