import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import type { LearningDashboard, LearningExtraction, LearningItem, LearningState, ReviewCard, ReviewExerciseType, ReviewFeedback, ReviewResult } from '../shared/learning'

type LearningItemRow = {
  id: number
  translation_record_id: number
  prompt_zh: string
  target_en: string
  focus_expression: string
  explanation_zh: string
  alternatives_json: string
  tags_json: string
  state: LearningState
  next_review_at: string
  created_at: string
}
export type TranslationRecord = { id: number; sourceText: string; translatedText: string; direction: 'zh-to-en' | 'en-to-zh' }

export class LearningStore {
  private readonly database: DatabaseSync

  constructor(userDataPath: string) {
    this.database = new DatabaseSync(join(userDataPath, 'lexicon.sqlite'))
    this.database.exec('PRAGMA journal_mode = WAL;')
    this.migrate()
  }

  recordTranslation(sourceText: string, translatedText: string, direction: string, sourceSurface = 'translate'): number {
    const result = this.database.prepare(`
      INSERT INTO translation_records (source_text, translated_text, direction, source_surface, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sourceText, translatedText, direction, sourceSurface, now())
    return Number(result.lastInsertRowid)
  }

  createItem(translationRecordId: number, extraction: LearningExtraction): LearningItem {
    const createdAt = now()
    const result = this.database.prepare(`
      INSERT INTO learning_items (
        translation_record_id, prompt_zh, target_en, focus_expression, explanation_zh,
        alternatives_json, tags_json, state, next_review_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
    `).run(
      translationRecordId, extraction.promptZh, extraction.targetEn, extraction.focusExpression,
      extraction.explanationZh, JSON.stringify(extraction.alternatives), JSON.stringify(extraction.tags), createdAt, createdAt
    )
    return this.getItem(Number(result.lastInsertRowid))
  }

  getTranslationRecord(id: number): TranslationRecord {
    const row = this.database.prepare('SELECT id, source_text, translated_text, direction FROM translation_records WHERE id = ?').get(id) as { id: number; source_text: string; translated_text: string; direction: 'zh-to-en' | 'en-to-zh' } | undefined
    if (!row) throw new Error('找不到這筆翻譯紀錄')
    return { id: row.id, sourceText: row.source_text, translatedText: row.translated_text, direction: row.direction }
  }

  getDashboard(limit = 10): LearningDashboard {
    const due = this.database.prepare(`
      SELECT * FROM learning_items WHERE archived_at IS NULL AND next_review_at <= ?
      ORDER BY next_review_at ASC LIMIT ?
    `).all(now(), limit).map((row) => this.toCard(row as LearningItemRow))
    const recent = this.database.prepare(`
      SELECT * FROM learning_items WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 30
    `).all().map((row) => this.toItem(row as LearningItemRow))
    const counts: Record<LearningState, number> = { new: 0, learning: 0, mastered: 0 }
    for (const row of this.database.prepare(`SELECT state, COUNT(*) AS count FROM learning_items WHERE archived_at IS NULL GROUP BY state`).all() as Array<{ state: LearningState; count: number }>) counts[row.state] = row.count
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const saved = Number((this.database.prepare('SELECT COUNT(*) AS count FROM learning_items WHERE created_at >= ? AND archived_at IS NULL').get(weekAgo) as { count: number }).count)
    const reviewed = Number((this.database.prepare('SELECT COUNT(*) AS count FROM review_events WHERE reviewed_at >= ?').get(weekAgo) as { count: number }).count)
    const correct = Number((this.database.prepare("SELECT COUNT(*) AS count FROM review_events WHERE reviewed_at >= ? AND result IN ('good', 'easy')").get(weekAgo) as { count: number }).count)
    const patterns = this.database.prepare(`
      SELECT learning_items.focus_expression AS expression, COUNT(*) AS misses
      FROM review_events JOIN learning_items ON learning_items.id = review_events.learning_item_id
      WHERE review_events.result IN ('again', 'hard') AND learning_items.archived_at IS NULL
      GROUP BY learning_items.focus_expression HAVING COUNT(*) >= 3 ORDER BY misses DESC LIMIT 3
    `).all().map((row) => ({ expression: String((row as { expression: string }).expression), misses: Number((row as { misses: number }).misses) }))
    return { due, recent, counts, weekly: { saved, reviewed, correct }, patterns }
  }

  getItem(id: number): LearningItem {
    const row = this.database.prepare('SELECT * FROM learning_items WHERE id = ? AND archived_at IS NULL').get(id) as LearningItemRow | undefined
    if (!row) throw new Error('找不到這個學習項目')
    return this.toItem(row)
  }

  review(itemId: number, exerciseType: ReviewExerciseType, answer: string, feedback: Omit<ReviewFeedback, 'nextReviewAt'>): ReviewFeedback {
    const item = this.getItem(itemId)
    const reviewCount = Number((this.database.prepare('SELECT COUNT(*) AS count FROM review_events WHERE learning_item_id = ?').get(itemId) as { count: number }).count)
    const nextReviewAt = scheduleReview(feedback.result, reviewCount)
    const state: LearningState = feedback.result === 'easy' && reviewCount >= 1 ? 'mastered' : feedback.result === 'again' ? 'new' : 'learning'
    this.database.prepare(`
      INSERT INTO review_events (learning_item_id, exercise_type, user_answer, result, feedback_json, reviewed_at, next_review_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, exerciseType, answer, feedback.result, JSON.stringify(feedback), now(), nextReviewAt)
    this.database.prepare('UPDATE learning_items SET state = ?, next_review_at = ? WHERE id = ?').run(state, nextReviewAt, item.id)
    return { ...feedback, nextReviewAt }
  }

  deleteItem(id: number): void { this.database.prepare('UPDATE learning_items SET archived_at = ? WHERE id = ?').run(now(), id) }

  clearLearningData(): void {
    this.database.exec('DELETE FROM review_events; DELETE FROM learning_items; DELETE FROM translation_records; DELETE FROM learner_patterns;')
  }

  close(): void { this.database.close() }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS translation_records (
        id INTEGER PRIMARY KEY, source_text TEXT NOT NULL, translated_text TEXT NOT NULL,
        direction TEXT NOT NULL, source_surface TEXT NOT NULL, created_at TEXT NOT NULL,
        learning_opt_out INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS learning_items (
        id INTEGER PRIMARY KEY, translation_record_id INTEGER NOT NULL REFERENCES translation_records(id),
        prompt_zh TEXT NOT NULL, target_en TEXT NOT NULL, focus_expression TEXT NOT NULL,
        explanation_zh TEXT NOT NULL, alternatives_json TEXT NOT NULL, tags_json TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('new', 'learning', 'mastered')),
        next_review_at TEXT NOT NULL, created_at TEXT NOT NULL, archived_at TEXT
      );
      CREATE TABLE IF NOT EXISTS review_events (
        id INTEGER PRIMARY KEY, learning_item_id INTEGER NOT NULL REFERENCES learning_items(id),
        exercise_type TEXT NOT NULL, user_answer TEXT NOT NULL, result TEXT NOT NULL,
        feedback_json TEXT NOT NULL, reviewed_at TEXT NOT NULL, next_review_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS learner_patterns (
        id INTEGER PRIMARY KEY, category TEXT NOT NULL, evidence_count INTEGER NOT NULL,
        description_zh TEXT NOT NULL, last_seen_at TEXT NOT NULL, dismissed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_learning_items_due ON learning_items(next_review_at);
      CREATE INDEX IF NOT EXISTS idx_review_events_item ON review_events(learning_item_id);
    `)
  }

  private toItem(row: LearningItemRow): LearningItem {
    return {
      id: row.id, translationRecordId: row.translation_record_id, promptZh: row.prompt_zh, targetEn: row.target_en,
      focusExpression: row.focus_expression, explanationZh: row.explanation_zh,
      alternatives: parseList(row.alternatives_json), tags: parseList(row.tags_json), state: row.state,
      nextReviewAt: row.next_review_at, createdAt: row.created_at
    }
  }

  private toCard(row: LearningItemRow): ReviewCard {
    const item = this.toItem(row)
    const exerciseType: ReviewExerciseType = item.state === 'new' ? 'reverse_translation' : item.state === 'learning' ? 'cloze' : 'rewrite'
    return { ...item, exerciseType, clozePrompt: exerciseType === 'cloze' ? createCloze(item.targetEn, item.focusExpression) : undefined }
  }
}

function now(): string { return new Date().toISOString() }
function parseList(value: string): string[] { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [] } catch { return [] } }
function createCloze(sentence: string, expression: string): string { return sentence.replace(new RegExp(escapeRegExp(expression), 'i'), '_____') }
function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function scheduleReview(result: ReviewResult, reviewCount: number): string {
  const days = result === 'again' ? 1 : result === 'hard' ? 3 : result === 'good' ? 7 : reviewCount >= 1 ? 21 : 7
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}
