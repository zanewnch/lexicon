<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  required?: boolean
  hint?: string
  error?: string
  id?: string
}>(), {
  required: false,
})
</script>

<template>
  <div class="form-field" :class="{ 'form-field--error': error }">
    <label v-if="label" class="form-field__label" :for="id">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>
    <div class="form-field__control">
      <slot />
    </div>
    <p v-if="error" class="form-field__error">{{ error }}</p>
    <p v-else-if="hint" class="form-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped lang="scss">
// ── FormField CSS variables ────────────────────────────────
// --field-gap: 間距  --field-label-size: label 字型大小

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--field-gap, var(--gap-xs));

  &__label {
    font-size: var(--field-label-size, var(--font-size-sm));
    font-weight: 600;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 3px;
  }

  &__required {
    color: var(--color-down);
    font-size: var(--font-size-xs);
    line-height: 1;
  }

  &__control {
    // 讓 slot 裡的 input/select/textarea 自動撐滿
    :deep(input),
    :deep(select),
    :deep(textarea) {
      width: 100%;
    }
  }

  &__hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  &__error {
    font-size: var(--font-size-xs);
    color: var(--color-down);
    margin: 0;
  }

  // Error state: 讓 input border 變紅
  &--error :deep(input),
  &--error :deep(select),
  &--error :deep(textarea) {
    border-color: var(--color-down) !important;
  }
}
</style>
