import { afterEach, describe, expect, it } from 'vitest'
import { useToast } from './useToast'

const toast = useToast()

afterEach(() => {
  for (const item of [...toast.toasts.value]) toast.dismiss(item.id)
})

describe('useToast', () => {
  it('deduplicates identical failures and limits visible errors to three', () => {
    toast.show('K-line failed', 'error', 0)
    toast.show('K-line failed', 'error', 0)
    expect(toast.toasts.value).toHaveLength(1)

    toast.show('Institutional failed', 'error', 0)
    toast.show('Sector failed', 'error', 0)
    toast.show('Detail failed', 'error', 0)
    expect(toast.toasts.value.map((item) => item.message)).toEqual([
      'Institutional failed', 'Sector failed', 'Detail failed',
    ])
  })
})
