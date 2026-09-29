import type { Router } from 'vue-router'

const whiteList = ['Home']

export function setPermissionGuard(router: Router) {
  router.beforeEach(async (to) => {
    if (isWhiteList(to)) return true
    return true
  })
}

function isWhiteList(to: { path: string; name?: unknown }) {
  const name = typeof to.name === 'string' ? to.name : ''
  return whiteList.indexOf(to.path) !== -1 || whiteList.indexOf(name) !== -1
}
