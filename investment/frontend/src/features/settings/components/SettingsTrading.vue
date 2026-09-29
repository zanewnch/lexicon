<script setup lang="ts">
import { ref } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'

const tradingSettings = ref({
  defaultOrderType: '限價',
  confirmBeforeOrder: true,
  defaultShares: 1000,
  feeDiscount: 6,
})
</script>

<template>
  <Card>
    <h2 class="section-title">交易設定<HelpTip termKey="settings.trading" /></h2>
    <div class="form-list">
      <div class="form-row">
        <label class="form-row__label">預設委託類型</label>
        <select v-model="tradingSettings.defaultOrderType" class="form-row__input form-row__input--short">
          <option>限價</option>
          <option>市價</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-row__label">預設委託股數</label>
        <input type="number" v-model.number="tradingSettings.defaultShares" step="1000" class="form-row__input form-row__input--short" />
      </div>
      <div class="form-row">
        <label class="form-row__label">手續費折扣</label>
        <div class="form-row__value">
          <input type="number" v-model.number="tradingSettings.feeDiscount" min="1" max="10" class="form-row__input form-row__input--short" />
          <span class="text-muted">折 (實際費率: {{ (0.1425 * tradingSettings.feeDiscount / 10).toFixed(4) }}%)</span>
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">下單前確認</label>
        <label class="toggle">
          <input type="checkbox" v-model="tradingSettings.confirmBeforeOrder" />
          <span class="toggle__slider"></span>
        </label>
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
