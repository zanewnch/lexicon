export type LearningStatus = 'not_started' | 'in_progress' | 'completed'

export interface LearningResource {
  title: string
  url: string
}

export interface LearningNode {
  id: string
  week: number
  stageId: string
  prerequisiteIds: string[]
  title: string
  concept: string
  resources: LearningResource[]
  steps: string[]
  deliverable: string
  example: string
  completionCriteria: string[]
}

export interface LearningStage {
  id: string
  title: string
  nodeIds: string[]
}

export interface LearningPlan {
  version: string
  title: string
  description: string
  estimatedWeeks: number
  weeklyHours: string
  stages: LearningStage[]
  nodes: LearningNode[]
}

export interface LearningProgress {
  nodeId: string
  status: LearningStatus
  artifactSummary: string
  reflection: string
  noteId: string
  strategyId: string
  externalUrl: string
  completedAt: string | null
  updatedAt: string
}

export type LearningProgressInput = Pick<
  LearningProgress,
  'status' | 'artifactSummary' | 'reflection' | 'noteId' | 'strategyId' | 'externalUrl'
>
