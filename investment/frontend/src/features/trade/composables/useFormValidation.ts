import { ref, computed } from 'vue'

/**
 * 通用表單驗證 composable。
 *
 * 接受一個回傳錯誤訊息陣列的驗證函式，
 * 提供統一的 `errors`、`isValid`、`validate`、`clearErrors` 介面。
 *
 * @param validatorFn - 執行驗證並回傳錯誤字串陣列的函式
 * @returns
 * - `errors` — 目前的驗證錯誤清單
 * - `isValid` — 目前是否無錯誤
 * - `validate` — 執行驗證並更新 `errors`；回傳是否通過
 * - `clearErrors` — 清空錯誤清單
 *
 * @example
 * ```ts
 * const { errors, validate, clearErrors } = useFormValidation(() => {
 *   const errs: string[] = []
 *   if (!name.value) errs.push('請輸入名稱')
 *   return errs
 * })
 *
 * function onSubmit() {
 *   if (!validate()) return
 *   // proceed...
 * }
 * ```
 */
export function useFormValidation(validatorFn: () => string[]) {
  const errors = ref<string[]>([])
  const isValid = computed(() => errors.value.length === 0)

  function validate(): boolean {
    errors.value = validatorFn()
    return errors.value.length === 0
  }

  function clearErrors() {
    errors.value = []
  }

  return { errors, isValid, validate, clearErrors }
}
