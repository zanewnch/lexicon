<script setup lang="ts">
/**
 * TreeItem — 樹狀目錄節點元件（遞迴）
 *
 * 展示專案目錄樹中的單個節點，支援遞迴子節點。
 * - 目錄：顯示折疊箭頭、點擊展開/收合
 * - 檔案：依副檔名顯示對應 emoji 圖標
 *
 * 透過 `emit('toggle', path)` 通知父元件處理展開狀態，
 * 實際展開狀態由父層 `StructureView` 的 `expanded` Set 統一管理。
 */
interface TreeNode {
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

defineProps<{
  node: TreeNode
  path: string
  depth: number
  expanded: Set<string>
}>()

const emit = defineEmits<{
  toggle: [path: string]
}>()

function getIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    vue: '💚', ts: '🔷', js: '🟡', json: '📋', scss: '🎨', css: '🎨',
    md: '📝', py: '🐍', html: '🌐', svg: '🖼', png: '🖼', jpg: '🖼',
    txt: '📄', yml: '⚙', yaml: '⚙', toml: '⚙', lock: '🔒', gitignore: '🙈',
  }
  return map[ext] ?? '📄'
}
</script>

<template>
  <li class="tree-item">
    <div
      class="tree-item__row"
      :style="{ paddingLeft: (depth * 20 + 12) + 'px' }"
      :class="{ 'tree-item__row--dir': node.type === 'directory' }"
      @click="node.type === 'directory' && emit('toggle', path)"
    >
      <span v-if="node.type === 'directory'" class="tree-item__arrow" :class="{ 'tree-item__arrow--open': expanded.has(path) }">▶</span>
      <span v-if="node.type === 'directory'" class="tree-item__icon">📁</span>
      <span v-else class="tree-item__icon">{{ getIcon(node.name) }}</span>
      <span class="tree-item__name" :class="{ 'tree-item__name--dir': node.type === 'directory' }">{{ node.name }}</span>
      <span v-if="node.type === 'directory' && node.children" class="tree-item__count text-muted">{{ node.children.length }}</span>
    </div>
    <ul v-if="node.type === 'directory' && node.children && expanded.has(path)" class="tree__list">
      <TreeItem
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        :path="path + '/' + child.name"
        :depth="depth + 1"
        :expanded="expanded"
        @toggle="(p: string) => emit('toggle', p)"
      />
    </ul>
  </li>
</template>

<style scoped lang="scss">
.tree-item {
  &__row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    transition: background 0.1s;

    &:hover {
      background: var(--color-bg-hover);
    }

    &--dir {
      cursor: pointer;
    }
  }

  &__arrow {
    font-size: 10px;
    color: var(--color-text-muted);
    transition: transform 0.15s;
    width: 14px;
    text-align: center;
    flex-shrink: 0;

    &--open {
      transform: rotate(90deg);
    }
  }

  &__icon {
    font-size: 14px;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
  }

  &__name {
    color: var(--color-text-secondary);

    &--dir {
      color: var(--color-text-primary);
      font-weight: 600;
    }
  }

  &__count {
    font-size: 11px;
    margin-left: 4px;
  }
}

.tree__list {
  list-style: none;
}
</style>
