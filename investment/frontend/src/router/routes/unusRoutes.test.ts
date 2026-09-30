import { expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from './index'

test('all generated route containers are complete, so router initialization succeeds', () => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const paths = ['translate', 'learn', 'youtube', 'ielts', 'history', 'news']
  for (const page of paths) {
    const matched = router.resolve(`/english/${page}`).matched
    expect(matched.map((route) => route.name)).toContain(`english-${page}-Home`)
    expect(matched.every((route) => Boolean(route.components?.default))).toBe(true)
  }
  expect(router.resolve('/settings').matched.slice(-1)[0]?.name).toBe('settings-Home')
  expect(router.resolve('/more').matched.slice(-1)[0]?.name).toBe('more-Home')
})
