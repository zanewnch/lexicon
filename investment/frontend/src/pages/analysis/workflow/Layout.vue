<script setup lang="ts">
/**
 * WorkflowView — 操盤 Workflow 頁面容器
 *
 * 操盤流程的主容器，包含六個子頁面 Tab：
 * 1. 賽道漏斗（WorkflowFunnel）—類股選取 + 基本面筛選
 * 2. 財務筛選（WorkflowFundamental）—手動輸入財務指標分析
 * 3. 看板（WorkflowKanban）—拖曳式股票狀態瞎棣管理
 * 4. SOP 清單（WorkflowChecklist）—下單前/後検查清單
 * 5. 交易日誌（WorkflowJournal）—記錄买賣轉成情形
 * 6. 每月復盤（WorkflowReview）—每月績效複盤與分析
 *
 * 透過 `provide('tradeRecords')` 將交易日誌資料共享至
 * `WorkflowJournal` 和 `WorkflowReview` 兩個子頁面。
 * 日誌資料持久化至 `localStorage`。
 */
import { ref, provide, onMounted, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import type { TradeRecord } from '@/types/workflow'

const TABS = [
  { path: '/analysis/workflow', label: '賽道漏斗' },
  { path: '/analysis/workflow/fundamental', label: '財務篩選' },
  { path: '/analysis/workflow/kanban', label: '看板' },
  { path: '/analysis/workflow/checklist', label: 'SOP 清單' },
  { path: '/analysis/workflow/journal', label: '交易日誌' },
  { path: '/analysis/workflow/review', label: '每月復盤' },
]

// Shared trade records (provided to Journal + Review)
const tradeRecords = ref<TradeRecord[]>([])
const JOURNAL_KEY = 'workflow-journal'

onMounted(() => {
  const saved = localStorage.getItem(JOURNAL_KEY)
  if (saved) {
    try { tradeRecords.value = JSON.parse(saved) } catch {}
  }
})

watch(tradeRecords, (v) => {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(v))
}, { deep: true })

provide('tradeRecords', tradeRecords)
</script>

<template>
  <div class="workflow">
    <!-- Header -->
    <PageHeader
      title="操盤 Workflow"
      padding="0 20px"
      mb="0"
      align="center"
      title-size="15px"
      border="1px solid var(--color-border)"
      bg="var(--color-bg-secondary)"
      height="52px"
      flex-shrink="0"
    >
      <template #actions>
        <div class="workflow__tabs">
          <RouterLink
            v-for="tab in TABS"
            :key="tab.path"
            :to="tab.path"
            class="workflow__tab"
            active-class="workflow__tab--active"
          >
            {{ tab.label }}
          </RouterLink>
        </div>
      </template>
    </PageHeader>

    <!-- Content -->
    <div class="workflow__content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped lang="scss">
.workflow {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - 48px);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  &__tabs {
    display: flex;
    gap: 2px;
    align-items: center;
    height: 100%;
  }

  &__tab {
    height: 100%;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-bg-hover);
    }

    &--active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
      font-weight: 600;
    }
  }

  &__content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
</style>
