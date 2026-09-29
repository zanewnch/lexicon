<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { featureGuideMap } from '@/data/featureGuide'
import FeatureGuideDetail from '@/features/featureGuide/components/FeatureGuideDetail.vue'

const props = defineProps<{ moduleId: string }>()

const open = ref(false)
const module = featureGuideMap[props.moduleId]

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <button v-if="module" class="pgb" title="功能說明" @click="open = true">?</button>

  <Teleport to="body">
    <Transition name="pgb-drawer">
      <div v-if="open" class="pgb-overlay" @click.self="open = false">
        <div class="pgb-drawer">
          <div class="pgb-drawer__header">
            <span class="pgb-drawer__title">功能說明</span>
            <button class="pgb-drawer__close" @click="open = false">✕</button>
          </div>
          <div class="pgb-drawer__body">
            <FeatureGuideDetail v-if="module" :module="module" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.pgb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--duration-fast);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: var(--color-accent-soft);
  }
}

.pgb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
}

.pgb-drawer {
  width: 400px;
  max-width: 90vw;
  height: 100%;
  background: var(--color-bg-base);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--color-text-muted);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
  }
}

.pgb-drawer-enter-active,
.pgb-drawer-leave-active {
  transition: opacity var(--duration-fast);

  .pgb-drawer {
    transition: transform var(--duration-fast);
  }
}

.pgb-drawer-enter-from,
.pgb-drawer-leave-to {
  opacity: 0;

  .pgb-drawer {
    transform: translateX(100%);
  }
}
</style>
