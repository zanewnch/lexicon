import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { featureGuideModules, featureGuideMap } from '@/data/featureGuide'

export function useFeatureGuide(initialId?: string) {
  const route = useRoute()
  const activeModuleId = ref(initialId ?? featureGuideModules[0]?.id ?? '')
  const searchQuery = ref('')

  const activeModule = computed(
    () => featureGuideMap[activeModuleId.value] ?? featureGuideModules[0]!,
  )

  const filteredModules = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return featureGuideModules
    return featureGuideModules.filter(
      m =>
        m.label.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.features.some(f => f.label.toLowerCase().includes(q)),
    )
  })

  watch(
    () => route.params.moduleId,
    id => {
      if (id && featureGuideMap[id as string]) {
        activeModuleId.value = id as string
      }
    },
    { immediate: true },
  )

  return { activeModuleId, activeModule, searchQuery, filteredModules, featureGuideModules }
}
