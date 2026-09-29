<script setup lang="ts">
import { onMounted } from 'vue'
import { Eye, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import { useWatchdogMonitor } from '@/features/trade/composables/useWatchdogMonitor'
import { EXIT_REASON_LABELS } from '@/types/trading'
import { formatPercent } from '@/utils/formatters'

const {
  monitored,
  pendingSignals,
  historicalSignals,
  loading,
  lastError,
  lastRefreshedAt,
  stopLossPct,
  takeProfitPct,
  refresh,
} = useWatchdogMonitor()

onMounted(() => {
  refresh()
})

function formatTs(date: Date | null) {
  if (!date) return '—'
  return date.toLocaleTimeString('zh-TW', { hour12: false })
}

function riskLabel(risk: string) {
  return {
    safe: '安全',
    'near-tp': '接近停利',
    'near-sl': '接近停損',
    'triggered-tp': '已觸發停利',
    'triggered-sl': '已觸發停損',
  }[risk] ?? risk
}

function reasonLabel(r: string) {
  return EXIT_REASON_LABELS[r as keyof typeof EXIT_REASON_LABELS] ?? r
}

function barOffsetPercent(changePct: number, sl: number, tp: number) {
  const total = tp - sl
  if (total <= 0) return 50
  const pos = ((changePct - sl) / total) * 100
  return Math.max(0, Math.min(100, pos))
}
</script>

<template>
  <div class="watchdog">
    <header class="watchdog__header">
      <div>
        <h1 class="watchdog__title">
          <Eye :size="24" />
          Watchdog · 持倉監控
        </h1>
        <p class="watchdog__subtitle">
          即時盯盤每檔持倉與停損停利距離；實際觸發 / 平倉請至 Exiter 頁面。
        </p>
      </div>
      <div class="watchdog__header-right">
        <span v-if="lastRefreshedAt" class="watchdog__ts">
          最後更新 {{ formatTs(lastRefreshedAt) }}
        </span>
        <button class="btn btn--ghost" :disabled="loading" @click="refresh">
          <RefreshCw :size="16" :class="{ 'spin': loading }" />
          {{ loading ? '載入中…' : '刷新' }}
        </button>
      </div>
    </header>

    <div v-if="lastError" class="watchdog__error">
      <AlertCircle :size="16" />
      {{ lastError }}
    </div>

    <!-- 設定參考 -->
    <Card class="watchdog__card">
      <div class="watchdog__settings">
        <label class="watchdog__field">
          <span>停損 %</span>
          <input v-model.number="stopLossPct" type="number" step="0.5" />
        </label>
        <label class="watchdog__field">
          <span>停利 %</span>
          <input v-model.number="takeProfitPct" type="number" step="0.5" />
        </label>
        <p class="watchdog__hint">
          ※ 此頁僅為監控視圖，修改數值只影響顯示距離與風險標示，不會觸發檢查；實際掃描請至 Exiter 頁面。
        </p>
      </div>
    </Card>

    <!-- 持倉監控表 -->
    <Card class="watchdog__card">
      <div class="watchdog__card-head">
        <h2 class="watchdog__card-title">
          <ShieldCheck :size="18" />
          持倉監控
          <span class="watchdog__count">{{ monitored.length }}</span>
        </h2>
      </div>

      <div v-if="!monitored.length" class="watchdog__empty">
        目前沒有未平倉持倉。
      </div>

      <table v-else class="watchdog__table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>名稱</th>
            <th class="text-right">股數</th>
            <th class="text-right">均價</th>
            <th class="text-right">現價</th>
            <th class="text-right">漲跌 %</th>
            <th>距離停損 ↔ 停利</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in monitored" :key="m.position.id">
            <td class="mono">{{ m.position.symbol }}</td>
            <td>{{ m.name ?? '—' }}</td>
            <td class="mono text-right">{{ m.position.qty.toLocaleString() }}</td>
            <td class="mono text-right">{{ m.position.avgCost.toFixed(2) }}</td>
            <td class="mono text-right">{{ m.currentPrice?.toFixed(2) ?? '—' }}</td>
            <td
              class="mono text-right"
              :class="{
                'text-up': (m.changePct ?? 0) > 0,
                'text-down': (m.changePct ?? 0) < 0,
              }"
            >
              {{ m.changePct == null ? '—' : formatPercent(m.changePct) }}
            </td>
            <td class="watchdog__bar-cell">
              <template v-if="m.changePct != null">
                <div class="watchdog__bar-track">
                  <div class="watchdog__bar-zone watchdog__bar-zone--sl" />
                  <div class="watchdog__bar-zone watchdog__bar-zone--safe" />
                  <div class="watchdog__bar-zone watchdog__bar-zone--tp" />
                  <div
                    class="watchdog__bar-marker"
                    :style="{ left: barOffsetPercent(m.changePct, stopLossPct, takeProfitPct) + '%' }"
                  />
                </div>
                <div class="watchdog__bar-labels">
                  <span class="text-down">{{ stopLossPct }}%</span>
                  <span class="text-up">{{ takeProfitPct }}%</span>
                </div>
              </template>
              <span v-else class="text-muted">無現價</span>
            </td>
            <td>
              <span class="watchdog__risk" :class="`watchdog__risk--${m.risk}`">
                {{ riskLabel(m.risk) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>

    <!-- 待處理訊號 -->
    <Card v-if="pendingSignals.length" class="watchdog__card">
      <div class="watchdog__card-head">
        <h2 class="watchdog__card-title">
          <AlertCircle :size="18" color="#ef4444" />
          待處理出場訊號
          <span class="watchdog__count watchdog__count--alert">{{ pendingSignals.length }}</span>
        </h2>
      </div>
      <table class="watchdog__table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>原因</th>
            <th class="text-right">觸發價</th>
            <th>時間</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in pendingSignals" :key="s.id">
            <td class="mono">{{ s.symbol }}</td>
            <td>
              <span class="watchdog__reason" :class="`watchdog__reason--${s.reason}`">
                {{ reasonLabel(s.reason) }}
              </span>
            </td>
            <td class="mono text-right">{{ s.triggeredPrice.toFixed(2) }}</td>
            <td class="text-muted">{{ new Date(s.triggeredAt).toLocaleString('zh-TW') }}</td>
            <td class="text-muted watchdog__note">{{ s.note }}</td>
          </tr>
        </tbody>
      </table>
    </Card>

    <!-- 歷史訊號 -->
    <Card class="watchdog__card">
      <div class="watchdog__card-head">
        <h2 class="watchdog__card-title">歷史訊號</h2>
      </div>
      <div v-if="!historicalSignals.length" class="watchdog__empty">
        尚無歷史訊號。
      </div>
      <table v-else class="watchdog__table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>原因</th>
            <th class="text-right">觸發價</th>
            <th>時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in historicalSignals.slice(0, 30)" :key="s.id">
            <td class="mono">{{ s.symbol }}</td>
            <td>
              <span class="watchdog__reason" :class="`watchdog__reason--${s.reason}`">
                {{ reasonLabel(s.reason) }}
              </span>
            </td>
            <td class="mono text-right">{{ s.triggeredPrice.toFixed(2) }}</td>
            <td class="text-muted">{{ new Date(s.triggeredAt).toLocaleString('zh-TW') }}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.watchdog {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
    flex-wrap: wrap;
  }

  &__header-right {
    display: flex;
    align-items: center;
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

  &__ts {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  &__error {
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    gap: 8px;
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
    background: var(--color-bg-hover);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 700;

    &--alert {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }

  &__settings {
    display: flex;
    gap: var(--gap-lg);
    align-items: flex-end;
    flex-wrap: wrap;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 120px;

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
  }

  &__hint {
    flex: 1;
    min-width: 240px;
    color: var(--color-text-muted);
    font-size: 12px;
    margin: 0;
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
      vertical-align: middle;
    }

    th {
      color: var(--color-text-muted);
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
    }
  }

  &__bar-cell {
    min-width: 180px;
  }

  &__bar-track {
    position: relative;
    height: 8px;
    display: flex;
    border-radius: 4px;
    overflow: hidden;
  }

  &__bar-zone {
    height: 100%;

    &--sl {
      flex: 1;
      background: rgba(239, 68, 68, 0.25);
    }
    &--safe {
      flex: 3;
      background: rgba(100, 116, 139, 0.15);
    }
    &--tp {
      flex: 1;
      background: rgba(16, 185, 129, 0.25);
    }
  }

  &__bar-marker {
    position: absolute;
    top: -2px;
    width: 2px;
    height: 12px;
    background: var(--color-text-primary);
    transform: translateX(-1px);
  }

  &__bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }

  &__risk {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;

    &--safe {
      background: rgba(100, 116, 139, 0.15);
      color: var(--color-text-muted);
    }
    &--near-tp {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    &--near-sl {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    &--triggered-tp {
      background: rgba(16, 185, 129, 0.25);
      color: #10b981;
    }
    &--triggered-sl {
      background: rgba(239, 68, 68, 0.25);
      color: #ef4444;
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
}

.mono {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-variant-numeric: tabular-nums;
}

.text-right {
  text-align: right;
}

.text-up {
  color: var(--color-up);
}
.text-down {
  color: var(--color-down);
}
.text-muted {
  color: var(--color-text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
