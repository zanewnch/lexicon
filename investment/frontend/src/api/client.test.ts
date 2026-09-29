import { afterEach, describe, expect, it, vi } from 'vitest'
import api from './client'
import { useToast } from '@/composables/useToast'

const toast = useToast()

afterEach(() => {
  for (const item of [...toast.toasts.value]) toast.dismiss(item.id)
  vi.restoreAllMocks()
})

describe('API error classification', () => {
  it('shows provider errors with the HTTP status and trace ID', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(api.get('/stocks/2330/institutional/', {
      adapter: async (config) => {
        throw {
          config,
          response: {
            status: 503,
            headers: { 'x-request-id': 'regression-503' },
            data: { error: '證交所資料來源異常' },
          },
        }
      },
    })).rejects.toBeDefined()

    const message = toast.toasts.value[toast.toasts.value.length - 1]?.message
    expect(message).toContain('HTTP 503')
    expect(message).toContain('證交所資料來源異常')
    expect(message).toContain('regression-503')
  })

  it('labels a timeout as an API wait rather than a confirmed network outage', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(api.get('/stocks/2330/kline/', {
      adapter: async (config) => {
        throw { code: 'ECONNABORTED', config }
      },
    })).rejects.toBeDefined()

    const message = toast.toasts.value[toast.toasts.value.length - 1]?.message
    expect(message).toContain('等待超過 15 秒')
    expect(message).toContain('不一定是電腦斷網')
  })
})
