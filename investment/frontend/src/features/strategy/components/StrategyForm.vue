<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStrategyData } from '@/features/strategy/composables/useStrategyData'
import {
  CONDITION_LABELS,
  CONDITION_PARAMS,
  PERIOD_META,
  type ConditionType,
  type StrategyPayload,
  type StrategyPeriod,
} from '@/types/strategy'

const route = useRoute()
const router = useRouter()
const { current, loading, error, fetchOne, create, update } = useStrategyData()

const isEdit = computed(() => !!route.params.id)
const strategyId = computed(() => route.params.id as string)

const PERIOD_KEYS = Object.keys(PERIOD_META) as StrategyPeriod[]

const form = reactive<StrategyPayload>({
  name: '',
  description: '',
  enabled: true,
  targets: [],
  period: null,
  conditions: [],
  logic: 'AND',
  action: 'notify',
})

const targetInput = ref('')

function addTarget() {
  const code = targetInput.value.trim().toUpperCase()
  if (code && !form.targets.includes(code)) {
    form.targets.push(code)
  }
  targetInput.value = ''
}

function removeTarget(code: string) {
  form.targets = form.targets.filter((c) => c !== code)
}

const conditionTypes = Object.keys(CONDITION_LABELS) as ConditionType[]

function addCondition(type: ConditionType) {
  const paramDefs = CONDITION_PARAMS[type]
  const params: Record<string, number | string> = {}
  for (const p of paramDefs) {
    if (p.options) {
      params[p.key] = p.options![0]!.value
    } else {
      params[p.key] = 0
    }
  }
  form.conditions.push({ type, params })
}

function removeCondition(idx: number) {
  form.conditions.splice(idx, 1)
}

async function onSubmit() {
  if (!form.name.trim()) return
  if (isEdit.value) {
    const result = await update(strategyId.value, form)
    if (result) router.push('/strategy')
  } else {
    const result = await create(form)
    if (result) router.push('/strategy')
  }
}

function applyQueryPresets() {
  const codesRaw = route.query.codes
  if (typeof codesRaw === 'string' && codesRaw) {
    const codes = codesRaw
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
    for (const code of codes) {
      if (!form.targets.includes(code)) form.targets.push(code)
    }
  }
  const p = route.query.period
  if (typeof p === 'string' && p in PERIOD_META) {
    form.period = p as StrategyPeriod
    if (!form.name) form.name = `${PERIOD_META[form.period].label}策略`
  }
}

onMounted(async () => {
  if (isEdit.value) {
    await fetchOne(strategyId.value)
    if (current.value) {
      form.name = current.value.name
      form.description = current.value.description
      form.enabled = current.value.enabled
      form.targets = [...current.value.targets]
      form.period = current.value.period ?? null
      form.conditions = current.value.conditions.map((c) => ({ ...c, params: { ...c.params } }))
      form.logic = current.value.logic
      form.action = current.value.action
    }
  } else {
    applyQueryPresets()
  }
})
</script>

<template>
  <div class="strategy-form">
    <h2 class="strategy-form__title">{{ isEdit ? '編輯策略' : '建立新策略' }}</h2>

    <div v-if="error" class="strategy-form__error">{{ error }}</div>

    <form @submit.prevent="onSubmit" class="strategy-form__body">
      <!-- 基本資訊 -->
      <section class="strategy-form__section">
        <h3 class="strategy-form__section-title">基本資訊</h3>
        <div class="strategy-form__field">
          <label class="strategy-form__label">策略名稱 *</label>
          <input v-model="form.name" type="text" class="strategy-form__input" placeholder="例如：月線突破買進" />
        </div>
        <div class="strategy-form__field">
          <label class="strategy-form__label">說明</label>
          <textarea v-model="form.description" class="strategy-form__textarea" rows="2" placeholder="描述此策略的邏輯"></textarea>
        </div>
        <div class="strategy-form__field">
          <label class="strategy-form__label">交易週期</label>
          <div class="strategy-form__periods">
            <button
              v-for="key in PERIOD_KEYS"
              :key="key"
              type="button"
              class="strategy-form__period"
              :class="{ 'strategy-form__period--active': form.period === key }"
              @click="form.period = form.period === key ? null : key"
            >
              <span class="strategy-form__period-label">{{ PERIOD_META[key].label }}</span>
              <span class="strategy-form__period-hint">{{ PERIOD_META[key].hint }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 目標股票 -->
      <section class="strategy-form__section">
        <h3 class="strategy-form__section-title">目標股票</h3>
        <p class="strategy-form__hint">不指定則為全市場掃描</p>
        <div class="strategy-form__inline">
          <input
            v-model="targetInput"
            type="text"
            class="strategy-form__input strategy-form__input--short"
            placeholder="股票代碼 (如 2330)"
            @keydown.enter.prevent="addTarget"
          />
          <button type="button" class="strategy-form__btn strategy-form__btn--secondary" @click="addTarget">新增</button>
        </div>
        <div class="strategy-form__tags" v-if="form.targets.length">
          <span v-for="code in form.targets" :key="code" class="strategy-form__tag">
            {{ code }}
            <button type="button" class="strategy-form__tag-remove" @click="removeTarget(code)">&times;</button>
          </span>
        </div>
      </section>

      <!-- 條件 -->
      <section class="strategy-form__section">
        <h3 class="strategy-form__section-title">觸發條件</h3>
        <div class="strategy-form__logic">
          <span>條件邏輯：</span>
          <label class="strategy-form__radio">
            <input type="radio" v-model="form.logic" value="AND" /> 全部符合 (AND)
          </label>
          <label class="strategy-form__radio">
            <input type="radio" v-model="form.logic" value="OR" /> 任一符合 (OR)
          </label>
        </div>

        <div v-for="(cond, idx) in form.conditions" :key="idx" class="condition-row">
          <div class="condition-row__header">
            <span class="condition-row__type">{{ CONDITION_LABELS[cond.type] }}</span>
            <button type="button" class="condition-row__remove" @click="removeCondition(idx)">&times;</button>
          </div>
          <div class="condition-row__params">
            <div v-for="paramDef in CONDITION_PARAMS[cond.type]" :key="paramDef.key" class="condition-row__param">
              <label class="condition-row__param-label">{{ paramDef.label }}</label>
              <select v-if="paramDef.options" v-model="cond.params[paramDef.key]" class="strategy-form__input strategy-form__input--short">
                <option v-for="opt in paramDef.options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
              </select>
              <input v-else v-model.number="cond.params[paramDef.key]" type="number" step="any" class="strategy-form__input strategy-form__input--short" />
            </div>
          </div>
        </div>

        <div class="strategy-form__add-condition">
          <span class="strategy-form__add-label">新增條件：</span>
          <div class="strategy-form__condition-chips">
            <button
              v-for="ct in conditionTypes"
              :key="ct"
              type="button"
              class="strategy-form__chip"
              @click="addCondition(ct)"
            >
              + {{ CONDITION_LABELS[ct] }}
            </button>
          </div>
        </div>
      </section>

      <!-- Submit -->
      <div class="strategy-form__actions">
        <button type="submit" class="strategy-form__btn strategy-form__btn--primary" :disabled="loading || !form.name.trim()">
          {{ isEdit ? '儲存變更' : '建立策略' }}
        </button>
        <button type="button" class="strategy-form__btn strategy-form__btn--secondary" @click="router.push('/strategy')">
          取消
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.strategy-form {
  max-width: 720px;

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin-bottom: 20px;
  }

  &__periods {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__period {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 14px;
    min-width: 140px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all var(--duration-fast);

    &:hover { border-color: var(--color-accent); }

    &--active {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
  }

  &__period-label { font-size: 14px; font-weight: 600; }
  &__period-hint  { font-size: 11px; opacity: 0.75; margin-top: 2px; }

  &__error {
    padding: 12px 16px;
    margin-bottom: var(--gap-md);
    border-radius: var(--radius-md);
    background: var(--color-down-soft);
    color: var(--color-down);
    font-size: 13px;
  }

  &__section {
    margin-bottom: var(--gap-lg);
    padding: 16px 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
  }

  &__section-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
  }

  &__field {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }

  &__hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--gap-sm);
  }

  &__input, &__textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color var(--duration-fast);

    &::placeholder {
      color: var(--color-text-muted);
    }

    &:focus {
      border-color: var(--color-accent);
    }
  }

  &__input--short {
    width: auto;
    min-width: 120px;
  }

  &__textarea {
    resize: vertical;
    font-family: inherit;
  }

  &__inline {
    display: flex;
    gap: var(--gap-sm);
    align-items: center;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: var(--gap-sm);
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-sm);
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
  }

  &__tag-remove {
    background: none;
    border: none;
    color: var(--color-accent);
    cursor: pointer;
    font-size: var(--font-size-base);
    line-height: 1;
    padding: 0 2px;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  &__logic {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__radio {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 13px;
  }

  &__add-condition {
    margin-top: 12px;
  }

  &__add-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    display: block;
    margin-bottom: 6px;
  }

  &__condition-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    font-size: var(--font-size-xs);
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px dashed var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast);

    &:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: var(--color-accent-soft);
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__btn {
    padding: var(--btn-padding-md);
    border-radius: var(--radius-md);
    font-size: var(--btn-font-md);
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--duration-fast);

    &--primary {
      background: var(--color-accent);
      color: #fff;

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    &--secondary {
      background: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);

      &:hover {
        color: var(--color-text-primary);
        border-color: var(--color-text-muted);
      }
    }
  }
}

.condition-row {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--gap-sm);
  }

  &__type {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent);
  }

  &__remove {
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;

    &:hover {
      color: var(--color-down);
    }
  }

  &__params {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__param {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__param-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    white-space: nowrap;
  }
}
</style>
