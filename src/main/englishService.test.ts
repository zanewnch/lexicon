import { afterAll, beforeAll, expect, test } from 'vitest'
import { getEnglishConnection, publishEnglishEvent, registerEnglishOperation, startEnglishService, stopEnglishService } from './englishService'
beforeAll(async () => {
  registerEnglishOperation('test:echo', (_context, value) => value)
  registerEnglishOperation('test:failure', () => { throw new Error('invalid value') })
  await startEnglishService()
})
afterAll(() => stopEnglishService())
function request(operation: string, args: unknown[] = [], authenticated = true) {
  const connection = getEnglishConnection()!
  return fetch(connection.url + '/rpc', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${connection.token}` } : {}) },
    body: JSON.stringify({ operation, args })
  })
}
test('requires the per-launch bearer token', async () => {
  expect((await request('test:echo', [], false)).status).toBe(401)
})
test('only explicitly registered operations can execute', async () => {
  expect((await request('shell:execute', ['anything'])).status).toBe(400)
  expect(await (await request('test:echo', [{ text: '繁體中文', nested: [1, 2] }])).json()).toEqual({ result: { text: '繁體中文', nested: [1, 2] } })
})
test('invalid arguments and handler failures return controlled errors', async () => {
  expect((await request('test:echo', Array(7).fill('x'))).status).toBe(400)
  expect(await (await request('test:failure')).json()).toEqual({ error: 'invalid value' })
})
test('SSE reconnect replays the updated transcript', async () => {
  publishEnglishEvent('youtube:transcript-open', { videoId: 'v1', segments: [{ id: 's1', text: 'Hello' }] })
  publishEnglishEvent('youtube:transcript-segment', { videoId: 'v1', segmentId: 's1', translation: '你好' })
  const connection = getEnglishConnection()!
  const abort = new AbortController()
  const response = await fetch(connection.url + '/events', { headers: { Authorization: `Bearer ${connection.token}` }, signal: abort.signal })
  const reader = response.body!.getReader()
  try {
    const chunk = new TextDecoder().decode((await reader.read()).value)
    expect(chunk).toContain('你好')
    expect(chunk).toContain('youtube:transcript-open')
  } finally { abort.abort(); await reader.cancel().catch(() => {}) }
})
