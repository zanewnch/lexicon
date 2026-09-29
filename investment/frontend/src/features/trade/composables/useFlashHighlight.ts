import { ref, watch, type Ref } from 'vue'

/**
 * 監聽數字 ref，當值發生變化時，短暫閃爍一個 CSS class 來提示漲跌。
 *
 * - 數字**上漲** → 套用 `flash-up` class（通常為綠色）
 * - 數字**下跌** → 套用 `flash-down` class（通常為紅色）
 * - 閃爍持續 `duration` 毫秒後自動清除
 *
 * CSS class 需在 `main.scss` 中定義（`.flash-up` 和 `.flash-down`）。
 *
 * 使用方式：
 * ```vue
 * <script setup>
 * const { flashClass } = useFlashHighlight(price)
 * </script>
 * <template>
 *   <span :class="flashClass">{{ price }}</span>
 * </template>
 * ```
 *
 * @param value    - 要監聽的數字 ref（允許 null / undefined）
 * @param duration - 閃爍持續時間（毫秒），預設 600ms
 * @returns `{ flashClass }` — 目前應套用的 CSS class 名稱（空字串表示無閃爍）
 */
export function useFlashHighlight(value: Ref<number | null | undefined>, duration = 600) {
  /** 目前套用的 CSS class，空字串表示無閃爍狀態 */
  const flashClass = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(value, (newVal, oldVal) => {
    if (newVal == null || oldVal == null) return
    if (newVal === oldVal) return

    if (timer) clearTimeout(timer)
    flashClass.value = newVal > oldVal ? 'flash-up' : 'flash-down'
    timer = setTimeout(() => {
      flashClass.value = ''
    }, duration)
  })

  return { flashClass }
}
