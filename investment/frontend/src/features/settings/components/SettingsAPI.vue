<script setup lang="ts">
import { ref } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'

const apiKeyMasked = ref('****-****-****-7a3b')
const certFile = ref('Sinopac.pfx')
const certStatus = ref('已驗證')
</script>

<template>
  <Card>
    <h2 class="section-title">API 連線設定<HelpTip termKey="settings.api" /></h2>
    <div class="form-list">
      <div class="form-row">
        <label class="form-row__label">API Key</label>
        <div class="form-row__value">
          <input type="text" :value="apiKeyMasked" disabled class="form-row__input" />
          <button class="btn btn--ghost">更換</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">API Secret</label>
        <div class="form-row__value">
          <input type="password" value="••••••••••••" disabled class="form-row__input" />
          <button class="btn btn--ghost">更換</button>
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">憑證檔案</label>
        <div class="form-row__value">
          <span class="form-row__text">{{ certFile }}</span>
          <Badge variant="muted" size="md">{{ certStatus }}</Badge>
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">連線模式</label>
        <div class="form-row__value">
          <Badge variant="pending" size="md">模擬模式</Badge>
          <button class="btn btn--ghost">切換正式</button>
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

  &__text {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
  }
}
</style>
