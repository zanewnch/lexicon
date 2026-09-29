<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/layout/PageHeader.vue'
import StepStepper from '@/features/pipeline/components/StepStepper.vue'
import { usePipelineStore } from '@/stores/pipelineStore'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const store = usePipelineStore()
const toast = useToast()
const { state } = storeToRefs(store)

store.setStep(1)

// 接收從 scanner 漏斗送過來的股票（query string ?symbols=2330,2454）
if (route.query.symbols && typeof route.query.symbols === 'string') {
  const symbols = route.query.symbols.split(',').filter(Boolean)
  store.addStocks(symbols.map((s) => ({ symbol: s })))
  router.replace({ query: {} })
}

const newSymbol = ref('')
const newName = ref('')

function addManual() {
  const sym = newSymbol.value.trim()
  if (!sym) return
  store.addStocks([{ symbol: sym, name: newName.value.trim() || undefined }])
  newSymbol.value = ''
  newName.value = ''
}

function next() {
  if (!store.canProceed[1]) {
    toast.warning('請至少選一檔股票')
    return
  }
  router.push('/pipeline/step2')
}
</script>

<template>
  <div class="step1">
    <PageHeader title="策略流程" subtitle="第 1 步 — 選股" />
    <StepStepper :current="1" />

    <div class="step1__panel">
      <div class="step1__head">
        <h3>已選股票（{{ state.selected.length }}）</h3>
        <button v-if="state.selected.length" class="step1__clear" @click="store.clearStocks">清空</button>
      </div>

      <div v-if="!state.selected.length" class="step1__empty">
        尚未選股。可以從 <RouterLink to="/analysis/explorer">選股掃描</RouterLink> 漏斗送過來，或在下方手動加入。
      </div>

      <ul v-else class="step1__list">
        <li v-for="s in state.selected" :key="s.symbol">
          <strong>{{ s.symbol }}</strong>
          <span v-if="s.name">{{ s.name }}</span>
          <button @click="store.removeStock(s.symbol)">移除</button>
        </li>
      </ul>

      <div class="step1__add">
        <input v-model="newSymbol" placeholder="代碼，如 2330" @keyup.enter="addManual" />
        <input v-model="newName" placeholder="名稱（選填）" @keyup.enter="addManual" />
        <button @click="addManual">加入</button>
      </div>
    </div>

    <div class="step1__nav">
      <button class="step1__next" :disabled="!store.canProceed[1]" @click="next">
        下一步：選週期 →
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step1 {
  &__panel {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--gap-lg);
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--gap-md);
  }

  &__clear {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: var(--color-text-muted);
    padding: 4px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    &:hover { color: #ef4444; border-color: #ef4444; }
  }

  &__empty {
    padding: var(--gap-lg);
    text-align: center;
    color: var(--color-text-muted);
    a { color: var(--color-accent); }
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--gap-lg);
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);

      strong { color: var(--color-text-primary); }
      span { color: var(--color-text-muted); font-size: 13px; }

      button {
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        font-size: 12px;
        &:hover { color: #ef4444; }
      }
    }
  }

  &__add {
    display: flex;
    gap: var(--gap-sm);
    padding-top: var(--gap-md);
    border-top: 1px dashed var(--glass-border);

    input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      color: var(--color-text-primary);
    }

    button {
      padding: 8px 20px;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
    }
  }

  &__nav {
    margin-top: var(--gap-lg);
    display: flex;
    justify-content: flex-end;
  }

  &__next {
    padding: 12px 24px;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;

    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}
</style>
