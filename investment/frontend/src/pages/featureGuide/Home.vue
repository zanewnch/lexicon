<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
import FeatureGuideList from '@/features/featureGuide/components/FeatureGuideList.vue'
import FeatureGuideDetail from '@/features/featureGuide/components/FeatureGuideDetail.vue'
import { useFeatureGuide } from '@/features/featureGuide/composables/useFeatureGuide'

const { activeModuleId, activeModule, searchQuery, filteredModules } = useFeatureGuide()
</script>

<template>
  <div class="feature-guide">
    <PageHeader title="功能介紹" subtitle="了解每個模組的職責與使用方式" />

    <div class="feature-guide__search-wrap">
      <input
        v-model="searchQuery"
        class="feature-guide__search"
        type="text"
        placeholder="搜尋模組或功能..."
      />
    </div>

    <div class="feature-guide__body">
      <FeatureGuideList
        :modules="filteredModules"
        :active-id="activeModuleId"
        @select="activeModuleId = $event"
      />
      <FeatureGuideDetail :module="activeModule" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.feature-guide {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &__search-wrap {
    margin-bottom: var(--gap-md);
  }

  &__search {
    width: 100%;
    max-width: 360px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color var(--duration-fast);

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 200px 1fr;
    flex: 1;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
  }
}
</style>
