import { createRouter, createWebHistory, type Router } from 'vue-router'
import { routes } from '@/router/routes'
import { setPermissionGuard } from '@/router/guards/permission'

let router: Router | undefined

if (import.meta.env.DEV) {
  console.log('routes:', routes)
}

export function setupRouter(): Router {
  router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  })

  setPermissionGuard(router)

  router.afterEach(() => {
    document.title = 'Unus'
  })

  return router
}

export function getRouter(): Router {
  if (!router) {
    throw new Error('Router has not been setup. Call setupRouter() first.')
  }
  return router
}
