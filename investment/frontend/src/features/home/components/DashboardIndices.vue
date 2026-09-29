<script setup lang="ts">
import { ref } from 'vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import Card from '@/components/ui/Card.vue'
import SparkLine from '@/components/ui/SparkLine.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useGlossaryData } from '@/features/featureGuide/composables/useGlossaryData'
import type { MarketIndex } from '@/types/market'

const { indexDescriptionMap } = useGlossaryData()

defineProps<{
  indices: MarketIndex[]
  loading: boolean
}>()

const hoveredIndex = ref<string | null>(null)
</script>

<template>
  <div class="indices">
    <h2 class="indices__title section-title">大盤指數<HelpTip termKey="index.overview" /></h2>
    <template v-if="indices.length">
      <Card
        v-for="idx in indices"
        :key="idx.name"
        class="index-card"
        :class="{
          'index-card--up': idx.up,
          'index-card--down': !idx.up,
          'index-card--hovered': hoveredIndex === idx.name,
        }"
        @mouseenter="hoveredIndex = idx.name"
        @mouseleave="hoveredIndex = null"
      >
        <div class="index-card__header">
          <div class="index-card__info">
            <span class="index-card__name">{{ idx.name }}</span>
            <span class="index-card__value">{{ idx.value }}</span>
            <span class="index-card__change" :class="idx.up ? 'text-up' : 'text-down'">
              {{ idx.up ? '▲' : '▼' }} {{ idx.change }} ({{ idx.percent }})
            </span>
          </div>
          <div class="index-card__indicator" :class="idx.up ? 'index-card__indicator--up' : 'index-card__indicator--down'">
            {{ idx.up ? '▲' : '▼' }}
          </div>
        </div>
        <SparkLine
          :data="idx.spark"
          :labels="idx.spark.map((_: number, i: number) => `${9 + Math.floor(i * 270 / idx.spark.length / 60)}:${String((i * 270 / idx.spark.length % 60)).padStart(2, '0').slice(0, 2)}`)"
          :color="idx.up ? '#22c55e' : '#ef4444'"
          :height="52"
        />
        <div class="index-card__detail">
          <p class="index-card__desc">{{ indexDescriptionMap[idx.name] }}</p>
        </div>
      </Card>
    </template>
    <Card v-else class="indices__empty">
      <EmptyState :loading="loading" message="目前無法取得指數資料，請稍後再試" />
    </Card>
  </div>
</template>

<style scoped lang="scss">
.indices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-md);

  &__title {
    grid-column: 1 / -1;
  }

  &__empty {
    grid-column: 1 / -1;
  }
}

.index-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-left: 3px solid transparent;
  position: relative;
  overflow: hidden;
  transition: transform 0.35s var(--ease-smooth),
    box-shadow 0.35s var(--ease-smooth),
    border-color 0.35s var(--ease-smooth);

  // Subtle gradient overlay on hover
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.35s var(--ease-smooth);
    pointer-events: none;
    border-radius: inherit;
  }

  &--up {
    border-left-color: var(--color-up);

    &::before {
      background: linear-gradient(135deg, var(--color-up-soft) 0%, transparent 60%);
    }
  }

  &--down {
    border-left-color: var(--color-down);

    &::before {
      background: linear-gradient(135deg, var(--color-down-soft) 0%, transparent 60%);
    }
  }

  &:hover {
    transform: translateY(-4px) scale(1.01);

    &::before {
      opacity: 1;
    }
  }

  &--up:hover {
    box-shadow: var(--shadow-md), 0 4px 24px var(--glow-up);
    border-left-color: var(--color-up);
  }

  &--down:hover {
    box-shadow: var(--shadow-md), 0 4px 24px var(--glow-down);
    border-left-color: var(--color-down);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: 28px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  &__change {
    font-size: var(--font-size-sm);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }

  &__indicator {
    font-size: 20px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.3s var(--ease-smooth), transform 0.3s var(--ease-spring);

    &--up {
      color: var(--color-up);
    }

    &--down {
      color: var(--color-down);
    }
  }

  &:hover &__indicator {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }

  &__detail {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.35s var(--ease-smooth),
      opacity 0.35s var(--ease-smooth),
      padding-top 0.35s var(--ease-smooth);
    padding-top: 0;
    position: relative;
    z-index: 1;
  }

  &:hover &__detail {
    max-height: 60px;
    opacity: 1;
    padding-top: 8px;
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.5;
    margin: 0;
  }
}
</style>
