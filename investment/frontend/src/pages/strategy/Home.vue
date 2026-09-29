<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useStrategyData } from '@/features/strategy/composables/useStrategyData'
import { CONDITION_LABELS } from '@/types/strategy'

const router = useRouter()
const { strategies, loading, error, fetchAll, toggle, remove } = useStrategyData()

const hintId = ref('')

onMounted(fetchAll)

function conditionSummary(conditions: { type: string }[]) {
  return conditions
    .map((c) => CONDITION_LABELS[c.type as keyof typeof CONDITION_LABELS] ?? c.type)
    .join('、')
}

function goToDetail(id: string) {
  router.push(`/scanner/strategy/${id}`)
}

function goToEdit(id: string) {
  router.push(`/scanner/strategy/${id}/edit`)
}

async function onDelete(id: string) {
  if (!confirm('確定要刪除此策略？')) return
  await remove(id)
}
</script>

<template>
  <div class="strategy-list">
    <div v-if="error" class="strategy-list__error">{{ error }}</div>

    <EmptyState v-if="!loading && !strategies.length" :loading="false" message="尚無策略，點擊「建立策略」開始" />
    <EmptyState v-else-if="loading && !strategies.length" :loading="true" message="載入中..." />

    <div v-else class="strategy-list__grid">
      <div
        v-for="s in strategies"
        :key="s.id"
        class="strategy-card"
        :class="{ 'strategy-card--disabled': !s.enabled }"
        @click="goToDetail(s.id)"
      >
        <div class="strategy-card__header">
          <span class="strategy-card__name">{{ s.name }}</span>
          <button
            class="strategy-card__toggle"
            :class="{ 'strategy-card__toggle--on': s.enabled }"
            :title="s.enabled ? '停用' : '啟用'"
            @click.stop="toggle(s.id)"
          >
            {{ s.enabled ? 'ON' : 'OFF' }}
          </button>
        </div>

        <div class="strategy-card__desc" v-if="s.description">{{ s.description }}</div>

        <div class="strategy-card__targets" v-if="s.targets.length">
          <span v-for="code in s.targets.slice(0, 5)" :key="code" class="strategy-card__stock-tag">
            {{ code }}
          </span>
          <span v-if="s.targets.length > 5" class="strategy-card__more">
            +{{ s.targets.length - 5 }}
          </span>
        </div>
        <div v-else class="strategy-card__targets">
          <span class="strategy-card__all-tag">全市場</span>
        </div>

        <div class="strategy-card__conditions">
          <span class="strategy-card__logic-badge">{{ s.logic }}</span>
          {{ conditionSummary(s.conditions) }}
        </div>

        <div class="strategy-card__footer">
          <span class="strategy-card__stat">
            觸發 {{ s.trigger_count }} 次
            <span
              class="strategy-card__stat-hint"
              @mouseenter="hintId = s.id"
              @mouseleave="hintId = ''"
            >
              ?
              <Transition name="hint-fade">
                <span v-if="hintId === s.id" class="strategy-card__stat-tooltip">
                  策略啟用後，當目標股票滿足所有條件時累計的通知次數
                </span>
              </Transition>
            </span>
          </span>
          <div class="strategy-card__actions" @click.stop>
            <button class="strategy-card__action-btn" @click="goToEdit(s.id)">編輯</button>
            <button class="strategy-card__action-btn strategy-card__action-btn--danger" @click="onDelete(s.id)">刪除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.strategy-list {
  &__error {
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: var(--radius-md);
    background: var(--color-down-soft);
    color: var(--color-down);
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--gap-md);
  }
}

.strategy-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--duration-fast);

  &:hover {
    border-color: var(--color-border-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &--disabled {
    opacity: 0.55;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__toggle {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: var(--font-size-xs);
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all var(--duration-fast);
    background: var(--color-bg-hover);
    color: var(--color-text-muted);

    &--on {
      background: var(--color-up-soft);
      color: var(--color-up);
    }
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  &__targets {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__stock-tag {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__all-tag {
    font-size: var(--font-size-xs);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--color-bg-hover);
    color: var(--color-text-muted);
  }

  &__more {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    padding: 1px 4px;
  }

  &__conditions {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  &__logic-badge {
    display: inline-block;
    padding: 0 5px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 700;
    background: var(--color-bg-hover);
    color: var(--color-text-secondary);
    margin-right: 4px;
    vertical-align: middle;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--gap-sm);
    border-top: 1px solid var(--color-border);
  }

  &__stat {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__stat-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    margin-left: 4px;
    border-radius: 50%;
    border: 1px solid var(--color-text-muted);
    font-size: 10px;
    color: var(--color-text-muted);
    cursor: default;
    position: relative;
    vertical-align: middle;
    line-height: 1;
  }

  &__stat-tooltip {
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

  &__actions {
    display: flex;
    gap: var(--gap-sm);
  }

  &__action-btn {
    font-size: var(--font-size-sm);
    padding: 3px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast);

    &:hover {
      color: var(--color-text-primary);
      border-color: var(--color-text-muted);
    }

    &--danger:hover {
      color: var(--color-down);
      border-color: var(--color-down);
      background: var(--color-down-soft);
    }
  }
}

</style>
