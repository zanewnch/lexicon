import { ref, computed } from 'vue'
import { useGlossaryData } from './useGlossaryData'

export function useGlossary() {
  const { categories, allTerms } = useGlossaryData()

  const searchQuery = ref('')
  const activeCategory = ref<string | null>(null)

  const groupedTerms = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return categories.value
      .filter(c => !activeCategory.value || c.name === activeCategory.value)
      .map(c => ({
        ...c,
        terms: c.terms.filter(t =>
          !q ||
          t.term.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q),
        ),
      }))
      .filter(c => c.terms.length > 0)
  })

  const totalCount = computed(() =>
    groupedTerms.value.reduce((sum, c) => sum + c.terms.length, 0),
  )

  return { searchQuery, activeCategory, groupedTerms, totalCount, glossaryCategories: categories }
}
