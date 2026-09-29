<script setup lang="ts">
/**
 * GuideView — 教學指南頁（詞彙字典）
 *
 * 顯示所有投資術語的字典，支援：
 * - 關鍵字搜尋（鳴配術語或說明）
 * - 類別筛選（捘0從 `useGlossary()` 取得分類清單）
 * - 點擊類別按鈕可切換 / 取消選取
 *
 * 資料來源：`@/data/glossary`，所有術語已预先禾入，無需 API。
 */
import { ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import Card from '@/components/ui/Card.vue'
import { useGlossary } from '@/features/featureGuide/composables/useGlossary'
import { useGlossaryData } from '@/features/featureGuide/composables/useGlossaryData'

const { searchQuery, activeCategory, groupedTerms, totalCount, glossaryCategories } = useGlossary()

const loading = ref(true)
useGlossaryData().ready.finally(() => { loading.value = false })

function toggleCategory(name: string) {
  activeCategory.value = activeCategory.value === name ? null : name
}
</script>

<template>
  <div class="guide">
    <PageHeader title="教學指南" :subtitle="`投資術語字典 · 共 ${totalCount} 個詞條`" />

    <div class="guide__toolbar">
      <input
        v-model="searchQuery"
        class="guide__search"
        type="text"
        placeholder="搜尋術語或說明..."
      />
      <div class="guide__chips">
        <button
          v-for="cat in glossaryCategories"
          :key="cat.id"
          class="guide__chip"
          :class="{ 'guide__chip--active': activeCategory === cat.name }"
          @click="toggleCategory(cat.name)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="guide__empty">載入中...</div>

    <div v-else-if="groupedTerms.length" class="guide__groups">
      <section v-for="group in groupedTerms" :key="group.id" class="guide__group">
        <h2 class="guide__group-title">{{ group.name }}</h2>
        <div class="guide__term-list">
          <Card v-for="term in group.terms" :key="term.key" class="guide__term-card">
            <span class="guide__term-name">{{ term.term }}</span>
            <p class="guide__term-desc">{{ term.description }}</p>
            <div v-if="term.example" class="guide__term-example">
              <span class="guide__term-example-label">例</span>
              <span class="guide__term-example-text">{{ term.example }}</span>
            </div>
          </Card>
        </div>
      </section>
    </div>

    <div v-else class="guide__empty">
      沒有符合「{{ searchQuery }}」的結果
    </div>
  </div>
</template>

<style scoped lang="scss">
.guide {
  &__toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
    margin-bottom: var(--gap-lg);
  }

  &__search {
    width: 100%;
    max-width: 480px;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    outline: none;
    transition: border-color var(--duration-fast);

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__chip {
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }
  }

  &__groups {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  &__group-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  &__term-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--gap-sm);
  }

  &__term-card {
    padding: var(--gap-md);
    transition: border-color var(--duration-fast), transform var(--duration-fast);

    &:hover {
      border-color: var(--color-accent);
      transform: translateY(-2px);
    }
  }

  &__term-name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-accent);
    margin-bottom: 8px;
  }

  &__term-desc {
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-secondary);
    margin: 0 0 10px 0;
  }

  &__term-example {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    background: var(--color-bg-hover);
    border-left: 3px solid var(--color-accent);
    border-radius: var(--radius-sm);
    padding: 7px 10px;
  }

  &__term-example-label {
    font-weight: 700;
    font-size: 11px;
    color: var(--color-accent);
    flex-shrink: 0;
    padding-top: 1px;
  }

  &__term-example-text {
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  &__empty {
    padding: 48px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }
}
</style>
