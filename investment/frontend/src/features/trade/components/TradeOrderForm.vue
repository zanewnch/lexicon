<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import SimulationBanner from '@/components/layout/SimulationBanner.vue'
import { useMarketStore } from '@/store/market'
import { formatCurrency, formatSign, formatPercent } from '@/utils/formatters'
import type { TradeQuote, AccountBalance } from '@/types/account'
import type { CommandResult } from '@/types/common'
import { useFormValidation } from '@/features/trade/composables/useFormValidation'

const props = defineProps<{
  quote: TradeQuote
  account: AccountBalance
  isDummy: boolean
  orderLoading: boolean
  orderResult: CommandResult | null
  priceFlash: string
}>()

const emit = defineEmits<{
  (e: 'change-stock', code: string): void
  (e: 'place-order', payload: {
    code: string
    side: 'buy' | 'sell'
    price: number
    shares: number
    type: 'limit' | 'market'
    trade_pin: string
  }): void
  (e: 'clear-result'): void
}>()

const app = useMarketStore()

// ---- Order Form State ----
const orderStock = ref('2330')
const orderSide = ref<'buy' | 'sell'>('buy')
const orderType = ref('限價')
const orderPrice = ref(0)
const orderShares = ref(1000)
const confirmVisible = ref(false)
const tradePin = ref('')

const { errors: validationErrors, validate, clearErrors: clearValidation } = useFormValidation(() => {
  const errors: string[] = []
  const code = orderStock.value.trim()

  if (!code) errors.push('請輸入股票代碼')
  if (code !== props.quote.code) errors.push('請先載入該股票報價，再確認委託')
  if (orderShares.value <= 0) errors.push('股數必須大於 0')
  if (orderShares.value % 1000 !== 0) errors.push('股數須為 1000 的倍數（整張交易）')
  if (orderShares.value > 50000) errors.push('單筆委託上限 50 張')

  if (orderType.value === '限價') {
    if (orderPrice.value <= 0) errors.push('限價單價格必須大於 0')
    if (props.quote.limitUp && orderPrice.value > props.quote.limitUp)
      errors.push(`委託價超過漲停價 ${props.quote.limitUp}`)
    if (props.quote.limitDown && orderPrice.value < props.quote.limitDown)
      errors.push(`委託價低於跌停價 ${props.quote.limitDown}`)
  }

  if (estimatedTotal.value > 5_000_000) errors.push('單筆金額超過 500 萬上限')

  return errors
})

// 防連點
const submitCooldown = ref(false)

const estimatedTotal = computed(() => {
  return orderPrice.value * orderShares.value
})

const estimatedFee = computed(() => {
  return Math.round(estimatedTotal.value * 0.001425)
})

const estimatedTax = computed(() => {
  return orderSide.value === 'sell' ? Math.round(estimatedTotal.value * 0.003) : 0
})

// 價格偏離市價百分比
const priceDeviation = computed(() => {
  if (!props.quote.price || orderType.value === '市價') return 0
  return Math.abs(orderPrice.value - props.quote.price) / props.quote.price * 100
})

const priceDeviationWarning = computed(() => {
  if (orderType.value === '市價') return ''
  if (priceDeviation.value > 5) return `委託價偏離市價 ${priceDeviation.value.toFixed(1)}%，請確認是否正確`
  if (priceDeviation.value > 3) return `委託價偏離市價 ${priceDeviation.value.toFixed(1)}%`
  return ''
})

watch(() => props.quote.code, (code) => {
  if (!code) return
  orderStock.value = code
  orderPrice.value = props.quote.price
  confirmVisible.value = false
  tradePin.value = ''
  clearValidation()
})

async function onChangeStock() {
  const code = orderStock.value.trim()
  if (!code) return
  emit('change-stock', code)
  clearValidation()
}

/** Called from parent after quote updates, to sync the price field */
function syncPrice(price: number) {
  orderPrice.value = price
}

function onConfirmOrder() {
  emit('clear-result')
  if (!validate()) return
  tradePin.value = ''
  confirmVisible.value = true
}

async function onSubmitOrder() {
  if (submitCooldown.value || props.orderLoading) return
  if (!validate()) {
    confirmVisible.value = false
    return
  }
  if (!tradePin.value.trim()) {
    validationErrors.value = ['請輸入交易密碼']  // direct assign for single PIN error
    return
  }

  confirmVisible.value = false
  submitCooldown.value = true

  emit('place-order', {
    code: orderStock.value.trim(),
    side: orderSide.value,
    price: orderPrice.value,
    shares: orderShares.value,
    type: orderType.value === '市價' ? 'market' : 'limit',
    trade_pin: tradePin.value,
  })

  tradePin.value = ''
  // 冷卻 3 秒防連點
  setTimeout(() => { submitCooldown.value = false }, 3000)
}

function onCancelConfirm() {
  confirmVisible.value = false
  tradePin.value = ''
}

/** Called from parent when an orderbook price is clicked */
function setPrice(price: number) {
  orderPrice.value = price
}

defineExpose({ syncPrice, setPrice })
</script>

<template>
  <div class="trade-order-form">
    <!-- 股票報價摘要 -->
    <Card class="quote-summary">
      <div class="quote-summary__main">
        <div>
          <span class="quote-summary__code text-muted">{{ quote.code }}</span>
          <span class="quote-summary__name">{{ quote.name }}</span>
          <DummyBadge :show="isDummy" />
        </div>
        <div class="quote-summary__price-group">
          <span class="quote-summary__price" :class="priceFlash">{{ quote.price.toFixed(2) }}</span>
          <span class="quote-summary__change" :class="quote.up ? 'text-up' : 'text-down'">
            {{ quote.change >= 0 ? '▲' : '▼' }} {{ formatSign(quote.change) }} ({{ formatPercent(quote.percent) }})
          </span>
        </div>
      </div>
      <div class="quote-summary__details">
        <div><span class="text-muted">開</span> {{ quote.open.toFixed(2) }}</div>
        <div><span class="text-muted">高</span> <span class="text-up">{{ quote.high.toFixed(2) }}</span></div>
        <div><span class="text-muted">低</span> <span class="text-down">{{ quote.low.toFixed(2) }}</span></div>
        <div><span class="text-muted">量</span> {{ formatCurrency(quote.volume) }}</div>
        <div><span class="text-muted">漲停</span> {{ quote.limitUp.toFixed(2) }}</div>
        <div><span class="text-muted">跌停</span> {{ quote.limitDown.toFixed(2) }}</div>
      </div>
    </Card>

    <!-- 下單表單 -->
    <Card class="order-form">
      <h2 class="section-title">委託下單<DummyBadge :show="isDummy" /><HelpTip termKey="trade.order" /></h2>

      <div class="order-form__side-toggle">
        <button
          class="side-btn"
          :class="{ 'side-btn--buy': true, active: orderSide === 'buy' }"
          @click="orderSide = 'buy'"
        >買進</button>
        <button
          class="side-btn"
          :class="{ 'side-btn--sell': true, active: orderSide === 'sell' }"
          @click="orderSide = 'sell'"
        >賣出</button>
      </div>

      <div class="order-form__fields">
        <div class="form-group">
          <label class="form-group__label">股票代碼</label>
          <input type="text" v-model="orderStock" class="form-group__input" @keydown.enter="onChangeStock" @blur="onChangeStock" />
        </div>
        <div class="form-group">
          <label class="form-group__label">委託類型</label>
          <select v-model="orderType" class="form-group__input">
            <option>限價</option>
            <option>市價</option>
          </select>
        </div>
        <div class="form-group" v-if="orderType === '限價'">
          <label class="form-group__label">委託價格</label>
          <input type="number" v-model.number="orderPrice" step="0.5" class="form-group__input" />
        </div>
        <div class="form-group">
          <label class="form-group__label">委託股數</label>
          <input type="number" v-model.number="orderShares" step="1000" min="1000" class="form-group__input" />
          <span class="form-group__hint text-muted">= {{ (orderShares / 1000).toFixed(0) }} 張</span>
        </div>
      </div>

      <!-- 偏離警告 -->
      <div v-if="priceDeviationWarning" class="order-form__warning">
        ⚠ {{ priceDeviationWarning }}
      </div>

      <!-- 前端驗證錯誤 -->
      <div v-if="validationErrors.length" class="order-form__errors">
        <div v-for="(err, i) in validationErrors" :key="i">{{ err }}</div>
      </div>

      <div class="order-form__estimate">
        <div class="estimate-row">
          <span class="text-muted">預估金額</span>
          <span>${{ formatCurrency(estimatedTotal) }}</span>
        </div>
        <div class="estimate-row">
          <span class="text-muted">預估手續費</span>
          <span>${{ formatCurrency(estimatedFee) }}</span>
        </div>
        <div v-if="orderSide === 'sell'" class="estimate-row">
          <span class="text-muted">預估證交稅</span>
          <span>${{ formatCurrency(estimatedTax) }}</span>
        </div>
        <div class="estimate-row estimate-row--total">
          <span>預估總額</span>
          <span class="estimate-row__total">${{ formatCurrency(estimatedTotal + estimatedFee + estimatedTax) }}</span>
        </div>
      </div>

      <button
        class="order-form__submit btn btn--primary"
        :class="orderSide === 'buy' ? 'btn--buy' : 'btn--sell'"
        :disabled="orderLoading"
        @click="onConfirmOrder"
      >
        {{ orderLoading ? '送出中...' : orderSide === 'buy' ? '確認買進' : '確認賣出' }}
      </button>

      <!-- 下單結果 -->
      <div v-if="orderResult" class="order-form__result" :class="orderResult.success ? 'order-form__result--success' : 'order-form__result--error'">
        {{ orderResult.message }}
      </div>
    </Card>

    <!-- 確認對話框 -->
    <Teleport to="body">
      <div v-if="confirmVisible" class="order-confirm-overlay" @click.self="onCancelConfirm">
        <div class="order-confirm">
          <h3 class="order-confirm__title">
            確認委託
            <span class="order-confirm__title-warn">請仔細核對以下資訊</span>
          </h3>

          <div class="order-confirm__body">
            <div class="order-confirm__row">
              <span>股票</span>
              <span><strong>{{ quote.code }}</strong> {{ quote.name }}</span>
            </div>
            <div class="order-confirm__row">
              <span>方向</span>
              <span class="order-confirm__side" :class="orderSide === 'buy' ? 'text-down' : 'text-up'">
                {{ orderSide === 'buy' ? '買進' : '賣出' }}
              </span>
            </div>
            <div class="order-confirm__row">
              <span>類型</span>
              <span>{{ orderType }}</span>
            </div>
            <div class="order-confirm__row" v-if="orderType === '限價'">
              <span>委託價</span>
              <span>{{ orderPrice.toFixed(2) }}</span>
            </div>
            <div class="order-confirm__row">
              <span>目前市價</span>
              <span>{{ quote.price.toFixed(2) }}</span>
            </div>
            <div class="order-confirm__row">
              <span>股數</span>
              <span>{{ orderShares.toLocaleString() }} 股（{{ (orderShares / 1000).toFixed(0) }} 張）</span>
            </div>
            <div class="order-confirm__row">
              <span>手續費</span>
              <span>${{ formatCurrency(estimatedFee) }}</span>
            </div>
            <div v-if="orderSide === 'sell'" class="order-confirm__row">
              <span>證交稅</span>
              <span>${{ formatCurrency(estimatedTax) }}</span>
            </div>
            <div class="order-confirm__row order-confirm__row--total">
              <span>預估總額</span>
              <span>${{ formatCurrency(estimatedTotal + estimatedFee + estimatedTax) }}</span>
            </div>
          </div>

          <!-- 偏離警告 -->
          <div v-if="priceDeviationWarning" class="order-confirm__deviation-warn">
            ⚠ {{ priceDeviationWarning }}
          </div>

          <!-- 交易密碼 -->
          <div class="order-confirm__pin">
            <label class="order-confirm__pin-label">交易密碼</label>
            <input
              v-model="tradePin"
              type="password"
              class="order-confirm__pin-input"
              placeholder="請輸入交易密碼"
              autocomplete="off"
              @keydown.enter="onSubmitOrder"
            />
          </div>

          <div class="order-confirm__actions">
            <button class="order-confirm__btn order-confirm__btn--cancel" @click="onCancelConfirm">取消</button>
            <button
              class="order-confirm__btn"
              :class="orderSide === 'buy' ? 'order-confirm__btn--buy' : 'order-confirm__btn--sell'"
              :disabled="!tradePin.trim() || submitCooldown || orderLoading"
              @click="onSubmitOrder"
            >
              {{ submitCooldown ? '請稍候...' : '確認送出' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 帳戶資訊 -->
    <Card>
      <h2 class="section-title">帳戶餘額<DummyBadge :show="isDummy" /><HelpTip termKey="trade.account-balance" /></h2>
      <SimulationBanner v-if="app.isSimulation" inline message="模擬模式不支援帳戶餘額查詢。" />
      <div v-else class="account-info">
        <div class="account-info__item">
          <span class="text-muted">可用餘額</span>
          <span>${{ formatCurrency(account.cashBalance) }}</span>
        </div>
        <div class="account-info__item">
          <span class="text-muted">購買力</span>
          <span>${{ formatCurrency(account.buyingPower) }}</span>
        </div>
        <div class="account-info__item">
          <span class="text-muted">已用保證金</span>
          <span>${{ formatCurrency(account.marginUsed) }}</span>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped lang="scss">
// ---- Quote Summary ----

.quote-summary {
  &__main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  &__code {
    margin-right: 8px;
  }

  &__name {
    font-size: var(--font-size-lg);
    font-weight: 700;
  }

  &__price-group {
    text-align: right;
  }

  &__price {
    font-size: var(--font-size-xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    display: block;
  }

  &__change {
    font-size: var(--font-size-base);
    font-weight: 500;
  }

  &__details {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--gap-sm);
    font-size: var(--font-size-base);
    font-variant-numeric: tabular-nums;

    span.text-muted {
      margin-right: 4px;
      font-size: var(--font-size-xs);
    }
  }
}

// ---- Order Form ----

.order-form {
  &__side-toggle {
    display: flex;
    gap: 0;
    margin-bottom: 20px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
    margin-bottom: 20px;
  }

  &__estimate {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
    padding: 16px;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    margin-bottom: 16px;
  }

  &__submit {
    width: 100%;
    padding: 12px;
    font-size: var(--font-size-md);
    font-weight: 600;
    border-radius: var(--radius-sm);
  }

  &__warning {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-sm);
    background: rgba(234, 179, 8, 0.1);
    color: #eab308;
    font-size: var(--font-size-sm);
    font-weight: 500;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  &__errors {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-sm);
    background: var(--color-down-soft);
    color: var(--color-down);
    font-size: var(--font-size-sm);
    line-height: 1.6;
  }

  &__result {
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: 500;

    &--success {
      background: var(--color-up-soft);
      color: var(--color-up);
    }

    &--error {
      background: var(--color-down-soft);
      color: var(--color-down);
    }
  }
}

.side-btn {
  flex: 1;
  padding: 10px;
  font-weight: 600;
  font-size: var(--font-size-base);
  transition: all var(--duration-fast);
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);

  &--buy.active {
    background: var(--color-down-soft);
    color: var(--color-down);
  }

  &--sell.active {
    background: var(--color-up-soft);
    color: var(--color-up);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__input {
    width: 100%;
  }

  &__hint {
    font-size: var(--font-size-sm);
  }
}

.estimate-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-base);
  font-variant-numeric: tabular-nums;

  &--total {
    padding-top: var(--gap-sm);
    border-top: 1px solid var(--color-border);
    font-weight: 600;
  }

  &__total {
    font-size: var(--font-size-md);
    font-weight: 700;
  }
}

.btn {
  &--buy {
    background: var(--color-down);

    &:hover {
      background: #dc2626;
    }
  }

  &--sell {
    background: var(--color-up);

    &:hover {
      background: #16a34a;
    }
  }
}

// ---- Account Info ----

.account-info {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__item {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-base);
    font-variant-numeric: tabular-nums;
  }
}

// ---- Confirm dialog (Teleported to body) ----

.order-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-confirm {
  width: 420px;
  max-width: 90vw;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 24px;

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  &__title-warn {
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-text-muted);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
    margin-bottom: 16px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-base);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-secondary);

    &--total {
      padding-top: 10px;
      margin-top: 4px;
      border-top: 1px solid var(--color-border);
      font-weight: 700;
      font-size: 15px;
      color: var(--color-text-primary);
    }
  }

  &__side {
    font-weight: 700;
    font-size: var(--font-size-base);
  }

  &__deviation-warn {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-sm);
    background: rgba(234, 179, 8, 0.1);
    color: #eab308;
    font-size: var(--font-size-sm);
    font-weight: 500;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  &__pin {
    margin-bottom: 16px;
  }

  &__pin-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 6px;
  }

  &__pin-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    outline: none;
    transition: border-color var(--duration-fast);
    letter-spacing: 4px;

    &::placeholder {
      color: var(--color-text-muted);
      letter-spacing: normal;
    }

    &:focus {
      border-color: var(--color-accent);
    }
  }

  &__actions {
    display: flex;
    gap: var(--gap-md);
  }

  &__btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 700;
    cursor: pointer;
    transition: all var(--duration-fast);

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--cancel {
      background: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);

      &:hover {
        background: var(--color-bg-hover);
      }
    }

    &--buy {
      background: var(--color-down);
      color: #fff;

      &:hover:not(:disabled) { filter: brightness(1.1); }
    }

    &--sell {
      background: var(--color-up);
      color: #fff;

      &:hover:not(:disabled) { filter: brightness(1.1); }
    }
  }
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .order-form {
    &__estimate {
      padding: 12px;
    }

    &__fields {
      gap: var(--gap-sm);
      margin-bottom: 14px;
    }
  }

  .quote-summary__details {
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-xs);
    font-size: var(--font-size-sm);
  }
}

// ---- Responsive: 480px ----
@media (max-width: 480px) {
  .quote-summary {
    &__name {
      font-size: var(--font-size-base);
    }

    &__price {
      font-size: var(--font-size-lg);
    }

    &__details {
      font-size: var(--font-size-xs);
    }
  }

  .side-btn {
    padding: 8px;
    font-size: var(--font-size-sm);
  }

  .order-form__submit {
    padding: 10px;
    font-size: var(--font-size-base);
  }
}
</style>
