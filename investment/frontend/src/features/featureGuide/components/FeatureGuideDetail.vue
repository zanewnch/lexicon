<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ModuleGuide, UsageContext } from '@/types/featureGuide'
import Card from '@/components/ui/Card.vue'

defineProps<{ module: ModuleGuide }>()

const router = useRouter()

const contextColors: Record<UsageContext, string> = {
  '選股階段': '#8b5cf6',
  '進場前': '#ef4444',
  '持倉中': '#f97316',
  '出場時': '#ec4899',
  '事後複盤': '#14b8a6',
  '日常輔助': '#6366f1',
}
</script>

<template>
  <div class="fg-detail">
    <div class="fg-detail__hero">
      <div class="fg-detail__title-row">
        <span class="fg-detail__dot" :style="{ background: module.iconColor }" />
        <h2 class="fg-detail__title">{{ module.label }}</h2>
      </div>
      <p class="fg-detail__subtitle">{{ module.subtitle }}</p>
      <div class="fg-detail__contexts">
        <span
          v-for="ctx in module.contexts"
          :key="ctx"
          class="fg-detail__badge"
          :style="{ background: contextColors[ctx] + '22', color: contextColors[ctx], borderColor: contextColors[ctx] + '44' }"
        >{{ ctx }}</span>
      </div>
      <p class="fg-detail__summary">{{ module.summary }}</p>
    </div>

    <div class="fg-detail__section">
      <h3 class="fg-detail__section-title">何時使用</h3>
      <ul class="fg-detail__when-list">
        <li v-for="(item, i) in module.whenToUse" :key="i" class="fg-detail__when-item">
          {{ item }}
        </li>
      </ul>
    </div>

    <div class="fg-detail__section">
      <h3 class="fg-detail__section-title">功能點</h3>
      <div class="fg-detail__features">
        <Card v-for="feat in module.features" :key="feat.label" class="fg-detail__feature-card">
          <span class="fg-detail__feature-label">{{ feat.label }}</span>
          <span v-if="feat.detail" class="fg-detail__feature-detail">{{ feat.detail }}</span>
        </Card>
      </div>
    </div>

    <div v-if="module.subPages?.length" class="fg-detail__section">
      <h3 class="fg-detail__section-title">子頁面</h3>
      <div class="fg-detail__subpages">
        <Card
          v-for="sub in module.subPages"
          :key="sub.path"
          class="fg-detail__subpage-card"
          @click="router.push(sub.path)"
        >
          <div class="fg-detail__subpage-top">
            <span class="fg-detail__subpage-label">{{ sub.label }}</span>
            <span class="fg-detail__subpage-arrow">→</span>
          </div>
          <span class="fg-detail__subpage-summary">{{ sub.summary }}</span>
        </Card>
      </div>
    </div>

    <div v-if="module.tips?.length" class="fg-detail__section">
      <h3 class="fg-detail__section-title">進階提示</h3>
      <div class="fg-detail__tips">
        <div v-for="(tip, i) in module.tips" :key="i" class="fg-detail__tip">
          <span class="fg-detail__tip-icon">💡</span>
          <span>{{ tip }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fg-detail {
  padding: var(--gap-lg);
  overflow-y: auto;
  height: 100%;

  &__hero {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--color-border);
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary);
  }

  &__subtitle {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0 0 12px 22px;
  }

  &__contexts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    margin-left: 22px;
  }

  &__badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 600;
    border: 1px solid;
  }

  &__summary {
    font-size: 14px;
    line-height: 1.75;
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__section {
    margin-bottom: 28px;
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    margin: 0 0 12px;
  }

  &__when-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__when-item {
    font-size: 13px;
    color: var(--color-text-secondary);
    padding-left: 16px;
    position: relative;
    line-height: 1.6;

    &::before {
      content: '•';
      position: absolute;
      left: 4px;
      color: var(--color-accent);
    }
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--gap-sm);
  }

  &__feature-card {
    padding: 12px 14px;
    transition: border-color var(--duration-fast);

    &:hover {
      border-color: var(--color-accent);
    }
  }

  &__feature-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  &__feature-detail {
    display: block;
    font-size: 12px;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  &__subpages {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--gap-sm);
  }

  &__subpage-card {
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    transition: border-color var(--duration-fast), background var(--duration-fast);
    width: 100%;

    &:hover {
      border-color: var(--color-accent);
      background: var(--color-bg-hover);
    }
  }

  &__subpage-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__subpage-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent);
  }

  &__subpage-arrow {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  &__subpage-summary {
    display: block;
    font-size: 12px;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  &__tips {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__tip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 14px;
    background: var(--color-accent-soft);
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  &__tip-icon {
    flex-shrink: 0;
  }
}
</style>
