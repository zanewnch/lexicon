import type { RouteRecordRaw } from 'vue-router'
import { basicRoutes, noMatchRoute } from '@/router/routes/basicRoutes'
import { generatePagesRoutes } from '@/router/routes/pagesRoutes'

// 越後面的優先度越高
export const routes: RouteRecordRaw[] = [
  noMatchRoute,
  ...basicRoutes,
  ...generatePagesRoutes(),
]
