export type NoteCategory = '學習概念' | '選股策略' | '產業研究' | '個股筆記' | '操盤日誌' | '其他'

export interface Note {
  id: string
  title: string
  content: string
  category: NoteCategory
  tags: string[]
  createdAt: string
  updatedAt: string
  pinned: boolean
}
