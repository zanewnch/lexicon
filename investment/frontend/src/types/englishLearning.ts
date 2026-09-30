export type LearningState = 'new' | 'learning' | 'mastered'
export type ReviewExerciseType = 'reverse_translation' | 'cloze' | 'rewrite'
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'
export type JourneyTaskKind = 'review' | 'task' | 'save_first_item'
export type AbilityStage = 'saved' | 'recalled' | 'flexible' | 'mastered'

export type JourneyTask = {
  kind: JourneyTaskKind
  label: string
  targetCount: number
  progressCount: number
  completed: boolean
}

export type AbilityNode = {
  itemId: number
  expression: string
  tags: string[]
  stage: AbilityStage
}

export type Achievement = {
  code: string
  title: string
  description: string
  unlockedAt?: string
}

export type GamificationDashboard = {
  profile: { totalXp: number; level: number; title: string; currentStreak: number; longestStreak: number; shields: number; streakEnabled: boolean; reducedMotion: boolean }
  today: { localDate: string; completed: boolean; requiredUnits: number; completedUnits: number; xpEarned: number; tasks: JourneyTask[] }
  week: { completedDays: number; targetDays: number }
  abilityMap: AbilityNode[]
  achievements: Achievement[]
}

export type LearningReward = {
  xp: number
  totalXp: number
  levelUp: boolean
  abilityStage?: AbilityStage
  completedTask?: JourneyTaskKind
  completedJourney: boolean
  streak: number
  newAchievements: Achievement[]
}

export type LearningItem = {
  id: number
  translationRecordId: number
  promptZh: string
  targetEn: string
  focusExpression: string
  explanationZh: string
  alternatives: string[]
  tags: string[]
  state: LearningState
  nextReviewAt: string
  createdAt: string
}

export type ReviewCard = LearningItem & {
  exerciseType: ReviewExerciseType
  clozePrompt?: string
}

export type LearningDashboard = {
  due: ReviewCard[]
  recent: LearningItem[]
  counts: Record<LearningState, number>
  weekly: { saved: number; reviewed: number; correct: number }
  patterns: Array<{ expression: string; misses: number }>
  gamification: GamificationDashboard
}

export type LearningExtraction = {
  promptZh: string
  targetEn: string
  focusExpression: string
  explanationZh: string
  alternatives: string[]
  tags: string[]
}

export type ReviewFeedback = {
  result: ReviewResult
  communicativeSuccess: boolean
  message: string
  correction: string
  naturalAnswer: string
  nextReviewAt: string
  rewards?: LearningReward
}
