<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

export interface TabItem {
  key: string
  label: string
  icon?: string
}

const props = withDefaults(defineProps<{
  tabs: TabItem[]
  modelValue: string
  variant?: 'underline' | 'pill' | 'segment'
  mb?: string
  gap?: string
  padding?: string
  tabPadding?: string
  fontSize?: string
  activeBg?: string
  activeColor?: string
}>(), {
  variant: 'underline',
  mb: 'var(--gap-lg)',
  gap: 'var(--gap-xs)',
  padding: '0',
  tabPadding: '10px 20px',
  fontSize: 'var(--font-size-base)',
  activeBg: '',
  activeColor: '',
})

const emit = defineEmits<{
  'update:modelValue': [key: string]
}>()

const tabRefs = ref<HTMLElement[]>([])
const indicatorStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: '0' })
const isReady = ref(false)

const updateIndicator = async () => {
  await nextTick()
  const index = props.tabs.findIndex(t => t.key === props.modelValue)
  if (index >= 0 && tabRefs.value[index]) {
    const el = tabRefs.value[index]
    indicatorStyle.value = {
      width: `${el.offsetWidth}px`,
      transform: `translateX(${el.offsetLeft}px)`,
      opacity: '1'
    }
  } else {
    indicatorStyle.value.opacity = '0'
  }
}

watch(() => props.modelValue, updateIndicator)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // Give it a tiny delay for reliable width measurement on first mount
  setTimeout(() => {
    updateIndicator()
    isReady.value = true
  }, 50)

  resizeObserver = new ResizeObserver(() => {
    updateIndicator()
  })
  if (tabRefs.value.length > 0) {
    tabRefs.value.forEach(el => el && resizeObserver?.observe(el))
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="tab-bar" :class="`tab-bar--${variant}`"
    :style="{ '--tab-active-bg': activeBg || undefined, '--tab-active-color': activeColor || undefined }">
    <!-- Magic Pill Indicator -->
    <div v-if="['pill', 'segment', 'underline'].includes(variant) && isReady" class="tab-bar__indicator"
      :class="`tab-bar__indicator--${variant}`" :style="indicatorStyle"></div>

    <button v-for="(tab, idx) in tabs" :key="tab.key" ref="tabRefs" class="tab-bar__tab"
      :class="{ 'tab-bar__tab--active': modelValue === tab.key }" @click="emit('update:modelValue', tab.key)">
      <span v-if="tab.icon" class="tab-bar__icon">{{ tab.icon }}</span>
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.tab-bar {
  display: flex;
  position: relative;
  gap: v-bind(gap);
  margin-bottom: v-bind(mb);
  padding: v-bind(padding);

  &__indicator {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: var(--radius-sm);
    transition: transform 0.4s var(--ease-spring), width 0.3s var(--ease-spring), opacity 0.2s;
    pointer-events: none;
    z-index: 0;

    &--pill {
      background: var(--tab-active-bg, var(--color-accent-soft));
    }

    &--segment {
      background: var(--tab-active-bg, var(--color-bg-card));
      box-shadow: var(--shadow-card);
      border-radius: var(--radius-sm);
      height: calc(100% - 6px);
      top: 3px; // match segment padding
    }

    &--underline {
      height: 2px;
      top: auto;
      bottom: -1px;
      border-radius: 2px 2px 0 0;
      background: var(--color-accent);
    }
  }

  &__tab {
    padding: v-bind(tabPadding);
    font-size: v-bind(fontSize);
    font-weight: 500;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color var(--duration-fast), transform 0.2s var(--ease-spring);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 1;

    &:active {
      transform: scale(0.96);
    }
  }

  &__icon {
    font-style: normal;
  }

  // ---- Underline variant (default) ----
  &--underline {
    border-bottom: 1px solid var(--color-border);

    .tab-bar__tab {
      color: var(--color-text-secondary);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;

      &:hover {
        color: var(--color-text-primary);
      }

      &--active {
        color: var(--color-accent);
        font-weight: 600;
        // Indicator handles the actual underline now
      }
    }
  }

  // ---- Pill variant ----
  &--pill {
    flex-wrap: wrap;

    .tab-bar__indicator--pill {
      background: var(--tab-active-bg, var(--color-accent-soft));
    }

    .tab-bar__tab {
      color: var(--color-text-muted);
      border-radius: var(--radius-sm);

      &:hover:not(.tab-bar__tab--active) {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      &--active {
        color: var(--tab-active-color, var(--color-accent));
        font-weight: 600;
        // Background is handled by indicator
        background: transparent;
      }
    }
  }

  // ---- Segment variant ----
  &--segment {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    padding: 3px;

    .tab-bar__tab {
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);

      &:hover:not(.tab-bar__tab--active) {
        color: var(--color-text-primary);
      }

      &--active {
        color: var(--tab-active-color, var(--color-text-primary));
        font-weight: 600;
        // Box shadow and background handled by indicator
        background: transparent;
      }
    }
  }
}
</style>
