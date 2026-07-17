import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { LearningStore } from './learningStore'

const directories: string[] = []
function createStore(): LearningStore {
  const directory = mkdtempSync(join(tmpdir(), 'lexicon-learning-'))
  directories.push(directory)
  return new LearningStore(directory)
}
afterEach(() => { while (directories.length) rmSync(directories.pop()!, { recursive: true, force: true }) })

describe('LearningStore', () => {
  it('keeps a saved translation as a due learning item', () => {
    const store = createStore()
    const recordId = store.recordTranslation('請更新進度', 'Could you update me on the progress?', 'zh-to-en')
    const item = store.createItem(recordId, {
      promptZh: '請更新進度', targetEn: 'Could you update me on the progress?', focusExpression: 'update me on',
      explanationZh: '用來請對方更新某件事的進度。', alternatives: [], tags: ['工作']
    })
    const dashboard = store.getDashboard()
    expect(dashboard.due).toHaveLength(1)
    expect(dashboard.due[0]).toMatchObject({ id: item.id, exerciseType: 'reverse_translation' })
    store.close()
  })

  it('schedules a reviewed item and changes its learning state', () => {
    const store = createStore()
    const recordId = store.recordTranslation('請更新進度', 'Could you update me on the progress?', 'zh-to-en')
    const item = store.createItem(recordId, {
      promptZh: '請更新進度', targetEn: 'Could you update me on the progress?', focusExpression: 'update me on',
      explanationZh: '用來請對方更新某件事的進度。', alternatives: [], tags: ['工作']
    })
    const review = store.review(item.id, 'reverse_translation', 'Could you update me on the progress?', {
      result: 'good', communicativeSuccess: true, message: '很好。', correction: '', naturalAnswer: item.targetEn
    })
    expect(new Date(review.nextReviewAt).getTime()).toBeGreaterThan(Date.now())
    expect(store.getDashboard().recent[0].state).toBe('learning')
    store.close()
  })
})
