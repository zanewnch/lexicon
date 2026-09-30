<script setup lang="ts">
const links = [
  { label: '翻譯', path: '/english/translate' }, { label: '今日學習', path: '/english/learn' },
  { label: 'YouTube', path: '/english/youtube' }, { label: '雅思練習', path: '/english/ielts' },
  { label: '搜尋紀錄', path: '/english/history' }, { label: '英文新聞', path: '/english/news' },
  { label: '市場快訊', path: '/analysis/news' }, { label: '筆記專區', path: '/analysis/notes' },
  { label: '策略庫', path: '/strategy' }, { label: '出場管理', path: '/trading/exiter' },
  { label: '帳務記錄', path: '/trading/bookkeeper' }, { label: '設定', path: '/settings' },
]
</script>
<template><section class="more"><h1>Unus 功能</h1><nav class="more__links"><RouterLink v-for="link in links" :key="link.path" :to="link.path">{{ link.label }}</RouterLink></nav></section></template>
<style scoped lang="scss">.more { &__links { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 24px; a { padding: 16px; border-radius: var(--radius-md); color: var(--color-text-primary); background: var(--color-bg-card); border: 1px solid var(--color-border); } } }</style>
