<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { LogOut, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import { useTradingData } from '@/features/trade/composables/useTradingData'
import { useToast } from '@/composables/useToast'
import { EXIT_REASON_LABELS } from '@/types/trading'
import { formatSign } from '@/utils/formatters'

const { signals, trades, refreshAll, runWatchdog, runExiter, loading, venue } = useTradingData()
const toast = useToast()

const stopLossPct = ref<number>(-5)
const takeProfitPct = ref<number>(10)
const live = computed(() => venue.value !== 'paper')
const tradePin = ref('')
const executing = ref(false)

const pendingSignals = computed(() => signals.value.filter((s) => !s.processed))
const recentExits = computed(() => trades.value.filter((t) => t.side === 'sell').slice(0, 20))

onMounted(() => {
  refreshAll()
})

async function checkWatchdog() {
  try {
    await runWatchdog({
      stopLossPct: stopLossPct.value,
      takeProfitPct: takeProfitPct.value,
    })
    await refreshAll()
    toast.success('Watchdog 已掃描，新訊號已顯示')
  } catch {
    toast.error('Watchdog 掃描失敗')
  }
}

async function executeExit() {
  if (live.value && !tradePin.value) {
    toast.warning('Live 模式需輸入 tradePin')
    return
  }
  if (live.value && !confirm(
    venue.value === 'broker_simulation' ? '將送出券商模擬賣出委託，確定？' : '將送出真實賣出委託，確定？',
  )) return
  executing.value = true
  try {
    const { data } = await runExiter(live.value, tradePin.value, venue.value)
    await refreshAll()
    toast.success(`Exiter 已執行：已平倉 ${data?.closed ?? 0} 筆，等待成交 ${data?.submitted ?? 0} 筆`)
  } catch {
    toast.error('Exiter 執行失敗')
  } finally {
    executing.value = false
  }
}

function reasonLabel(r: string) {
  return EXIT_REASON_LABELS[r as keyof typeof EXIT_REASON_LABELS] ?? r
}
</script>

<template>
  <div class="exiter">
    <header class="exiter__header">
      <div>
        <h1 class="exiter__title">
          <LogOut :size="24" />
          Exiter · 出場
        </h1>
        <p class="exiter__subtitle">接收 Watchdog 訊號 → 一鍵平倉</p>
      </div>
      <button class="btn btn--ghost" :disabled="loading" @click="refreshAll">
        <RefreshCw :size="16" />
        刷新
      </button>
      <select v-model="venue" @change="refreshAll">
        <option value="paper">紙上交易</option>
        <option value="broker_simulation">券商模擬</option>
        <option value="broker_production">正式交易</option>
      </select>
    </header>

    <!-- 上：待處理出場訊號 -->
    <Card class="exiter__card">
      <div class="exiter__card-head">
        <h2 class="exiter__card-title">
          <AlertTriangle :size="18" color="#ec4899" />
          待處理出場訊號
          <span class="exiter__count">{{ pendingSignals.length }}</span>
        </h2>
        <button class="btn btn--primary" :disabled="!pendingSignals.length || executing" @click="executeExit">
          {{ executing ? '執行中…' : '一鍵平倉' }}
        </button>
      </div>
      <div v-if="!pendingSignals.length" class="exiter__empty">目前無待處理訊號</div>
      <table v-else class="exiter__table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>原因</th>
            <th>觸發價</th>
            <th>時間</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in pendingSignals" :key="s.id">
            <td class="mono">{{ s.symbol }}</td>
            <td>
              <span class="exiter__reason" :class="`exiter__reason--${s.reason}`">
                {{ reasonLabel(s.reason) }}
              </span>
            </td>
            <td class="mono">{{ s.triggeredPrice.toFixed(2) }}</td>
            <td class="text-muted">{{ new Date(s.triggeredAt).toLocaleString('zh-TW') }}</td>
            <td class="text-muted exiter__note">{{ s.note }}</td>
          </tr>
        </tbody>
      </table>
    </Card>

    <!-- 中：停損/停利設定 + 掃描 -->
    <Card class="exiter__card">
      <div class="exiter__card-head">
        <h2 class="exiter__card-title">停損 / 停利設定</h2>
        <button class="btn btn--ghost" :disabled="loading" @click="checkWatchdog">
          執行 Watchdog 檢查
        </button>
      </div>
      <div class="exiter__settings">
        <label class="exiter__field">
          <span>停損 %</span>
          <input v-model.number="stopLossPct" type="number" step="0.5" />
        </label>
        <label class="exiter__field">
          <span>停利 %</span>
          <input v-model.number="takeProfitPct" type="number" step="0.5" />
        </label>
        <label v-if="live" class="exiter__field">
          <span>Trade PIN</span>
          <input v-model="tradePin" type="password" />
        </label>
      </div>
      <p class="exiter__hint">
        Watchdog 會以目前持倉均價 vs 即時價計算漲跌幅，超過設定即產生訊號寫入上方列表。
      </p>
    </Card>

    <!-- 下：近期出場紀錄 -->
    <Card class="exiter__card">
      <div class="exiter__card-head">
        <h2 class="exiter__card-title">
          <CheckCircle2 :size="18" color="#10b981" />
          近期出場紀錄
        </h2>
      </div>
      <div v-if="!recentExits.length" class="exiter__empty">尚無平倉紀錄</div>
      <table v-else class="exiter__table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>數量</th>
            <th>成交價</th>
            <th>損益</th>
            <th>時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in recentExits" :key="t.id">
            <td class="mono">{{ t.symbol }}</td>
            <td class="mono">{{ t.qty }}</td>
            <td class="mono">{{ t.price.toFixed(2) }}</td>
            <td
              class="mono"
              :class="{ 'text-up': (t.pnl ?? 0) > 0, 'text-down': (t.pnl ?? 0) < 0 }"
            >
              {{ t.pnl == null ? '—' : formatSign(t.pnl) }}
            </td>
            <td class="text-muted">{{ t.executedAt ? new Date(t.executedAt).toLocaleString('zh-TW') : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.exiter {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px;
  }

  &__subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  &__card {
    padding: var(--gap-lg);
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  &__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
    flex-wrap: wrap;
  }

  &__card-title {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 22px;
    padding: 0 8px;
    border-radius: 11px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 700;
  }

  &__empty {
    padding: var(--gap-lg);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
      font-size: var(--font-size-sm);
    }

    th {
      color: var(--color-text-muted);
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
    }
  }

  &__reason {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;

    &--stop_loss {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    &--take_profit {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    &--manual {
      background: rgba(100, 116, 139, 0.15);
      color: var(--color-text-muted);
    }
  }

  &__note {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__settings {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--gap-md);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    span {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    input {
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
    }

    &--toggle {
      flex-direction: row;
      align-items: center;
      gap: var(--gap-sm);

      input {
        width: auto;
      }
    }
  }

  &__hint {
    color: var(--color-text-muted);
    font-size: 12px;
    margin: 0;
  }
}

.mono {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}
</style>
