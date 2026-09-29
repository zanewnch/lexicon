import api from '@/api'
import type { LearningPlan, LearningProgress, LearningProgressInput } from '@/types/learning'

export async function getLearningPlan(): Promise<LearningPlan> {
  const { data } = await api.get<LearningPlan>('/learning/plan/')
  return data
}

export async function getLearningProgress(): Promise<LearningProgress[]> {
  const { data } = await api.get<{ items: LearningProgress[] }>('/learning/progress/')
  return data.items
}

export async function saveLearningProgress(
  nodeId: string,
  input: LearningProgressInput,
): Promise<LearningProgress> {
  const { data } = await api.put<LearningProgress>(
    `/learning/progress/${encodeURIComponent(nodeId)}/`,
    input,
  )
  return data
}
