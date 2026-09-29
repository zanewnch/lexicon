<script setup lang="ts">
import { ref } from 'vue'
import Card from '@/components/ui/Card.vue'

const notifications = ref({
  priceAlert: true,
  tradeConfirm: true,
  dividendNotice: true,
  marketOpen: false,
  dailyReport: true,
})
</script>

<template>
  <Card>
    <h2 class="section-title">通知設定</h2>
    <div class="form-list">
      <div class="form-row">
        <label class="form-row__label">到價提醒</label>
        <label class="toggle">
          <input type="checkbox" v-model="notifications.priceAlert" />
          <span class="toggle__slider"></span>
        </label>
      </div>
      <div class="form-row">
        <label class="form-row__label">成交通知</label>
        <label class="toggle">
          <input type="checkbox" v-model="notifications.tradeConfirm" />
          <span class="toggle__slider"></span>
        </label>
      </div>
      <div class="form-row">
        <label class="form-row__label">股利通知</label>
        <label class="toggle">
          <input type="checkbox" v-model="notifications.dividendNotice" />
          <span class="toggle__slider"></span>
        </label>
      </div>
      <div class="form-row">
        <label class="form-row__label">開盤提醒</label>
        <label class="toggle">
          <input type="checkbox" v-model="notifications.marketOpen" />
          <span class="toggle__slider"></span>
        </label>
      </div>
      <div class="form-row">
        <label class="form-row__label">每日報告</label>
        <label class="toggle">
          <input type="checkbox" v-model="notifications.dailyReport" />
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
