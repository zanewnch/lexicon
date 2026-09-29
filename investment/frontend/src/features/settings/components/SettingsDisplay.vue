<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore, themes } from '@/store/app'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'

const app = useAppStore()

const displaySettings = ref({
  language: '繁體中文',
  defaultPage: '首頁',
  priceDecimal: 2,
  refreshInterval: 5,
})
</script>

<template>
  <Card>
    <h2 class="section-title">顯示設定</h2>
    <div class="form-list">
      <div class="form-row">
        <label class="form-row__label">主題</label>
        <select :value="app.currentTheme" @change="app.setTheme(($event.target as HTMLSelectElement).value as any)" class="form-row__input form-row__input--short">
          <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-row__label">語言</label>
        <select v-model="displaySettings.language" class="form-row__input form-row__input--short">
          <option>繁體中文</option>
          <option>English</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-row__label">預設頁面</label>
        <select v-model="displaySettings.defaultPage" class="form-row__input form-row__input--short">
          <option>首頁</option>
          <option>行情</option>
          <option>持倉</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-row__label">報價更新間隔</label>
        <div class="form-row__value">
          <input type="number" v-model.number="displaySettings.refreshInterval" min="1" max="60" class="form-row__input form-row__input--short" />
          <span class="text-muted">秒</span>
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped lang="scss">
.form-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  &__label {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-secondary);
    flex-shrink: 0;
    margin-right: var(--gap-md);
  }

  &__value {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  &__input {
    &--short {
      width: 120px;
    }
  }
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-bg-hover);
    border-radius: 24px;
    transition: var(--duration-normal);

    &::before {
      content: '';
      position: absolute;
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: var(--color-text-muted);
      border-radius: 50%;
      transition: var(--duration-normal);
    }
  }

  input:checked + &__slider {
    background: var(--color-accent-soft);

    &::before {
      transform: translateX(20px);
      background: var(--color-accent);
    }
  }
}
</style>
