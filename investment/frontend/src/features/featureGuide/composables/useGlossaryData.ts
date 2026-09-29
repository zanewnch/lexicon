import { ref } from 'vue'
import api from '@/api'

export interface GlossaryTermData {
  key: string
  term: string
  description: string
  category: string
  example: string
}

interface CategoryGroup {
  id: string
  name: string
  terms: GlossaryTermData[]
}

// module-level cache：只 fetch 一次
const allTerms = ref<GlossaryTermData[]>([])
const categories = ref<CategoryGroup[]>([])
const glossaryMap = ref<Record<string, GlossaryTermData>>({})
const indexDescriptionMap = ref<Record<string, string>>({})
let fetchPromise: Promise<void> | null = null

async function _load() {
  const { data } = await api.get<GlossaryTermData[]>('/glossary/')
  allTerms.value = data

  glossaryMap.value = Object.fromEntries(data.map(t => [t.key, t]))

  indexDescriptionMap.value = Object.fromEntries(
    data.filter(t => t.category === '市場指數').map(t => [t.term, t.description]),
  )

  const grouped: Record<string, CategoryGroup> = {}
  for (const t of data) {
    if (!grouped[t.category]) {
      grouped[t.category] = { id: t.category, name: t.category, terms: [] }
    }
    grouped[t.category]!.terms.push(t)
  }
  categories.value = Object.values(grouped)
}

export function useGlossaryData() {
  if (!fetchPromise) fetchPromise = _load()
  return { allTerms, categories, glossaryMap, indexDescriptionMap, ready: fetchPromise }
}
