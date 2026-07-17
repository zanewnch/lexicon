import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import type {
  AbilityNode, AbilityStage, Achievement, GamificationDashboard, JourneyTask, JourneyTaskKind,
  LearningDashboard, LearningExtraction, LearningItem, LearningReward, LearningState, ReviewCard,
  ReviewExerciseType, ReviewFeedback, ReviewResult
} from '../shared/learning'

type LearningItemRow = {
  id: number; translation_record_id: number; prompt_zh: string; target_en: string; focus_expression: string
  explanation_zh: string; alternatives_json: string; tags_json: string; state: LearningState; next_review_at: string; created_at: string
}
type ProfileRow = {
  total_xp: number; level: number; current_streak: number; longest_streak: number; last_completed_local_date: string | null
  journey_shields: number; streak_enabled: number; reduced_motion: number
}
export type TranslationRecord = { id: number; sourceText: string; translatedText: string; direction: 'zh-to-en' | 'en-to-zh' }
export type TranslationHistoryRecord = TranslationRecord & { sourceSurface: string; createdAt: string }
export type LearningStoreOptions = { now?: () => Date; timeZone?: string }

const DAILY_XP_CAP = 85
const ACHIEVEMENTS: Array<Omit<Achievement, 'unlockedAt'>> = [
  { code: 'first-star', title: '第一顆星', description: '建立第一個想學的表達。' },
  { code: 'three-day-journey', title: '三日旅程', description: '任意 7 日完成 3 天旅程。' },
  { code: 'next-day-recall', title: '隔天想起來', description: '收藏後隔日首次答對。' },
  { code: 'no-hint', title: '不靠提示', description: '連續 5 題無提示答對。' },
  { code: 'rewrite', title: '換個說法', description: '第一次完成情境改寫。' },
  { code: 'real-message', title: '真實訊息', description: '第一次完成情境任務。' },
  { code: 'mastery', title: '越來越熟', description: '第一個表達成為已能使用。' },
  { code: 'five-stars', title: '五顆能力星', description: '累積 5 個已能使用表達。' },
  { code: 'work-communicator', title: '工作溝通', description: '3 個工作表達已能使用。' },
  { code: 'listening-clue', title: '聽力線索', description: '由 YouTube 字幕建立並答對 3 個表達。' },
  { code: 'organizer', title: '整理者', description: '封存 5 個不再需要的項目。' },
  { code: 'week-return', title: '一週回來', description: '任意 7 日完成 5 天旅程。' }
]

export class LearningStore {
  private readonly database: DatabaseSync
  private readonly getNow: () => Date
  private readonly timeZone: string

  constructor(userDataPath: string, options: LearningStoreOptions = {}) {
    this.database = new DatabaseSync(join(userDataPath, 'lexicon.sqlite'))
    this.getNow = options.now ?? (() => new Date())
    this.timeZone = options.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    this.database.exec('PRAGMA journal_mode = WAL;')
    this.migrate()
    this.ensureProfile()
  }

  recordTranslation(sourceText: string, translatedText: string, direction: string, sourceSurface = 'translate'): number {
    const result = this.database.prepare(`INSERT INTO translation_records (source_text, translated_text, direction, source_surface, created_at) VALUES (?, ?, ?, ?, ?)`).run(sourceText, translatedText, direction, sourceSurface, this.now())
    return Number(result.lastInsertRowid)
  }

  createItem(translationRecordId: number, extraction: LearningExtraction): LearningItem {
    const createdAt = this.now()
    this.database.exec('BEGIN')
    try {
      const result = this.database.prepare(`
        INSERT INTO learning_items (translation_record_id, prompt_zh, target_en, focus_expression, explanation_zh, alternatives_json, tags_json, state, next_review_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
      `).run(translationRecordId, extraction.promptZh, extraction.targetEn, extraction.focusExpression, extraction.explanationZh, JSON.stringify(extraction.alternatives), JSON.stringify(extraction.tags), createdAt, createdAt)
      this.updateJourneyTask('save_first_item', 1)
      const itemId = Number(result.lastInsertRowid)
      this.awardXp('learning_item', String(itemId), 5)
      this.completeJourneyIfReady()
      this.unlockAchievements()
      this.database.exec('COMMIT')
      return this.getItem(itemId)
    } catch (error) { this.database.exec('ROLLBACK'); throw error }
  }

  getTranslationRecord(id: number): TranslationRecord {
    const row = this.database.prepare('SELECT id, source_text, translated_text, direction FROM translation_records WHERE id = ?').get(id) as { id: number; source_text: string; translated_text: string; direction: 'zh-to-en' | 'en-to-zh' } | undefined
    if (!row) throw new Error('找不到這筆翻譯紀錄')
    return { id: row.id, sourceText: row.source_text, translatedText: row.translated_text, direction: row.direction }
  }

  listTranslationHistory(limit = 100): TranslationHistoryRecord[] {
    return this.database.prepare('SELECT id, source_text, translated_text, direction, source_surface, created_at FROM translation_records ORDER BY created_at DESC, id DESC LIMIT ?').all(limit).map((value) => {
      const row = value as { id: number; source_text: string; translated_text: string; direction: 'zh-to-en' | 'en-to-zh'; source_surface: string; created_at: string }
      return { id: row.id, sourceText: row.source_text, translatedText: row.translated_text, direction: row.direction, sourceSurface: row.source_surface, createdAt: row.created_at }
    })
  }

  getDashboard(limit = 10): LearningDashboard {
    const due = this.database.prepare('SELECT * FROM learning_items WHERE archived_at IS NULL AND next_review_at <= ? ORDER BY next_review_at ASC LIMIT ?').all(this.now(), limit).map((row) => this.toCard(row as LearningItemRow))
    const recent = this.database.prepare('SELECT * FROM learning_items WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 30').all().map((row) => this.toItem(row as LearningItemRow))
    const counts: Record<LearningState, number> = { new: 0, learning: 0, mastered: 0 }
    for (const row of this.database.prepare('SELECT state, COUNT(*) AS count FROM learning_items WHERE archived_at IS NULL GROUP BY state').all() as Array<{ state: LearningState; count: number }>) counts[row.state] = row.count
    const weekAgo = new Date(this.getNow().getTime() - 7 * 86400000).toISOString()
    const saved = this.count('SELECT COUNT(*) AS count FROM learning_items WHERE created_at >= ? AND archived_at IS NULL', weekAgo)
    const reviewed = this.count('SELECT COUNT(*) AS count FROM review_events WHERE reviewed_at >= ?', weekAgo)
    const correct = this.count("SELECT COUNT(*) AS count FROM review_events WHERE reviewed_at >= ? AND result IN ('good', 'easy')", weekAgo)
    const patterns = this.database.prepare(`SELECT learning_items.focus_expression AS expression, COUNT(*) AS misses FROM review_events JOIN learning_items ON learning_items.id = review_events.learning_item_id WHERE review_events.result IN ('again', 'hard') AND learning_items.archived_at IS NULL GROUP BY learning_items.focus_expression HAVING COUNT(*) >= 3 ORDER BY misses DESC LIMIT 3`).all().map((row) => ({ expression: String((row as { expression: string }).expression), misses: Number((row as { misses: number }).misses) }))
    return { due, recent, counts, weekly: { saved, reviewed, correct }, patterns, gamification: this.getGamificationDashboard(recent) }
  }

  getItem(id: number): LearningItem {
    const row = this.database.prepare('SELECT * FROM learning_items WHERE id = ? AND archived_at IS NULL').get(id) as LearningItemRow | undefined
    if (!row) throw new Error('找不到這個學習項目')
    return this.toItem(row)
  }

  review(itemId: number, exerciseType: ReviewExerciseType, answer: string, feedback: Omit<ReviewFeedback, 'nextReviewAt' | 'rewards'>, operationId?: string): ReviewFeedback {
    this.database.exec('BEGIN')
    try {
      const item = this.getItem(itemId)
      if (operationId) {
        const existing = this.database.prepare('SELECT feedback_json, next_review_at FROM review_events WHERE operation_id = ?').get(operationId) as { feedback_json: string; next_review_at: string } | undefined
        if (existing) {
          const previous = JSON.parse(existing.feedback_json) as Omit<ReviewFeedback, 'nextReviewAt' | 'rewards'>
          this.database.exec('COMMIT')
          return { ...previous, nextReviewAt: existing.next_review_at, rewards: this.reward(0, this.getAbilityStage(item.id, item.state), undefined, false, []) }
        }
      }
      const reviewCount = this.count('SELECT COUNT(*) AS count FROM review_events WHERE learning_item_id = ?', itemId)
      const nextReviewAt = scheduleReview(feedback.result, reviewCount, this.getNow())
      const state: LearningState = feedback.result === 'easy' && reviewCount >= 1 ? 'mastered' : feedback.result === 'again' ? 'new' : 'learning'
      const result = this.database.prepare(`INSERT INTO review_events (learning_item_id, exercise_type, user_answer, result, feedback_json, reviewed_at, next_review_at, operation_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(itemId, exerciseType, answer, feedback.result, JSON.stringify(feedback), this.now(), nextReviewAt, operationId ?? null)
      const eventId = Number(result.lastInsertRowid)
      this.database.prepare('UPDATE learning_items SET state = ?, next_review_at = ? WHERE id = ?').run(state, nextReviewAt, item.id)
      let xp = 0
      let completedTask: JourneyTaskKind | undefined
      if (feedback.result === 'hard') xp = this.awardXp('review', String(eventId), 6)
      if (feedback.result === 'good' || feedback.result === 'easy') {
        const failedToday = this.count("SELECT COUNT(*) AS count FROM review_events WHERE learning_item_id = ? AND result IN ('again', 'hard') AND reviewed_at >= ?", itemId, this.startOfToday()) > 0
        xp = this.awardXp('review', String(eventId), failedToday ? 4 : 10)
        completedTask = this.updateJourneyTask('review', 1) ?? undefined
      }
      const abilityStage = this.getAbilityStage(item.id, state)
      if (state === 'mastered') xp += this.awardXp('mastery', String(item.id), 15)
      const journey = this.completeJourneyIfReady()
      const achievements = this.unlockAchievements()
      this.database.exec('COMMIT')
      return { ...feedback, nextReviewAt, rewards: this.reward(xp, abilityStage, completedTask, journey, achievements) }
    } catch (error) { this.database.exec('ROLLBACK'); throw error }
  }

  reviewTask(itemIds: number[], answer: string, feedback: Omit<ReviewFeedback, 'nextReviewAt' | 'rewards'>, operationId?: string): Omit<ReviewFeedback, 'nextReviewAt'> & { rewards: LearningReward } {
    this.database.exec('BEGIN')
    try {
      const sourceId = operationId ?? hash(`${itemIds.sort((a, b) => a - b).join(',')}\u0000${answer}`)
      const xp = feedback.communicativeSuccess ? this.awardXp('task', sourceId, 20) : 0
      const completedTask = feedback.communicativeSuccess ? this.updateJourneyTask('task', 1) ?? undefined : undefined
      const journey = this.completeJourneyIfReady()
      const achievements = this.unlockAchievements()
      this.database.exec('COMMIT')
      return { ...feedback, rewards: this.reward(xp, undefined, completedTask, journey, achievements) }
    } catch (error) { this.database.exec('ROLLBACK'); throw error }
  }

  updatePreferences(preferences: { streakEnabled?: boolean; reducedMotion?: boolean }): GamificationDashboard {
    const profile = this.profile()
    this.database.prepare('UPDATE learner_profile SET streak_enabled = ?, reduced_motion = ?, updated_at = ? WHERE id = 1').run(preferences.streakEnabled === undefined ? profile.streak_enabled : Number(preferences.streakEnabled), preferences.reducedMotion === undefined ? profile.reduced_motion : Number(preferences.reducedMotion), this.now())
    return this.getGamificationDashboard()
  }

  deleteItem(id: number): void { this.database.prepare('UPDATE learning_items SET archived_at = ? WHERE id = ?').run(this.now(), id); this.unlockAchievements() }
  clearLearningData(): void { this.database.exec('DELETE FROM xp_events; DELETE FROM daily_journey_tasks; DELETE FROM daily_journeys; DELETE FROM achievements; DELETE FROM review_events; DELETE FROM learning_items; DELETE FROM translation_records; DELETE FROM learner_patterns; DELETE FROM learner_profile;'); this.ensureProfile() }
  close(): void { this.database.close() }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS translation_records (id INTEGER PRIMARY KEY, source_text TEXT NOT NULL, translated_text TEXT NOT NULL, direction TEXT NOT NULL, source_surface TEXT NOT NULL, created_at TEXT NOT NULL, learning_opt_out INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS learning_items (id INTEGER PRIMARY KEY, translation_record_id INTEGER NOT NULL REFERENCES translation_records(id), prompt_zh TEXT NOT NULL, target_en TEXT NOT NULL, focus_expression TEXT NOT NULL, explanation_zh TEXT NOT NULL, alternatives_json TEXT NOT NULL, tags_json TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('new', 'learning', 'mastered')), next_review_at TEXT NOT NULL, created_at TEXT NOT NULL, archived_at TEXT);
      CREATE TABLE IF NOT EXISTS review_events (id INTEGER PRIMARY KEY, learning_item_id INTEGER NOT NULL REFERENCES learning_items(id), exercise_type TEXT NOT NULL, user_answer TEXT NOT NULL, result TEXT NOT NULL, feedback_json TEXT NOT NULL, reviewed_at TEXT NOT NULL, next_review_at TEXT NOT NULL, operation_id TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS learner_patterns (id INTEGER PRIMARY KEY, category TEXT NOT NULL, evidence_count INTEGER NOT NULL, description_zh TEXT NOT NULL, last_seen_at TEXT NOT NULL, dismissed_at TEXT);
      CREATE TABLE IF NOT EXISTS learner_profile (id INTEGER PRIMARY KEY CHECK (id = 1), total_xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, current_streak INTEGER NOT NULL DEFAULT 0, longest_streak INTEGER NOT NULL DEFAULT 0, last_completed_local_date TEXT, journey_shields INTEGER NOT NULL DEFAULT 0, streak_enabled INTEGER NOT NULL DEFAULT 1, reduced_motion INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS daily_journeys (local_date TEXT PRIMARY KEY, status TEXT NOT NULL CHECK (status IN ('active', 'completed')), required_units INTEGER NOT NULL, completed_units INTEGER NOT NULL DEFAULT 0, xp_earned INTEGER NOT NULL DEFAULT 0, completed_at TEXT);
      CREATE TABLE IF NOT EXISTS daily_journey_tasks (id INTEGER PRIMARY KEY, local_date TEXT NOT NULL REFERENCES daily_journeys(local_date), kind TEXT NOT NULL CHECK (kind IN ('review', 'task', 'save_first_item')), target_count INTEGER NOT NULL, progress_count INTEGER NOT NULL DEFAULT 0, completed_at TEXT, UNIQUE(local_date, kind));
      CREATE TABLE IF NOT EXISTS xp_events (id INTEGER PRIMARY KEY, source_type TEXT NOT NULL, source_id TEXT NOT NULL, amount INTEGER NOT NULL, local_date TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(source_type, source_id, amount));
      CREATE TABLE IF NOT EXISTS achievements (code TEXT PRIMARY KEY, unlocked_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_learning_items_due ON learning_items(next_review_at); CREATE INDEX IF NOT EXISTS idx_review_events_item ON review_events(learning_item_id); CREATE INDEX IF NOT EXISTS idx_xp_events_local_date ON xp_events(local_date);
    `)
    const reviewColumns = this.database.prepare('PRAGMA table_info(review_events)').all() as Array<{ name: string }>
    if (!reviewColumns.some((column) => column.name === 'operation_id')) this.database.exec('ALTER TABLE review_events ADD COLUMN operation_id TEXT; CREATE UNIQUE INDEX IF NOT EXISTS idx_review_events_operation_id ON review_events(operation_id);')
  }

  private ensureProfile(): void { this.database.prepare('INSERT OR IGNORE INTO learner_profile (id, updated_at) VALUES (1, ?)').run(this.now()) }
  private profile(): ProfileRow { return this.database.prepare('SELECT total_xp, level, current_streak, longest_streak, last_completed_local_date, journey_shields, streak_enabled, reduced_motion FROM learner_profile WHERE id = 1').get() as ProfileRow }
  private now(): string { return this.getNow().toISOString() }
  private localDate(): string { return this.localDateFor(this.getNow()) }
  private localDateFor(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: this.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
    const part = (type: string): string => parts.find((entry) => entry.type === type)?.value ?? ''
    return `${part('year')}-${part('month')}-${part('day')}`
  }
  private startOfToday(): string {
    const [year, month, day] = this.localDate().split('-').map(Number)
    const guess = Date.UTC(year, month - 1, day)
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: this.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess))
    const part = (type: string): number => Number(parts.find((entry) => entry.type === type)?.value ?? 0)
    const displayedAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'))
    return new Date(guess - (displayedAsUtc - guess)).toISOString()
  }
  private count(sql: string, ...values: Array<string | number | bigint | null>): number { return Number((this.database.prepare(sql).get(...values) as { count: number }).count) }

  private ensureJourney(): string {
    const date = this.localDate()
    this.database.prepare("INSERT OR IGNORE INTO daily_journeys (local_date, status, required_units) VALUES (?, 'active', 2)").run(date)
    for (const [kind, target] of [['review', 2], ['task', 1], ['save_first_item', 1]] as Array<[JourneyTaskKind, number]>) this.database.prepare('INSERT OR IGNORE INTO daily_journey_tasks (local_date, kind, target_count) VALUES (?, ?, ?)').run(date, kind, target)
    return date
  }

  private updateJourneyTask(kind: JourneyTaskKind, increase: number): JourneyTaskKind | null {
    const date = this.ensureJourney()
    const row = this.database.prepare('SELECT target_count, progress_count, completed_at FROM daily_journey_tasks WHERE local_date = ? AND kind = ?').get(date, kind) as { target_count: number; progress_count: number; completed_at: string | null }
    if (row.completed_at) return null
    const progress = Math.min(row.target_count, row.progress_count + increase)
    const completed = progress >= row.target_count
    this.database.prepare('UPDATE daily_journey_tasks SET progress_count = ?, completed_at = ? WHERE local_date = ? AND kind = ?').run(progress, completed ? this.now() : null, date, kind)
    return completed ? kind : null
  }

  private completeJourneyIfReady(): boolean {
    const date = this.ensureJourney()
    const journey = this.database.prepare('SELECT status, required_units FROM daily_journeys WHERE local_date = ?').get(date) as { status: 'active' | 'completed'; required_units: number }
    if (journey.status === 'completed') return false
    const completed = this.count('SELECT COUNT(*) AS count FROM daily_journey_tasks WHERE local_date = ? AND completed_at IS NOT NULL', date)
    if (completed < journey.required_units) return false
    this.database.prepare("UPDATE daily_journeys SET status = 'completed', completed_units = ?, completed_at = ? WHERE local_date = ?").run(completed, this.now(), date)
    this.updateStreak(date)
    const completedDays = this.count("SELECT COUNT(*) AS count FROM daily_journeys WHERE status = 'completed'")
    if (completedDays > 0 && completedDays % 6 === 0) this.database.prepare('UPDATE learner_profile SET journey_shields = MIN(2, journey_shields + 1), updated_at = ? WHERE id = 1').run(this.now())
    return true
  }

  private updateStreak(date: string): void {
    const profile = this.profile()
    if (!profile.streak_enabled || profile.last_completed_local_date === date) return
    let streak = 1; let shields = profile.journey_shields
    if (profile.last_completed_local_date) {
      const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${profile.last_completed_local_date}T00:00:00Z`)) / 86400000)
      if (days === 1) streak = profile.current_streak + 1
      else if (days > 1 && shields > 0) { streak = profile.current_streak + 1; shields-- }
    }
    this.database.prepare('UPDATE learner_profile SET current_streak = ?, longest_streak = MAX(longest_streak, ?), last_completed_local_date = ?, journey_shields = ?, updated_at = ? WHERE id = 1').run(streak, streak, date, shields, this.now())
  }

  private awardXp(sourceType: string, sourceId: string, requested: number): number {
    const date = this.ensureJourney()
    const before = this.count('SELECT COALESCE(SUM(amount), 0) AS count FROM xp_events WHERE local_date = ?', date)
    const amount = Math.max(0, Math.min(requested, DAILY_XP_CAP - before))
    if (!amount) return 0
    const result = this.database.prepare('INSERT OR IGNORE INTO xp_events (source_type, source_id, amount, local_date, created_at) VALUES (?, ?, ?, ?, ?)').run(sourceType, sourceId, amount, date, this.now())
    if (!result.changes) return 0
    const profile = this.profile(); const total = profile.total_xp + amount; const level = levelFor(total)
    this.database.prepare('UPDATE learner_profile SET total_xp = ?, level = ?, updated_at = ? WHERE id = 1').run(total, level, this.now())
    this.database.prepare('UPDATE daily_journeys SET xp_earned = xp_earned + ? WHERE local_date = ?').run(amount, date)
    return amount
  }

  private getGamificationDashboard(recent?: LearningItem[]): GamificationDashboard {
    const date = this.ensureJourney(); const profile = this.profile()
    const journey = this.database.prepare('SELECT status, required_units, completed_units, xp_earned FROM daily_journeys WHERE local_date = ?').get(date) as { status: 'active' | 'completed'; required_units: number; completed_units: number; xp_earned: number }
    const tasks = this.database.prepare('SELECT kind, target_count, progress_count, completed_at FROM daily_journey_tasks WHERE local_date = ? ORDER BY id').all(date).map((value) => {
      const row = value as { kind: JourneyTaskKind; target_count: number; progress_count: number; completed_at: string | null }
      return { kind: row.kind, label: taskLabel(row.kind), targetCount: row.target_count, progressCount: row.progress_count, completed: Boolean(row.completed_at) } satisfies JourneyTask
    })
    const weekStart = this.localDateFor(new Date(this.getNow().getTime() - 6 * 86400000))
    const week = this.count("SELECT COUNT(*) AS count FROM daily_journeys WHERE status = 'completed' AND local_date >= ?", weekStart)
    const items = recent ?? this.database.prepare('SELECT * FROM learning_items WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 30').all().map((row) => this.toItem(row as LearningItemRow))
    return {
      profile: { totalXp: profile.total_xp, level: profile.level, title: titleFor(profile.level), currentStreak: profile.current_streak, longestStreak: profile.longest_streak, shields: profile.journey_shields, streakEnabled: Boolean(profile.streak_enabled), reducedMotion: Boolean(profile.reduced_motion) },
      today: { localDate: date, completed: journey.status === 'completed', requiredUnits: journey.required_units, completedUnits: journey.status === 'completed' ? Math.max(journey.completed_units, journey.required_units) : tasks.filter((task) => task.completed).length, xpEarned: journey.xp_earned, tasks },
      week: { completedDays: week, targetDays: 4 }, abilityMap: items.map((item) => ({ itemId: item.id, expression: item.focusExpression, tags: item.tags, stage: this.getAbilityStage(item.id, item.state) })), achievements: this.listAchievements()
    }
  }

  private getAbilityStage(itemId: number, state: LearningState): AbilityStage {
    if (state === 'mastered') return 'mastered'
    const successes = this.database.prepare("SELECT exercise_type, reviewed_at FROM review_events WHERE learning_item_id = ? AND result IN ('good', 'easy') ORDER BY reviewed_at").all(itemId) as Array<{ exercise_type: ReviewExerciseType; reviewed_at: string }>
    if (!successes.length) return 'saved'
    const differentExercises = new Set(successes.map((entry) => entry.exercise_type)).size >= 2
    const differentDates = new Set(successes.map((entry) => entry.reviewed_at.slice(0, 10))).size >= 2
    return differentExercises && differentDates ? 'flexible' : 'recalled'
  }

  private reward(xp: number, abilityStage: AbilityStage | undefined, completedTask: JourneyTaskKind | undefined, completedJourney: boolean, newAchievements: Achievement[]): LearningReward {
    const profile = this.profile(); const oldLevel = levelFor(Math.max(0, profile.total_xp - xp))
    return { xp, totalXp: profile.total_xp, levelUp: profile.level > oldLevel, abilityStage, completedTask, completedJourney, streak: profile.current_streak, newAchievements }
  }

  private listAchievements(): Achievement[] {
    const unlocked = new Map((this.database.prepare('SELECT code, unlocked_at FROM achievements').all() as Array<{ code: string; unlocked_at: string }>).map((row) => [row.code, row.unlocked_at]))
    return ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlockedAt: unlocked.get(achievement.code) }))
  }

  private unlockAchievements(): Achievement[] {
    const candidates: string[] = []
    const items = this.count('SELECT COUNT(*) AS count FROM learning_items WHERE archived_at IS NULL')
    const mastered = this.count("SELECT COUNT(*) AS count FROM learning_items WHERE state = 'mastered' AND archived_at IS NULL")
    const completedLastWeek = this.count("SELECT COUNT(*) AS count FROM daily_journeys WHERE status = 'completed' AND local_date >= ?", this.localDateFor(new Date(this.getNow().getTime() - 6 * 86400000)))
    if (items >= 1) candidates.push('first-star')
    if (completedLastWeek >= 3) candidates.push('three-day-journey')
    if (completedLastWeek >= 5) candidates.push('week-return')
    if (this.count("SELECT COUNT(*) AS count FROM review_events WHERE exercise_type = 'rewrite' AND result IN ('good', 'easy')") >= 1) candidates.push('rewrite')
    if (this.count("SELECT COUNT(*) AS count FROM xp_events WHERE source_type = 'task'") >= 1) candidates.push('real-message')
    if (mastered >= 1) candidates.push('mastery')
    if (mastered >= 5) candidates.push('five-stars')
    if (this.count("SELECT COUNT(*) AS count FROM learning_items WHERE state = 'mastered' AND tags_json LIKE '%工作%'") >= 3) candidates.push('work-communicator')
    if (this.count("SELECT COUNT(DISTINCT review_events.learning_item_id) AS count FROM review_events JOIN learning_items ON learning_items.id = review_events.learning_item_id JOIN translation_records ON translation_records.id = learning_items.translation_record_id WHERE translation_records.source_surface = 'youtube' AND review_events.result IN ('good', 'easy')") >= 3) candidates.push('listening-clue')
    if (this.count('SELECT COUNT(*) AS count FROM learning_items WHERE archived_at IS NOT NULL') >= 5) candidates.push('organizer')
    const successful = this.database.prepare("SELECT result FROM review_events ORDER BY reviewed_at DESC LIMIT 5").all() as Array<{ result: ReviewResult }>
    if (successful.length === 5 && successful.every((event) => event.result === 'good' || event.result === 'easy')) candidates.push('no-hint')
    const reviewDates = this.database.prepare("SELECT review_events.reviewed_at, learning_items.created_at FROM review_events JOIN learning_items ON learning_items.id = review_events.learning_item_id WHERE review_events.result IN ('good', 'easy')").all() as Array<{ reviewed_at: string; created_at: string }>
    if (reviewDates.some((row) => this.localDateFor(new Date(row.reviewed_at)) > this.localDateFor(new Date(row.created_at)))) candidates.push('next-day-recall')
    const unlocked: Achievement[] = []
    for (const code of candidates) {
      const result = this.database.prepare('INSERT OR IGNORE INTO achievements (code, unlocked_at) VALUES (?, ?)').run(code, this.now())
      if (result.changes) { const achievement = ACHIEVEMENTS.find((item) => item.code === code); if (achievement) unlocked.push({ ...achievement, unlockedAt: this.now() }) }
    }
    return unlocked
  }

  private toItem(row: LearningItemRow): LearningItem { return { id: row.id, translationRecordId: row.translation_record_id, promptZh: row.prompt_zh, targetEn: row.target_en, focusExpression: row.focus_expression, explanationZh: row.explanation_zh, alternatives: parseList(row.alternatives_json), tags: parseList(row.tags_json), state: row.state, nextReviewAt: row.next_review_at, createdAt: row.created_at } }
  private toCard(row: LearningItemRow): ReviewCard { const item = this.toItem(row); const exerciseType: ReviewExerciseType = item.state === 'new' ? 'reverse_translation' : item.state === 'learning' ? 'cloze' : 'rewrite'; return { ...item, exerciseType, clozePrompt: exerciseType === 'cloze' ? createCloze(item.targetEn, item.focusExpression) : undefined } }
}

function parseList(value: string): string[] { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [] } catch { return [] } }
function createCloze(sentence: string, expression: string): string { return sentence.replace(new RegExp(escapeRegExp(expression), 'i'), '_____') }
function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function scheduleReview(result: ReviewResult, reviewCount: number, current: Date): string { const days = result === 'again' ? 1 : result === 'hard' ? 3 : result === 'good' ? 7 : reviewCount >= 1 ? 21 : 7; return new Date(current.getTime() + days * 86400000).toISOString() }
function levelFor(totalXp: number): number { let level = 1; let consumed = 0; while (totalXp >= consumed + 40 + 10 * level) { consumed += 40 + 10 * level; level++ } return level }
function titleFor(level: number): string { return level <= 2 ? '起步' : level <= 5 ? '回想者' : level <= 9 ? '應用者' : '表達者' }
function taskLabel(kind: JourneyTaskKind): string { return kind === 'review' ? '完成 2 個到期複習' : kind === 'task' ? '用 2 個表達完成情境訊息' : '收藏一句並完成你的第一步' }
function hash(value: string): string { let result = 2166136261; for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619); return (result >>> 0).toString(36) }
