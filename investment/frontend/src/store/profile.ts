import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/client'

export const useProfileStore = defineStore('profile', () => {
  const displayName = ref('')
  const avatarUrl = ref('')

  async function fetch() {
    const { data } = await api.get('/profile/')
    displayName.value = data.display_name
    avatarUrl.value = data.avatar_url ?? ''
  }

  async function saveName(name: string) {
    const { data } = await api.put('/profile/', { display_name: name })
    displayName.value = data.display_name
  }

  async function uploadAvatar(file: File) {
    const form = new FormData()
    form.append('avatar', file)
    const { data } = await api.post('/profile/avatar/', form)
    avatarUrl.value = data.avatar_url
  }

  async function removeAvatar() {
    await api.delete('/profile/avatar/')
    avatarUrl.value = ''
  }

  return { displayName, avatarUrl, fetch, saveName, uploadAvatar, removeAvatar }
})
