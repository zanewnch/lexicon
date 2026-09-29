import type { RouteRecordRaw, RouteComponent } from 'vue-router'

/**
 * Layout.vue 為該層級路由的 container，需包含 <RouterView /> 來渲染子路由。
 */
const LAYOUT = 'Layout'

/**
 * Home.vue 為該層級的預設子路由元件。
 */
const HOME = 'Home'

const OK = 'OK'
const NOT_IMPL_YET = '尚未實作'
const ROOT_PAGE_NOT_FOUND = '找不到 /pages/Home.vue 或是 /pages/Home/Layout.vue'

type ComponentLoader = () => Promise<RouteComponent>
type PageComponents = Record<string, ComponentLoader>

interface MutableRouteRecord {
  name: string
  path: string | null
  component: ComponentLoader | null
  children: MutableRouteRecord[]
  meta: Record<string, unknown>
  props: boolean
}

const routeStatus: Record<string, string> = {
  Home: ROOT_PAGE_NOT_FOUND,
}

/**
 * 建立 pages 資料夾底下的 vue router 路由
 */
export function createRoute(pageComponents: PageComponents): RouteRecordRaw[] {
  const pagesRoutes: MutableRouteRecord[] = []

  Object.keys(pageComponents).forEach((filePath) => {
    const routePath = computeRoutePath(filePath)
    routePath
      .split('/')
      .reduce(createRouteReducer(filePath, pageComponents), pagesRoutes)
  })

  pagesRoutes.forEach((route) => {
    route.path = '/' + (route.path ?? '')
  })

  if (import.meta.env.DEV) {
    checkRouteStatus()
  }

  return pagesRoutes as unknown as RouteRecordRaw[]
}

/**
 * 將檔案路徑轉換成路由路徑。
 */
function computeRoutePath(filePath: string): string {
  return filePath
    .replace('/src/pages/', '')
    .replace(`/${LAYOUT}.vue`, '')
    .replace(/\.vue$/, '')
    .replace(/\[([\w-]+)]/g, ':$1')
}

function createRouteReducer(filePath: string, pageComponents: PageComponents) {
  return (
    routeChildren: MutableRouteRecord[],
    currentPathName: string,
    currentPathIndex: number,
    routePathList: string[],
  ): MutableRouteRecord[] => {
    const routeName = routePathList.slice(0, currentPathIndex + 1).join('-')

    let config = routeChildren.find((child) => child.name === routeName)

    if (!config) {
      routeStatus[routeName] = NOT_IMPL_YET

      config = {
        name: routeName,
        path: null,
        component: null,
        children: [],
        meta: {},
        props: true,
      }

      routeChildren.push(config)
    }

    if (currentPathIndex === routePathList.length - 1) {
      config.path = currentPathName === HOME ? '' : currentPathName
      config.component = pageComponents[filePath] ?? null
      routeStatus[routeName] = OK
    }

    return config.children
  }
}

function checkRouteStatus() {
  const errorMsg = Object.entries(routeStatus).reduce<string[]>(
    (accumulator, [name, status]) => {
      if (status === NOT_IMPL_YET) {
        accumulator.push(`找不到 ${name} 對應的 ${LAYOUT}.vue。`)
      } else if (status === ROOT_PAGE_NOT_FOUND) {
        accumulator.push(ROOT_PAGE_NOT_FOUND)
      }
      return accumulator
    },
    [],
  )

  if (errorMsg.length) {
    console.group('建立 pages 資料夾底下的 vue router 路由')
    console.error(`pages router 建立失敗。\n${errorMsg.join('\n')}`)
    console.groupEnd()
  } else {
    console.groupCollapsed('建立 pages 資料夾底下的 vue router 路由')
    console.table(routeStatus)
    console.groupEnd()
  }
}
