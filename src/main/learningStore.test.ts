import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { LearningStore } from './learningStore'

const directories: string[] = []
function createStore(options?: ConstructorParameters<typeof LearningStore>[1]): LearningStore {
  const directory = mkdtempSync(join(tmpdir(), 'lexicon-learning-'))
  directories.push(directory)
  return new LearningStore(directory, options)
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

  it('turns real learning actions into one completed daily journey with XP', () => {
    let current = new Date('2026-07-17T10:00:00.000Z')
    const store = createStore({ now: () => current, timeZone: 'UTC' })
    const create = (promptZh: string) => {
      const record = store.recordTranslation(promptZh, 'Could you update me on the progress?', 'zh-to-en')
      return store.createItem(record, { promptZh, targetEn: 'Could you update me on the progress?', focusExpression: 'update me on', explanationZh: '', alternatives: [], tags: ['工作'] })
    }
    const first = create('請更新進度')
    const second = create('請告訴我狀態')
    const feedback = { result: 'good' as const, communicativeSuccess: true, message: '很好。', correction: '', naturalAnswer: 'Could you update me on the progress?' }
    store.review(first.id, 'reverse_translation', first.targetEn, feedback, 'review-1')
    const review = store.review(second.id, 'reverse_translation', second.targetEn, feedback, 'review-2')
    const game = store.getDashboard().gamification
    expect(review.rewards).toMatchObject({ xp: 10, completedJourney: true, streak: 1 })
    expect(game.today.completed).toBe(true)
    expect(game.today.xpEarned).toBe(30)
    expect(game.profile.totalXp).toBe(30)
    store.close()
    current = new Date('2026-07-18T10:00:00.000Z')
  })

  it('does not duplicate a review reward when the same IPC operation is replayed', () => {
    const store = createStore({ timeZone: 'UTC' })
    const record = store.recordTranslation('請更新進度', 'Could you update me on the progress?', 'zh-to-en')
    const item = store.createItem(record, { promptZh: '請更新進度', targetEn: 'Could you update me on the progress?', focusExpression: 'update me on', explanationZh: '', alternatives: [], tags: ['工作'] })
    const feedback = { result: 'good' as const, communicativeSuccess: true, message: '很好。', correction: '', naturalAnswer: item.targetEn }
    store.review(item.id, 'reverse_translation', item.targetEn, feedback, 'same-operation')
    const duplicate = store.review(item.id, 'reverse_translation', item.targetEn, feedback, 'same-operation')
    const dashboard = store.getDashboard()
    expect(dashboard.weekly.reviewed).toBe(1)
    expect(dashboard.gamification.profile.totalXp).toBe(15)
    expect(duplicate.rewards?.xp).toBe(0)
    store.close()
  })
})
