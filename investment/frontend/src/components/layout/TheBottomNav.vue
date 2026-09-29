<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, Radar, ShoppingCart, Eye, GraduationCap, Menu } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { icon: Home, label: '首頁', path: '/', defaultColor: '#3b82f6' },
  { icon: Radar, label: '選股掃描', path: '/analysis/explorer', defaultColor: '#8b5cf6' },
  { icon: ShoppingCart, label: '下單交易', path: '/trading/trader', defaultColor: '#ef4444' },
  { icon: Eye, label: '持倉監控', path: '/trading/watchdog', defaultColor: '#f97316' },
  { icon: GraduationCap, label: '學習地圖', path: '/learning', defaultColor: '#38bdf8' },
  // 由於手機下方空間有限，其餘功能折疊入選單 (或暫時留空待做全屏選單層)
  { icon: Menu, label: '更多', path: '/more', defaultColor: '#94a3b8' }
]

function isActive(path: string) {
  if (path === '/more') return route.path.startsWith('/more')
  if (path !== '/' && route.path.startsWith(path)) return true
  return route.path === path
}
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive(item.path) }"
      :style="{ '--icon-color': item.defaultColor }"
    >
      <component :is="item.icon" class="bottom-nav__icon" :stroke-width="isActive(item.path) ? 2.5 : 2" />
      <span class="bottom-nav__label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
.bottom-nav {
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    padding-bottom: env(safe-area-inset-bottom, 12px);
    background: var(--glass-bg, var(--color-bg-secondary));
    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
    border-top: 1px solid var(--glass-border);
    z-index: 100;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 4px;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: all var(--duration-fast);

    &:active {
      transform: scale(0.92);
    }
  }

  &__icon {
    width: 24px;
    height: 24px;
    transition: color var(--duration-fast);
  }

  &__label {
    font-size: 10px;
    font-weight: 500;
  }

  &__item--active {
    color: var(--icon-color, var(--color-accent));
    
    .bottom-nav__icon {
      color: var(--icon-color, var(--color-accent));
      filter: drop-shadow(0 2px 4px var(--icon-color, var(--color-accent)));
    }
    
    .bottom-nav__label {
      font-weight: 700;
    }
  }
}
</style>
