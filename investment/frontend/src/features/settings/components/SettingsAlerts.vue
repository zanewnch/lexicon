<script setup lang="ts">
import { ref } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Card from '@/components/ui/Card.vue'

const priceAlerts = ref([
  { code: '2330', name: '台積電', condition: '高於', price: 1000, active: true },
  { code: '2330', name: '台積電', condition: '低於', price: 950, active: true },
  { code: '2603', name: '長榮', condition: '高於', price: 180, active: false },
  { code: '2454', name: '聯發科', condition: '低於', price: 1200, active: true },
])
</script>

<template>
  <Card>
    <SectionHeader>
      <template #title>到價提醒<HelpTip termKey="settings.price-alert" /></template>
      <template #actions>
        <button class="btn btn--ghost">+ 新增</button>
      </template>
    </SectionHeader>
    <table class="data-table">
      <thead>
        <tr>
          <th>股票</th>
          <th>條件</th>
          <th class="text-right">價格</th>
          <th>啟用</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(alert, i) in priceAlerts" :key="i">
          <td>
            <span class="text-muted">{{ alert.code }}</span> {{ alert.name }}
          </td>
          <td>{{ alert.condition }}</td>
          <td class="text-right">{{ alert.price.toFixed(2) }}</td>
          <td>
            <label class="toggle toggle--sm">
              <input type="checkbox" v-model="alert.active" />
              <span class="toggle__slider"></span>
            </label>
          </td>
          <td>
            <button class="btn btn--ghost btn--sm">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </Card>
</template>

<style scoped lang="scss">
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

  &--sm {
    width: 36px;
    height: 20px;

    .toggle__slider::before {
      height: 14px;
      width: 14px;
    }

    input:checked + .toggle__slider::before {
      transform: translateX(16px);
    }
  }
}

.btn--sm {
  padding: 4px 8px;
  font-size: var(--font-size-sm);
}
</style>
