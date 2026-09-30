<script setup lang="ts">
import { ref, watch } from 'vue'
import TabBar from '@/components/ui/TabBar.vue'
import SettingsAPI from '@/features/settings/components/SettingsAPI.vue'
import SettingsTrading from '@/features/settings/components/SettingsTrading.vue'
import SettingsNotifications from '@/features/settings/components/SettingsNotifications.vue'
import SettingsAlerts from '@/features/settings/components/SettingsAlerts.vue'
import SettingsDisplay from '@/features/settings/components/SettingsDisplay.vue'
import SettingsProfile from '@/features/settings/components/SettingsProfile.vue'

import { useRoute, useRouter } from 'vue-router'
import EnglishSettings from '@/features/english/components/EnglishSettings.vue'
import '@/features/english/english.scss'
const route = useRoute()
const router = useRouter()
const tabs = [
  { key: 'general', label: '一般設定' },
  { key: 'profile', label: '個人資料' },
  { key: 'english', label: '英文平台' },
]

const activeTab = ref(['general', 'profile', 'english'].includes(String(route.query.tab)) ? String(route.query.tab) : 'general')
watch(activeTab, (tab) => void router.replace({ query: { ...route.query, tab } }))
watch(() => route.query.tab, (tab) => { activeTab.value = ['general', 'profile', 'english'].includes(String(tab)) ? String(tab) : 'general' })
</script>

<template>
  <div class="settings">
    <div class="settings__header">
      <h1 class="settings__title">設定</h1>
    </div>

    <TabBar v-model="activeTab" :tabs="tabs" variant="underline" />

    <div v-if="activeTab === 'general'" class="settings__layout">
      <SettingsAPI />
      <SettingsTrading />
      <SettingsNotifications />
      <SettingsAlerts />
      <SettingsDisplay />
    </div>

    <div v-else-if="activeTab === 'english'" class="english-workspace"><EnglishSettings /></div>
    <div v-else-if="activeTab === 'profile'">
      <SettingsProfile />
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .settings {
    &__layout {
      gap: var(--gap-md);
    }

    &__title {
      font-size: var(--font-size-lg);
    }
  }
}
</style>
