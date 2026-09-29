<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useStrategyData } from '@/features/strategy/composables/useStrategyData'
import { CONDITION_LABELS, CONDITION_PARAMS } from '@/types/strategy'

const route = useRoute()
const router = useRouter()
const { current, loading, error, fetchOne, toggle, remove } = useStrategyData()

const id = route.params.id as string

const showTriggerHint = ref(false)

onMounted(() => fetchOne(id))

function paramLabel(condType: string, key: string, value: number | string) {
  const defs = CONDITION_PARAMS[condType as keyof typeof CONDITION_PARAMS]
  if (!defs) return `${key}: ${value}`
  const def = defs.find((d) => d.key === key)
  if (!def) return `${key}: ${value}`
  if (def.options) {
    const opt = def.options.find((o) => String(o.value) === String(value))
    return `${def.label}: ${opt?.label ?? value}`
  }
  return `${def.label}: ${value}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW')
}

async function onToggle() {
  if (!current.value) return
  await toggle(current.value.id)
  await fetchOne(id)
}

async function onDelete() {
  if (!confirm('確定要刪除此策略？')) return
  await remove(id)
  router.push('/strategy')
}
</script>

<template>
  <div class="strategy-detail">
    <EmptyState v-if="loading && !current" :loading="true" message="載入中..." />
    <EmptyState v-else-if="!current" :loading="false" message="找不到此策略" />

    <template v-else>
      <div class="strategy-detail__top">
        <div class="strategy-detail__title-row">
          <h2 class="strategy-detail__name">{{ current.name }}</h2>
          <span
            class="strategy-detail__status"
            :class="current.enabled ? 'strategy-detail__status--on' : 'strategy-detail__status--off'"
          >
            {{ current.enabled ? '啟用中' : '已停用' }}
          </span>
        </div>
        <p class="strategy-detail__desc" v-if="current.description">{{ current.description }}</p>
      </div>

      <!-- 目標股票 -->
      <section class="strategy-detail__section">
        <h3 class="strategy-detail__section-title">目標股票</h3>
        <div class="strategy-detail__targets" v-if="current.targets.length">
          <span v-for="code in current.targets" :key="code" class="strategy-detail__stock-tag">{{ code }}</span>
        </div>
        <span v-else class="strategy-detail__all-tag">全市場掃描</span>
      </section>

      <!-- 觸發條件 -->
      <section class="strategy-detail__section">
        <h3 class="strategy-detail__section-title">
          觸發條件
          <span class="strategy-detail__logic-badge">{{ current.logic }}</span>
        </h3>
        <div v-if="!current.conditions.length" class="strategy-detail__empty">未設定條件</div>
        <div v-for="(cond, idx) in current.conditions" :key="idx" class="strategy-detail__condition">
          <span class="strategy-detail__cond-name">{{ CONDITION_LABELS[cond.type as keyof typeof CONDITION_LABELS] ?? cond.type }}</span>
          <div class="strategy-detail__cond-params">
            <span v-for="(val, key) in cond.params" :key="String(key)" class="strategy-detail__param">
              {{ paramLabel(cond.type, String(key), val) }}
            </span>
          </div>
        </div>
      </section>

      <!-- 統計 -->
      <section class="strategy-detail__section">
        <h3 class="strategy-detail__section-title">統計</h3>
        <div class="strategy-detail__stats">
          <div class="strategy-detail__stat">
            <span class="strategy-detail__stat-label">
              觸發次數
              <span
                class="strategy-detail__hint-icon"
                @mouseenter="showTriggerHint = true"
                @mouseleave="showTriggerHint = false"
              >
                ?
                <Transition name="hint-fade">
                  <span v-if="showTriggerHint" class="strategy-detail__hint-tooltip">
                    策略啟用後，當目標股票滿足所有條件時累計的通知次數
                  </span>
                </Transition>
              </span>
            </span>
            <span class="strategy-detail__stat-value">{{ current.trigger_count }}</span>
          </div>
          <div class="strategy-detail__stat">
            <span class="strategy-detail__stat-label">最後觸發</span>
            <span class="strategy-detail__stat-value">{{ formatDate(current.last_triggered_at) }}</span>
          </div>
          <div class="strategy-detail__stat">
            <span class="strategy-detail__stat-label">建立時間</span>
            <span class="strategy-detail__stat-value">{{ formatDate(current.created_at) }}</span>
          </div>
          <div class="strategy-detail__stat">
            <span class="strategy-detail__stat-label">更新時間</span>
            <span class="strategy-detail__stat-value">{{ formatDate(current.updated_at) }}</span>
          </div>
        </div>
      </section>

      <!-- 操作 -->
      <div class="strategy-detail__actions">
        <button class="strategy-detail__btn strategy-detail__btn--accent" @click="router.push(`/strategy/${id}/backtest`)">
          回測分析
        </button>
        <button class="strategy-detail__btn strategy-detail__btn--primary" @click="onToggle">
          {{ current.enabled ? '停用策略' : '啟用策略' }}
        </button>
        <button class="strategy-detail__btn strategy-detail__btn--secondary" @click="router.push(`/strategy/${id}/edit`)">
          編輯
        </button>
        <button class="strategy-detail__btn strategy-detail__btn--danger" @click="onDelete">
          刪除
        </button>
        <button class="strategy-detail__btn strategy-detail__btn--secondary" @click="router.push('/strategy')">
          返回列表
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.strategy-detail {
  max-width: 720px;

  &__top {
    margin-bottom: 20px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__name {
    font-size: 22px;
    font-weight: 700;
  }

  &__status {
    font-size: var(--font-size-xs);
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 12px;

    &--on {
      background: var(--color-up-soft);
      color: var(--color-up);
    }

    &--off {
      background: var(--color-bg-hover);
      color: var(--color-text-muted);
    }
  }

  &__desc {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__section {
    margin-bottom: var(--gap-md);
    padding: 16px 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  &__targets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__stock-tag {
    font-size: var(--font-size-sm);
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__all-tag {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  &__logic-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-bg-hover);
    color: var(--color-text-secondary);
  }

  &__empty {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  &__condition {
    padding: 10px 12px;
    margin-bottom: 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-primary);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__cond-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent);
    display: block;
    margin-bottom: 4px;
  }

  &__cond-params {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__param {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-md);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__hint-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid var(--color-text-muted);
    font-size: 9px;
    color: var(--color-text-muted);
    cursor: default;
    position: relative;
    line-height: 1;
  }

  &__hint-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    font-size: var(--font-size-sm);
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-secondary);
    pointer-events: none;
    white-space: normal;
    text-align: center;

    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 10px;
      height: 10px;
      background: var(--color-bg-secondary);
      border-right: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
  }

  &__stat-value {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__btn {
    padding: var(--btn-padding-md);
    border-radius: var(--radius-md);
    font-size: var(--btn-font-md);
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--duration-fast);

    &--accent {
      background: linear-gradient(135deg, var(--color-accent), #6366f1);
      color: #fff;

      &:hover {
        filter: brightness(1.1);
      }
    }

    &--primary {
      background: var(--color-accent);
      color: #fff;

      &:hover {
        filter: brightness(1.1);
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

    &--danger {
      background: var(--color-down-soft);
      color: var(--color-down);

      &:hover {
        filter: brightness(1.1);
      }
    }
  }
}

</style>
