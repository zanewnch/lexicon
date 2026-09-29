<script setup lang="ts">
/**
 * DummyBadge — 假資料警示標簽
 *
 * 顯示黃色「DEMO」小標簽，提示該區塊目前使用的是占位假資料。
 * - `show` 為 `false` 時完全隱藏（預設 true）
 * - 通常伴隨 `isDummy` 旗標使用
 *
 * @example
 * ```vue
 * <DummyBadge :show="isDummy" />
 * ```
 */
defineProps<{ show?: boolean }>()
</script>

<template>
  <span v-if="show !== false" class="dummy-badge">DEMO</span>
</template>

<style scoped lang="scss">
.dummy-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(251, 191, 36, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(251, 191, 36, 0.3);
  letter-spacing: 0.5px;
  vertical-align: middle;
  margin-left: 6px;
  line-height: 1.6;
}
</style>
