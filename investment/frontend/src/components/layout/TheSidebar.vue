<script setup lang="ts">
/**
 * TheSidebar — 左側導覽列
 *
 * 对應面的主导航工具列，包含：
 * - Logo 與應用名稱
 * - `navItems` 導航項目清單（支援子項目展開）
 * - 右側拖曳把手，支援為将頂皮調整寬度（寬度存於 localStorage）
 * - 鎖定點自動對齊至 64px 或 240px
 * - RWD: 寬度 ≤ 768px 時強制折疊為 64px（僅顯示圖標）
 *
 * 寬度閘於 `COLLAPSE_THRESHOLD`（100px）時計算屬性 `collapsed` 為 true，
 * 隐藏所有文字標簽。
 */
import { ref, computed, markRaw, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  Home,
  Languages,
  Youtube,
  History,
  Speech,
  Radar,
  ShoppingCart,
  Eye,
  LogOut,
  BookText,
  Newspaper,
  NotebookText,
  BookOpen,
  GraduationCap,
  Settings,
  FolderTree,
  GitBranch,
  LayoutGrid,
  Workflow,
} from 'lucide-vue-next'

const route = useRoute()

const MIN_WIDTH = 64
const MAX_WIDTH = 360
const COLLAPSE_THRESHOLD = 100
const SNAP_POINTS = [MIN_WIDTH, 240]
const SNAP_THRESHOLD = 15

const sidebarWidth = ref(
  Number(localStorage.getItem('sidebar-width')) || 240,
)
const isDragging = ref(false)
const isSnapping = ref(false)

const collapsed = computed(() => sidebarWidth.value <= COLLAPSE_THRESHOLD)

interface NavChild {
  label: string
  path: string
}

interface NavItem {
  icon: Component
  iconColor: string
  label: string
  path: string
  children?: NavChild[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: '總覽',
    items: [
      { icon: markRaw(Home), iconColor: '#3b82f6', label: '分析首頁', path: '/' },
      { icon: markRaw(ShoppingCart), iconColor: '#ef4444', label: '交易首頁', path: '/trading' },
    ],
  },
  {
    title: '市場分析',
    items: [
      {
        icon: markRaw(Radar), iconColor: '#8b5cf6', label: '台股全覽', path: '/analysis/explorer', children: [
          { label: '全覽', path: '/analysis/explorer' },
          { label: '標籤選股', path: '/analysis/tags' },
          { label: '市場總覽', path: '/analysis/overview' },
          { label: '排行榜', path: '/analysis/rankings' },
        ],
      },
      {
        icon: markRaw(Workflow), iconColor: '#3b82f6', label: '行情', path: '/analysis/quote', children: [
          { label: '報價', path: '/analysis/quote' },
          { label: '技術分析', path: '/analysis/quote/technical' },
          { label: '法人買賣', path: '/analysis/quote/institutional' },
          { label: '個股分析', path: '/analysis/quote/analysis' },
        ],
      },
      { icon: markRaw(Newspaper), iconColor: '#06b6d4', label: '市場快訊', path: '/analysis/news' },
      { icon: markRaw(NotebookText), iconColor: '#f59e0b', label: '筆記專區', path: '/analysis/notes' },
      { icon: markRaw(GitBranch), iconColor: '#10b981', label: '操盤 SOP', path: '/analysis/workflow' },
    ],
  },
  {
    title: '策略',
    items: [
      {
        icon: markRaw(LayoutGrid), iconColor: '#22c55e', label: '策略庫', path: '/strategy', children: [
          { label: '我的策略', path: '/strategy' },
          { label: '建立策略', path: '/strategy/create' },
          { label: '選股候選', path: '/strategy/candidates' },
        ],
      },
      {
        icon: markRaw(Workflow), iconColor: '#22c55e', label: '策略流程', path: '/analysis/pipeline', children: [
          { label: '1. 選股', path: '/analysis/pipeline/step1' },
          { label: '2. 週期', path: '/analysis/pipeline/step2' },
          { label: '3. 進場時機', path: '/analysis/pipeline/step3' },
          { label: '4. 部位風控', path: '/analysis/pipeline/step4' },
          { label: '確認與送出', path: '/analysis/pipeline/confirm' },
        ],
      },
    ],
  },
  {
    title: '交易執行',
    items: [
      { icon: markRaw(ShoppingCart), iconColor: '#ef4444', label: '下單交易', path: '/trading/trader' },
      {
        icon: markRaw(Eye), iconColor: '#f97316', label: '持倉監控', path: '/trading/watchdog', children: [
          { label: '持倉', path: '/trading/watchdog' },
          { label: '執行流程', path: '/trading/watchdog/pipeline' },
        ],
      },
      { icon: markRaw(LogOut), iconColor: '#ec4899', label: '出場管理', path: '/trading/exiter' },
      {
        icon: markRaw(BookText), iconColor: '#14b8a6', label: '帳務記錄', path: '/trading/bookkeeper', children: [
          { label: '交易紀錄', path: '/trading/bookkeeper' },
          { label: '報表', path: '/trading/bookkeeper/report' },
        ],
      },
    ],
  },
  {
    title: '英文學習',
    items: [
      { icon: markRaw(Languages), iconColor: '#60a5fa', label: '翻譯', path: '/english/translate' },
      { icon: markRaw(GraduationCap), iconColor: '#22c55e', label: '今日學習', path: '/english/learn' },
      { icon: markRaw(Youtube), iconColor: '#ef4444', label: 'YouTube', path: '/english/youtube' },
      { icon: markRaw(Speech), iconColor: '#a78bfa', label: '雅思練習', path: '/english/ielts' },
      { icon: markRaw(History), iconColor: '#f59e0b', label: '搜尋紀錄', path: '/english/history' },
      { icon: markRaw(Newspaper), iconColor: '#06b6d4', label: '英文新聞', path: '/english/news' },
    ],
  },
  {
    title: '說明 / 設定',
    items: [
      { icon: markRaw(GraduationCap), iconColor: '#38bdf8', label: '學習地圖', path: '/learning' },
      {
        icon: markRaw(LayoutGrid), iconColor: '#6366f1', label: '功能介紹', path: '/feature-guide', children: [
          { label: '選股掃描', path: '/feature-guide/scanner' },
          { label: '下單交易', path: '/feature-guide/trader' },
          { label: '持倉監控', path: '/feature-guide/watchdog' },
          { label: '出場管理', path: '/feature-guide/exiter' },
          { label: '帳務記錄', path: '/feature-guide/bookkeeper' },
          { label: '操盤 SOP', path: '/feature-guide/workflow' },
        ],
      },
      { icon: markRaw(BookOpen), iconColor: '#14b8a6', label: '教學指南', path: '/guide' },
      { icon: markRaw(FolderTree), iconColor: '#a78bfa', label: '專案結構', path: '/structure' },
      { icon: markRaw(Settings), iconColor: '#94a3b8', label: '設定', path: '/settings' },
    ],
  },
]

const expandedParent = ref<string | null>(null)

function isActive(item: NavItem) {
  if (item.children) {
    return route.path.startsWith(item.path) ||
      item.children.some(c => route.path === c.path || route.path.startsWith(c.path + '/'))
  }
  return route.path === item.path
}

function isChildActive(child: NavChild) {
  return route.path === child.path
}

function onItemClick(item: NavItem) {
  if (item.children) {
    expandedParent.value = expandedParent.value === item.path ? null : item.path
  }
}

function isExpanded(item: NavItem) {
  if (!item.children) return false
  return expandedParent.value === item.path || route.path.startsWith(item.path)
}

function onDragStart(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true

  const onMove = (ev: MouseEvent) => {
    let newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX))
    let snapped = false

    for (const point of SNAP_POINTS) {
      if (Math.abs(newWidth - point) <= SNAP_THRESHOLD) {
        newWidth = point
        snapped = true
        break
      }
    }

    isSnapping.value = snapped
    sidebarWidth.value = newWidth
  }

  const onUp = () => {
    isDragging.value = false
    isSnapping.value = false
    localStorage.setItem('sidebar-width', String(sidebarWidth.value))
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onDoubleClick() {
  sidebarWidth.value = collapsed.value ? 240 : MIN_WIDTH
  localStorage.setItem('sidebar-width', String(sidebarWidth.value))
}
</script>

<template>
  <aside class="sidebar"
    :class="{ 'sidebar--collapsed': collapsed, 'sidebar--dragging': isDragging, 'sidebar--snapping': isSnapping }"
    :style="{ width: `${sidebarWidth}px` }">
    <div class="sidebar__logo">
      <svg class="sidebar__logo-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="14" fill="#0f172a" />
        <path d="M14 44 L24 34 L32 38 L42 22 L50 28" stroke="#3b82f6" stroke-width="3.5" stroke-linecap="round"
          stroke-linejoin="round" />
        <path d="M44 22 L50 22 L50 28" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"
          stroke-linejoin="round" />
        <path d="M14 44 L24 34 L32 38 L42 22 L50 28 L50 50 L14 50 Z" fill="url(#sidebarGrad)" opacity="0.25" />
        <line x1="12" y1="50" x2="52" y2="50" stroke="#334155" stroke-width="1.5" stroke-linecap="round" />
        <defs>
          <linearGradient id="sidebarGrad" x1="32" y1="22" x2="32" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <span v-show="!collapsed" class="sidebar__logo-text">Unus</span>
    </div>

    <nav class="sidebar__nav">
      <div v-for="(section, idx) in navSections" :key="section.title" class="sidebar__section"
        :class="{ 'sidebar__section--first': idx === 0 }">
        <div v-if="!collapsed" class="sidebar__section-title">{{ section.title }}</div>
        <div v-else class="sidebar__section-divider"></div>

        <template v-for="item in section.items" :key="item.path">
          <!-- Item with children: click to expand, not navigate -->
          <template v-if="item.children">
            <div class="sidebar__link" :class="{ 'sidebar__link--active': isActive(item) }" @click="onItemClick(item)">
              <component :is="item.icon" class="sidebar__link-icon" :size="18" :stroke-width="2"
                :style="{ color: item.iconColor }" />
              <span v-show="!collapsed" class="sidebar__link-label">{{ item.label }}</span>
              <span v-show="!collapsed" class="sidebar__link-arrow"
                :class="{ 'sidebar__link-arrow--open': isExpanded(item) }">
                ›
              </span>
            </div>
            <!-- Children -->
            <div v-show="!collapsed && isExpanded(item)" class="sidebar__children">
              <RouterLink v-for="child in item.children" :key="child.path" :to="child.path" class="sidebar__child-link"
                :class="{ 'sidebar__child-link--active': isChildActive(child) }">
                <span class="sidebar__child-link-label">{{ child.label }}</span>
              </RouterLink>
            </div>
          </template>

          <!-- Regular item: navigate directly -->
          <RouterLink v-else :to="item.path" class="sidebar__link" :class="{ 'sidebar__link--active': isActive(item) }">
            <component :is="item.icon" class="sidebar__link-icon" :size="18" :stroke-width="2"
              :style="{ color: item.iconColor }" />
            <span v-show="!collapsed" class="sidebar__link-label">{{ item.label }}</span>
          </RouterLink>
        </template>
      </div>
    </nav>

    <!-- Drag handle -->
    <div class="sidebar__resize-handle" @mousedown="onDragStart" @dblclick="onDoubleClick"></div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  height: calc(100vh - 32px);
  margin: 16px 0 16px 16px;
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  flex-shrink: 0;
  transition: transform var(--duration-normal) var(--ease-spring), box-shadow var(--duration-fast);
  z-index: 100;

  &:hover {
    box-shadow: var(--shadow-lg);
  }

  &:not(.sidebar--dragging) {
    transition: width var(--duration-fast) var(--ease-default), transform var(--duration-normal) var(--ease-spring), box-shadow var(--duration-fast);
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--gap-sm);
    padding: var(--gap-md) 20px;
    height: var(--header-height);
    border-bottom: 1px solid var(--glass-border); // Can soften this too

    &-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    &-text {
      font-size: var(--font-size-md);
      font-weight: 700;
      color: var(--color-text-primary);
      white-space: nowrap;
    }
  }

  &__nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 8px;
    overflow-y: auto;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 12px;

    &--first {
      margin-top: 0;
    }
  }

  &__section-title {
    padding: 6px 12px 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__section-divider {
    height: 1px;
    margin: 4px 12px 8px;
    background: var(--glass-border);
  }

  &__section--first &__section-divider {
    display: none;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    padding: 10px 12px;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    transition: all 0.2s var(--ease-smooth);
    white-space: nowrap;
    cursor: pointer;
    position: relative;

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);

      .sidebar__link-icon {
        transform: scale(1.1);
      }
    }

    &--active {
      background: var(--color-accent-soft);
      color: var(--color-accent);

      // Animated left accent bar
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 20%;
        bottom: 20%;
        width: 3px;
        border-radius: 0 2px 2px 0;
        background: var(--color-accent);
        animation: sidebar-bar-in 0.3s var(--ease-spring) both;
      }

      .sidebar__link-icon {
        transform: scale(1.1);
        filter: drop-shadow(0 0 4px var(--glow-accent));
      }

      &:hover {
        background: var(--color-accent-soft);
        color: var(--color-accent);
      }
    }

    &-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: currentColor;
      transition: transform 0.2s var(--ease-spring),
        filter 0.2s var(--ease-smooth);
    }

    &-label {
      font-weight: 500;
      flex: 1;
    }

    &-arrow {
      font-size: var(--font-size-base);
      font-weight: 700;
      color: var(--color-text-muted);
      transition: transform 0.2s var(--ease-smooth);

      &--open {
        transform: rotate(90deg);
      }
    }
  }

  @keyframes sidebar-bar-in {
    from {
      transform: scaleY(0);
      opacity: 0;
    }

    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  &__children {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-left: 36px;
    margin-bottom: 2px;
  }

  &__child-link {
    position: relative;
    display: flex;
    align-items: center;
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 13px;
    transition: all var(--duration-fast);
    white-space: nowrap;

    &::before {
      content: "";
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 4px;
      height: 16px;
      border-radius: 4px;
      background-color: var(--color-accent);
      transition: transform var(--duration-fast) var(--ease-spring);
    }

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-bg-hover);
    }

    &--active {
      color: var(--color-accent);
      background: var(--color-accent-soft);

      &::before {
        transform: translateY(-50%) scaleY(1);
      }

      &:hover {
        color: var(--color-accent);
        background: var(--color-accent-soft);
      }
    }

    &-label {
      font-weight: 500;
    }
  }

  &__resize-handle {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 50;
    transition: background var(--duration-fast);

    &:hover,
    .sidebar--dragging & {
      background: var(--color-accent);
      opacity: 0.5;
    }

    .sidebar--snapping & {
      width: 4px;
      right: -2px;
      background: var(--color-accent);
      opacity: 0.8;
    }
  }
}

// ---- Responsive: 768px ----
@media (max-width: 768px) {
  .sidebar {
    display: none !important; // Hide totally on mobile in favor of bottom nav
  }
}
</style>
