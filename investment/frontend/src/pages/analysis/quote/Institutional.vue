<script setup lang="ts">
import { inject } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import DummyBadge from '@/components/ui/DummyBadge.vue'
import { formatSign, formatPercent } from '@/utils/formatters'

const marketData = inject<any>('marketData')!
const { institutional, sectorQuotes, isDummy } = marketData
</script>

<template>
  <div class="inst-view">
    <!-- 法人買賣超 -->
    <Card class="inst-view__panel">
      <h2 class="inst-view__section-title">
        法人買賣超
        <HelpTip text="三大法人（外資、投信、自營商）的買賣超張數。正數代表買超（看多），負數代表賣超（看空）。法人動向常被視為重要參考指標。" />
        <DummyBadge :show="isDummy" />
      </h2>
      <div class="inst-view__table-wrap">
        <table class="inst-view__table">
          <thead>
            <tr>
              <th>日期</th>
              <th class="inst-view__table-right">外資</th>
              <th class="inst-view__table-right">投信</th>
              <th class="inst-view__table-right">自營商</th>
              <th class="inst-view__table-right">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in institutional" :key="d.date">
              <td class="text-muted">{{ d.date }}</td>
              <td class="inst-view__table-right" :class="d.foreign >= 0 ? 'text-up' : 'text-down'">
                {{ formatSign(d.foreign) }}
              </td>
              <td class="inst-view__table-right" :class="d.trust >= 0 ? 'text-up' : 'text-down'">
                {{ formatSign(d.trust) }}
              </td>
              <td class="inst-view__table-right" :class="d.dealer >= 0 ? 'text-up' : 'text-down'">
                {{ formatSign(d.dealer) }}
              </td>
              <td
                class="inst-view__table-right"
                :class="d.foreign + d.trust + d.dealer >= 0 ? 'text-up' : 'text-down'"
              >
                {{ formatSign(d.foreign + d.trust + d.dealer) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!institutional.length" class="text-muted">目前沒有可顯示的法人資料</p>
    </Card>

    <!-- 類股行情 -->
    <Card class="inst-view__panel">
      <h2 class="inst-view__section-title">
        類股行情
        <HelpTip text="各產業類股的今日表現，可快速掌握資金流向與市場熱點。" />
        <DummyBadge :show="isDummy" />
      </h2>
      <div class="inst-view__sectors">
        <p v-if="!sectorQuotes.length" class="text-muted">目前沒有可顯示的類股資料</p>
        <div v-for="sector in sectorQuotes" :key="sector.name" class="inst-view__sector-item">
          <div class="inst-view__sector-header">
            <span class="inst-view__sector-name">{{ sector.name }}</span>
            <span
              class="inst-view__sector-change"
              :class="sector.up ? 'text-up' : 'text-down'"
            >
              {{ formatPercent(sector.change) }}
            </span>
          </div>
          <div class="inst-view__sector-stocks text-muted">
            {{ sector.stocks.join('、') }}
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.inst-view {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  overflow: hidden;

  &__panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  &__table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
      position: sticky;
      top: 0;
      background: var(--color-bg-card);
    }

    td {
      padding: 10px 12px;
      font-variant-numeric: tabular-nums;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
      font-size: 13px;
    }

    tbody tr {
      transition: background 0.15s;

      &:hover {
        background: var(--color-bg-hover);
      }

      &:last-child td {
        border-bottom: none;
      }
    }
  }

  &__table-right {
    text-align: right;
  }

  &__sectors {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__sector-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-child {
      padding-top: 0;
    }

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__sector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__sector-name {
    font-weight: 500;
    font-size: 14px;
  }

  &__sector-change {
    font-weight: 600;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  &__sector-stocks {
    font-size: 12px;
  }
}

@media (max-width: 900px) {
  .inst-view {
    height: auto;
    overflow: visible;
  }
}
</style>
