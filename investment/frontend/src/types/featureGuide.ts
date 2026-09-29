export type UsageContext = '選股階段' | '進場前' | '持倉中' | '出場時' | '事後複盤' | '日常輔助'

export interface FeaturePoint {
  label: string
  detail?: string
}

export interface SubPageGuide {
  label: string
  path: string
  summary: string
}

export interface ModuleGuide {
  id: string
  label: string
  subtitle: string
  iconColor: string
  path: string
  summary: string
  whenToUse: string[]
  contexts: UsageContext[]
  features: FeaturePoint[]
  subPages?: SubPageGuide[]
  tips?: string[]
}
