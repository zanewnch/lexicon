<script setup lang="ts">
/**
 * StructureView — 專案檔案結構瀏覽頁面
 *
 * 利用 Vite 虛擬模組 `virtual:project-tree`
 * 在編譯期將整個專案目錄樹結構注入为静態資料。
 *
 * 功能：
 * - 初始化自動展開兩層目錄
 * - 支援「全部展開」 / 「全部收合」按鈕
 * - 随檔案副檔名假對應 emoji 圖標
 * - 顯示檔案 / 資料夾統計數
 *
 * 樹狀節點由 `TreeItem` 元件遞迴渲染。
 */
import { ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import Card from '@/components/ui/Card.vue'
import TreeItem from '@/components/ui/TreeItem.vue'
import tree from 'virtual:project-tree'

interface TreeNode {
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

const projectTree: TreeNode[] = tree

// Track expanded state per path
const expanded = ref<Set<string>>(new Set())

// Auto-expand first two levels
function initExpand(nodes: TreeNode[], prefix = '') {
  for (const node of nodes) {
    const p = prefix + '/' + node.name
    if (node.type === 'directory') {
      expanded.value.add(p)
      if (node.children && prefix.split('/').length < 3) {
        initExpand(node.children, p)
      }
    }
  }
}
initExpand(projectTree)

function toggleDir(path: string) {
  if (expanded.value.has(path)) {
    expanded.value.delete(path)
  } else {
    expanded.value.add(path)
  }
}

function expandAll(nodes: TreeNode[], prefix = '') {
  for (const node of nodes) {
    const p = prefix + '/' + node.name
    if (node.type === 'directory') {
      expanded.value.add(p)
      if (node.children) expandAll(node.children, p)
    }
  }
}

function collapseAll() {
  expanded.value.clear()
}

function countNodes(nodes: TreeNode[]): { files: number; dirs: number } {
  let files = 0
  let dirs = 0
  for (const n of nodes) {
    if (n.type === 'directory') {
      dirs++
      if (n.children) {
        const sub = countNodes(n.children)
        files += sub.files
        dirs += sub.dirs
      }
    } else {
      files++
    }
  }
  return { files, dirs }
}

const stats = countNodes(projectTree)
</script>

<template>
  <div class="structure">
    <PageHeader title="專案結構">
      <template #actions>
        <span class="text-muted" style="font-size: 14px">{{ stats.dirs }} 個資料夾 / {{ stats.files }} 個檔案</span>
      </template>
    </PageHeader>

    <div class="structure__actions">
      <button class="btn btn--ghost" @click="expandAll(projectTree)">全部展開</button>
      <button class="btn btn--ghost" @click="collapseAll()">全部收合</button>
    </div>

    <Card class="tree">
      <ul class="tree__list">
        <TreeItem
          v-for="node in projectTree"
          :key="node.name"
          :node="node"
          :path="'/' + node.name"
          :depth="0"
          :expanded="expanded"
          @toggle="toggleDir"
        />
      </ul>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.structure {
  &__actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
}

.tree {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  overflow-x: auto;

  &__list {
    list-style: none;
  }
}
</style>
