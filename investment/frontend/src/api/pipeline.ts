import api from '@/api'
import type {
  CommitRequestItem,
  CommitResponse,
  EntryParams,
  MatchResponse,
  SignalKey,
  TriggerMode,
} from '@/types/pipeline'

export interface MatchRequest {
  symbols: string[]
  signals: SignalKey[]
  params: EntryParams
  mode: TriggerMode
  lookback_days: number
}

export async function matchSignals(req: MatchRequest): Promise<MatchResponse> {
  const { data } = await api.post<MatchResponse>('/pipeline/match/', req)
  return data
}

export interface CommitRequest {
  items: CommitRequestItem[]
  meta: {
    timeframe: { preset: string; days: number }
    entry: { signals: SignalKey[]; params: EntryParams; triggerMode: TriggerMode }
    sizing: Record<string, number>
  }
}

export async function commitPipeline(req: CommitRequest): Promise<CommitResponse> {
  const { data } = await api.post<CommitResponse>('/pipeline/commit/', req)
  return data
}

export async function listPendingCandidates() {
  const { data } = await api.get<{ candidates: { id: number; symbol: string; meta: Record<string, unknown> }[] }>(
    '/pipeline/pending/',
  )
  return data
}
