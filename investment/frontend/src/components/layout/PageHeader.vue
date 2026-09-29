<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  mb?: string
  padding?: string
  border?: string
  titleSize?: string
  align?: string
  height?: string
  bg?: string
  flexShrink?: string
}>(), {
  mb: '20px',
  padding: '0',
  border: 'none',
  titleSize: 'var(--font-size-xl)',
  align: 'baseline',
  height: 'auto',
  bg: 'transparent',
  flexShrink: '1',
})
</script>

<template>
  <div class="page-header">
    <div class="page-header__main">
      <h1 class="page-header__title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <span v-if="subtitle || $slots.subtitle" class="page-header__subtitle text-muted">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: v-bind(align);
  margin-bottom: v-bind(mb);
  padding: v-bind(padding);
  border-bottom: v-bind(border);
  height: v-bind(height);
  background: v-bind(bg);
  flex-shrink: v-bind(flexShrink);

  &__main {
    display: flex;
    align-items: baseline;
    gap: var(--gap-sm);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    font-size: v-bind(titleSize);
    font-weight: 700;
    margin: 0;
  }

  &__subtitle {
    font-size: var(--font-size-sm);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }
}
</style>
