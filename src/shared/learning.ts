export type LearningState = 'new' | 'learning' | 'mastered'
export type ReviewExerciseType = 'reverse_translation' | 'cloze' | 'rewrite'
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'

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
}
