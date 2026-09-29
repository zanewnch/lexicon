<script setup lang="ts">
/**
 * HelpTip — 悬停詞彙說明氣泡元件
 *
 * 顯示一個圆形「?」图標，滑鼠移入時透過 Teleport
 * 在 body 層顯示浮動小幕說明。
 *
 * 支援兩種内容來源：
 * - `termKey` — 從 `glossaryMap` 譞典查詢詞條說明
 * - `text`    — 直接傳入自訂說明文字
 * - `supplement` — 接在原說明後的補充解讀
 *
 * 若兩者均未提供則元件隱藏。
 *
 * @example
 * ```vue
 * <HelpTip termKey="trade.win-rate" />
 * <HelpTip text="自訂說明文字" />
 * ```
 */
import { ref, reactive, computed, nextTick } from 'vue'
import { useGlossaryData } from '@/features/featureGuide/composables/useGlossaryData'

const props = defineProps<{
  text?: string
  termKey?: string
  supplement?: string
}>()

const { glossaryMap } = useGlossaryData()

const description = computed(() => {
  return props.termKey
    ? glossaryMap.value[props.termKey]?.description ?? ''
    : props.text ?? ''
})
const hasContent = computed(() => Boolean(description.value || props.supplement))

const visible = ref(false)
const popup = ref<HTMLElement | null>(null)
const pos = reactive({ x: 0, y: 0, arrowX: 0 })

async function show(e: MouseEvent) {
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  const anchorX = rect.left + rect.width / 2
  pos.x = anchorX
  pos.y = rect.top - 8
  visible.value = true
  await nextTick()
  if (!visible.value || !popup.value) return

  const width = popup.value.getBoundingClientRect().width
  const margin = 12
  const viewportWidth = document.documentElement.clientWidth
  pos.x = Math.min(
    Math.max(anchorX, margin + width / 2),
    viewportWidth - margin - width / 2,
  )
  pos.arrowX = Math.min(Math.max(anchorX - pos.x + width / 2, 10), width - 10)
}

function hide() {
  visible.value = false
}
</script>

<template>
  <span v-show="hasContent" class="help-tip">
    <span class="help-tip__icon" @mouseenter="show" @mouseleave="hide">?</span>
    <Teleport to="body">
      <div
        ref="popup"
        v-show="visible"
        class="help-tip-popup"
        :style="{ left: pos.x + 'px', top: pos.y + 'px', '--help-tip-arrow-x': pos.arrowX + 'px' }"
      >
        <span v-if="description">{{ description }}</span>
        <span v-if="supplement" class="help-tip-popup__supplement">{{ supplement }}</span>
      </div>
    </Teleport>
  </span>
</template>

<style scoped lang="scss">
.help-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  vertical-align: middle;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-bg-hover);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    cursor: help;
    transition: all var(--duration-fast);
    flex-shrink: 0;

    &:hover {
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }
  }
}
</style>

<style lang="scss">
.help-tip-popup {
  position: fixed;
  transform: translate(-50%, -100%);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: var(--font-size-sm);
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-secondary);
  white-space: normal;
  width: max-content;
  max-width: min(280px, calc(100vw - 24px));
  box-sizing: border-box;
  overflow-wrap: anywhere;
  box-shadow: var(--shadow-dropdown);
  pointer-events: none;
  z-index: 9999;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: var(--help-tip-arrow-x);
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--color-border-hover);
  }

  &__supplement {
    display: block;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }
}
</style>
