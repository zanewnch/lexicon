<script setup lang="ts">
/**
 * HeaderMarketStatus — 頂欄市場交易時段顯示元件
 *
 * 利用 `useMarketStatus()` composable，每秒更新一次，顯示：
 * - 目前交易階段標簽（盤前 / 開盤中 / 盤後 / 休市）
 * - 倒數計時器（距下一個事件的剩餘時間）
 * - 下一個事件描述（如「13:30 收盤」）
 *
 * 滑鼠移入時顯示完整交易時表浮層小視窗。
 * 目前為開盤時圓點顯示脈輝動畫。
 */
import { ref } from 'vue'
import { useMarketStatus } from '@/features/market/composables/useMarketStatus'

const showSchedule = ref(false)
const { status: marketStatus, isOpen: marketIsOpen } = useMarketStatus()
</script>

<template>
  <div class="market-status" :class="{
    'market-status--open': marketStatus.phase === 'trading',
    'market-status--pre': marketStatus.phase === 'pre-market',
    'market-status--after': marketStatus.phase === 'after-hours',
    'market-status--closed': marketStatus.phase === 'closed',
  }" @mouseenter="showSchedule = true" @mouseleave="showSchedule = false">
    <span class="market-status__dot" :class="{ 'market-status__dot--pulse': marketIsOpen }"></span>
    <span class="market-status__text">{{ marketStatus.label }}</span>
    <span class="market-status__countdown">{{ marketStatus.countdown }}</span>
    <span class="market-status__next">{{ marketStatus.nextEvent }}</span>

    <Transition name="schedule-fade">
      <div v-if="showSchedule" class="market-status__schedule">
        <div class="market-status__schedule-title">台股交易時段</div>
        <table class="market-status__schedule-table">
          <tbody>
            <tr :class="{ 'market-status__schedule-row--active': marketStatus.phase === 'pre-market' }">
              <td class="market-status__schedule-time">08:30 – 09:00</td>
              <td class="market-status__schedule-name">盤前試撮</td>
              <td class="market-status__schedule-desc">揭示參考價，不成交</td>
            </tr>
            <tr :class="{ 'market-status__schedule-row--active': marketStatus.phase === 'trading' }">
              <td class="market-status__schedule-time">09:00 – 13:25</td>
              <td class="market-status__schedule-name">盤中交易</td>
              <td class="market-status__schedule-desc">逐筆撮合，即時成交</td>
            </tr>
            <tr>
              <td class="market-status__schedule-time">13:25 – 13:30</td>
              <td class="market-status__schedule-name">收盤撮合</td>
              <td class="market-status__schedule-desc">集合競價，決定收盤價</td>
            </tr>
            <tr :class="{ 'market-status__schedule-row--active': marketStatus.phase === 'after-hours' }">
              <td class="market-status__schedule-time">14:00 – 14:30</td>
              <td class="market-status__schedule-name">盤後定價</td>
              <td class="market-status__schedule-desc">以收盤價成交</td>
            </tr>
          </tbody>
        </table>
        <div class="market-status__schedule-footer">
          週一至週五（國定假日除外）
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.market-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  transition: background var(--duration-normal) var(--ease-default);
  position: relative;
  cursor: default;

  &--open {
    background: var(--color-up-soft);

    .market-status__dot {
      background: var(--color-up);
    }

    .market-status__text,
    .market-status__countdown {
      color: var(--color-up);
    }
  }

  &--pre {
    background: var(--color-warn-soft);

    .market-status__dot {
      background: var(--color-warn);
    }

    .market-status__text,
    .market-status__countdown {
      color: var(--color-warn);
    }
  }

  &--after {
    background: var(--color-accent-soft);

    .market-status__dot {
      background: var(--color-accent);
    }

    .market-status__text,
    .market-status__countdown {
      color: var(--color-accent);
    }
  }

  &--closed {
    background: var(--color-bg-hover);

    .market-status__dot {
      background: var(--color-text-muted);
    }

    .market-status__text,
    .market-status__countdown {
      color: var(--color-text-muted);
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--pulse {
      animation: pulse 2s infinite;
    }
  }

  &__text {
    font-weight: 500;
    white-space: nowrap;
  }

  &__countdown {
    font-size: var(--font-size-base);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  &__next {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__schedule {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 300;
    width: 380px;
    padding: 16px 20px;
    border-radius: var(--radius-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 24px;
      width: 12px;
      height: 12px;
      background: var(--color-bg-secondary);
      border-top: 1px solid var(--color-border);
      border-left: 1px solid var(--color-border);
      transform: rotate(45deg);
    }
  }

  &__schedule-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }

  &__schedule-table {
    width: 100%;
    border-collapse: collapse;

    tr {
      border-bottom: 1px solid var(--color-border);

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 8px 0;
      font-size: 13px;
      color: var(--color-text-secondary);
      vertical-align: middle;
    }
  }

  &__schedule-time {
    font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: var(--font-size-sm) !important;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary) !important;
    white-space: nowrap;
    padding-right: 12px !important;
  }

  &__schedule-name {
    font-weight: 600;
    color: var(--color-text-primary) !important;
    white-space: nowrap;
    padding-right: 12px !important;
  }

  &__schedule-desc {
    font-size: var(--font-size-sm) !important;
    color: var(--color-text-muted) !important;
  }

  &__schedule-row--active {
    td {
      color: var(--color-accent) !important;
    }

    .market-status__schedule-time,
    .market-status__schedule-name {
      color: var(--color-accent) !important;
    }

    .market-status__schedule-desc {
      color: var(--color-accent) !important;
      opacity: 0.8;
    }
  }

  &__schedule-footer {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-align: center;
  }
}

.schedule-fade-enter-active,
.schedule-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default), transform var(--duration-fast) var(--ease-default);
}

.schedule-fade-enter-from,
.schedule-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

// Responsive breakpoints
@media (max-width: 1024px) {
  .market-status__next {
    display: none;
  }
}

@media (max-width: 768px) {
  .market-status {
    padding: 6px 8px;
    font-size: 12px;

    &__countdown {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .market-status {
    gap: 4px;

    &__text {
      display: none;
    }
  }
}
</style>
