import { describe, expect, it } from 'vitest'
import { TranslationJobScheduler } from './translationJobScheduler'

describe('TranslationJobScheduler', () => {
  it('runs interactive jobs before queued background work', async () => {
    const scheduler = new TranslationJobScheduler()
    const order: string[] = []
    let releaseFirst!: () => void
    const first = scheduler.submit({ id: 'first', text: '', direction: 'en-to-zh', priority: 'background' }, async () => {
      order.push('first'); await new Promise<void>((resolve) => { releaseFirst = resolve }); return 'first'
    })
    const second = scheduler.submit({ id: 'second', text: '', direction: 'en-to-zh', priority: 'background' }, async () => { order.push('second'); return 'second' })
    const interactive = scheduler.submit({ id: 'popup', text: '', direction: 'en-to-zh', priority: 'interactive' }, async () => { order.push('popup'); return 'popup' })
    await Promise.resolve(); releaseFirst()
    await Promise.all([first, second, interactive])
    expect(order).toEqual(['first', 'popup', 'second'])
  })

  it('rejects queued work when its group is cancelled', async () => {
    const scheduler = new TranslationJobScheduler()
    let release!: () => void
    void scheduler.submit({ id: 'active', text: '', direction: 'en-to-zh', priority: 'interactive' }, async () => new Promise<void>((resolve) => { release = resolve }))
    const cancelled = scheduler.submit({ id: 'old', text: '', direction: 'en-to-zh', priority: 'background', group: 'transcript:old' }, async () => 'old')
    scheduler.cancelGroup('transcript:old')
    await expect(cancelled).rejects.toThrow('已取消')
    release()
  })
})
