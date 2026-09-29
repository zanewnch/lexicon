import type { RouteRecordRaw } from 'vue-router'

/**
 * 找不到路徑時，導回首頁。
 */
export const noMatchRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)',
  redirect: '/portal',
}

/**
 * 不走規約式路由的特例：根路徑與舊路徑相容導向。
 */
export const basicRoutes: RouteRecordRaw[] = [
  { path: '/', redirect: '/portal' },

  // ===== 舊路徑相容導向 =====
  { path: '/scanner', redirect: '/analysis/explorer' },
  { path: '/scanner/overview', redirect: '/analysis/overview' },
  { path: '/scanner/tags', redirect: '/analysis/tags' },
  { path: '/scanner/tsmc', redirect: '/analysis/tsmc' },
  { path: '/scanner/rankings', redirect: '/analysis/rankings' },
  { path: '/scanner/market', redirect: '/analysis/quote' },
  { path: '/scanner/market/technical', redirect: '/analysis/quote/technical' },
  { path: '/scanner/market/institutional', redirect: '/analysis/quote/institutional' },
  { path: '/scanner/market/analysis', redirect: '/analysis/quote/analysis' },
  { path: '/scanner/strategy', redirect: '/strategy' },
  { path: '/scanner/strategy/create', redirect: '/strategy/create' },
  { path: '/scanner/strategy/:id', redirect: (to) => `/strategy/${to.params.id}` },
  { path: '/scanner/strategy/:id/edit', redirect: (to) => `/strategy/${to.params.id}/edit` },
  { path: '/scanner/strategy/:id/backtest', redirect: (to) => `/strategy/${to.params.id}/backtest` },
  { path: '/overview', redirect: '/analysis/overview' },
  { path: '/explorer', redirect: '/analysis/explorer' },
  { path: '/rankings', redirect: '/analysis/rankings' },
  { path: '/market', redirect: '/analysis/quote' },
  { path: '/market/technical', redirect: '/analysis/quote/technical' },
  { path: '/market/institutional', redirect: '/analysis/quote/institutional' },
  { path: '/market/analysis', redirect: '/analysis/quote/analysis' },
  { path: '/tsmc', redirect: '/analysis/tsmc' },
  { path: '/workflow', redirect: '/analysis/workflow' },
  { path: '/news', redirect: '/analysis/news' },
  { path: '/notes', redirect: '/analysis/notes' },
  { path: '/pipeline', redirect: '/analysis/pipeline' },
  { path: '/pipeline/step1', redirect: '/analysis/pipeline/step1' },
  { path: '/pipeline/step2', redirect: '/analysis/pipeline/step2' },
  { path: '/pipeline/step3', redirect: '/analysis/pipeline/step3' },
  { path: '/pipeline/step4', redirect: '/analysis/pipeline/step4' },
  { path: '/pipeline/confirm', redirect: '/analysis/pipeline/confirm' },
  { path: '/trader', redirect: '/trading/trader' },
  { path: '/watchdog', redirect: '/trading/watchdog' },
  { path: '/watchdog/pipeline', redirect: '/trading/watchdog/pipeline' },
  { path: '/exiter', redirect: '/trading/exiter' },
  { path: '/bookkeeper', redirect: '/trading/bookkeeper' },
  { path: '/bookkeeper/report', redirect: '/trading/bookkeeper/report' },
  { path: '/trade', redirect: '/trading/trader' },
  { path: '/portfolio', redirect: '/trading/watchdog' },
  { path: '/history', redirect: '/trading/bookkeeper' },
]
