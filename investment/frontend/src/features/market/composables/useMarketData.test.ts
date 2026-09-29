import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/api', () => ({ default: apiMock }))

import { useMarketData } from './useMarketData'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static OPEN = 1
  readyState = 1
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  close() {}
  send(_message: string) {}
}

afterEach(() => {
  apiMock.get.mockReset()
  FakeWebSocket.instances = []
  vi.unstubAllGlobals()
})

describe('useMarketData', () => {
  it('keeps quote and WebSocket available while an unrelated K-line request is pending or fails', async () => {
    let resolveDetail!: (value: { data: { code: string; name: string } }) => void
    let rejectKline!: (reason: Error) => void
    const detail = new Promise<{ data: { code: string; name: string } }>((resolve) => { resolveDetail = resolve })
    const kline = new Promise<never>((_resolve, reject) => { rejectKline = reject })
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/stocks/2330/') return detail
      if (url === '/stocks/2330/kline/') return kline
      return Promise.resolve({ data: [] })
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    let market!: ReturnType<typeof useMarketData>
    const wrapper = mount(defineComponent({
      setup() {
        market = useMarketData('2330')
        return () => h('div')
      },
    }))

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(FakeWebSocket.instances[0]?.url).toContain('/ws/market/2330/')
    expect(market.loading.value).toBe(true)
    expect(market.klineLoading.value).toBe(true)

    resolveDetail({ data: { code: '2330', name: '台積電' } })
    await flushPromises()
    expect(market.loading.value).toBe(false)
    expect(market.klineLoading.value).toBe(true)

    rejectKline(new Error('source timeout'))
    await flushPromises()
    expect(market.klineLoading.value).toBe(false)
    expect(market.klineBars.value).toEqual([])
    wrapper.unmount()
  })

  it('ignores a late response for the previous stock after switching codes', async () => {
    let resolveOld!: (value: { data: { code: string; name: string } }) => void
    let resolveNew!: (value: { data: { code: string; name: string } }) => void
    const oldDetail = new Promise<{ data: { code: string; name: string } }>((resolve) => { resolveOld = resolve })
    const newDetail = new Promise<{ data: { code: string; name: string } }>((resolve) => { resolveNew = resolve })
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/stocks/2330/') return oldDetail
      if (url === '/stocks/2454/') return newDetail
      return Promise.resolve({ data: [] })
    })
    vi.stubGlobal('WebSocket', FakeWebSocket)

    const code = ref('2330')
    let market!: ReturnType<typeof useMarketData>
    const wrapper = mount(defineComponent({
      setup() {
        market = useMarketData(code)
        return () => h('div')
      },
    }))
    code.value = '2454'
    await nextTick()

    resolveNew({ data: { code: '2454', name: '聯發科' } })
    await flushPromises()
    resolveOld({ data: { code: '2330', name: '台積電' } })
    await flushPromises()

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(market.stockDetail.value.code).toBe('2454')
    expect(market.loading.value).toBe(false)
    wrapper.unmount()
  })
})
