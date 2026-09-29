import type { RouteComponent } from 'vue-router'
import { createRoute } from '@/router/helper/routeHelper'

/**
 * 自動產製 pages 資料夾底下的約定式路由設定，會以動態載入的方式使用 .vue 元件檔
 */
export function generatePagesRoutes() {
  const pageComponents = import.meta.glob<{ default: RouteComponent }>(
    ['/src/pages/**/*.vue'],
    { eager: false },
  )
  return createRoute(pageComponents as Record<string, () => Promise<RouteComponent>>)
}
