import { englishApi, onEnglishTheme } from '@/api/english'
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * 所有支援的主題識別碼。
 * 對應 CSS 的 `data-theme` attribute 值。
 */
export type ThemeId = 'midnight' | 'light' | 'ocean' | 'terminal' | 'violet' | 'sand' | 'sakura' | 'aurora' | 'caramel' | 'glacier' | 'amber' | 'mint' | 'bloodmoon' | 'graphite' | 'cyberpunk' | 'military' | 'polaris' | 'glass' | 'neon' | 'holo' | 'clay'

/**
 * 主題選項的資料結構，用於設定頁面的主題選擇器。
 */
export interface ThemeOption {
  /** 主題唯一識別碼，同時也是 CSS `data-theme` 的值 */
  id: ThemeId
  /** 顯示給使用者閱讀的主題名稱（中文） */
  name: string
  /** 預覽色塊的 CSS 顏色值，用於主題選擇器的小方塊 */
  preview: string // CSS color for the preview swatch
}

/**
 * 所有可用主題的清單。
 * 目前共 17 種主題，包含深色、淺色和特殊主題。
 */
export const themes: ThemeOption[] = [
  { id: 'midnight', name: '深夜黑', preview: '#0a0e17' },
  { id: 'light', name: '淺色', preview: '#f8fafc' },
  { id: 'ocean', name: '海洋藍', preview: '#162544' },
  { id: 'terminal', name: '終端綠', preview: '#0a0a0a' },
  { id: 'violet', name: '紫羅蘭', preview: '#231d32' },
  { id: 'sand', name: '暖沙', preview: '#faf6f1' },
  { id: 'sakura', name: '櫻花', preview: '#fdf2f4' },
  { id: 'aurora', name: '極光', preview: '#14222e' },
  { id: 'caramel', name: '焦糖', preview: '#2c2220' },
  { id: 'glacier', name: '冰川', preview: '#f0f4f8' },
  { id: 'amber', name: '琥珀', preview: '#261e14' },
  { id: 'mint', name: '薄荷', preview: '#f0faf6' },
  { id: 'bloodmoon', name: '血月', preview: '#241414' },
  { id: 'graphite', name: '石墨', preview: '#28292c' },
  { id: 'cyberpunk', name: '賽博朋克', preview: '#1a0a3e' },
  { id: 'military', name: '軍綠', preview: '#1e2814' },
  { id: 'polaris', name: '北極星', preview: '#162040' },
  { id: 'glass', name: '玻璃漸層', preview: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)' },
  { id: 'neon', name: '暗黑霓虹', preview: '#050505' },
  { id: 'holo', name: '全息幻彩', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'clay', name: '柔和微擬物', preview: '#f0f0f3' },
]

/**
 * 從 localStorage 讀取上次儲存的主題，若不合法則回傳預設主題 `'glass'`。
 * @returns 儲存的 ThemeId，或 `'glass'`（找不到或不合法時）
 */
function loadTheme(): ThemeId {
  const stored = localStorage.getItem('theme')
  if (stored && themes.some((t) => t.id === stored)) return stored as ThemeId
  return 'glass'
}

/**
 * 將指定主題套用到文件根元素，並儲存到 localStorage。
 * 透過設定 `document.documentElement[data-theme]`，讓 CSS 變數自動切換。
 * @param id - 要套用的主題識別碼
 */
function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id)
  localStorage.setItem('theme', id)
}

/**
 * 全域應用程式 Pinia store。
 *
 * 負責管理：
 * - **主題切換**：讀取 / 儲存使用者選擇的 UI 主題
 *
 * 使用方式：
 * ```ts
 * const appStore = useAppStore()
 * appStore.setTheme('ocean')
 * console.log(appStore.currentTheme) // 'ocean'
 * ```
 */
export const useAppStore = defineStore('app', () => {
  /** 目前套用的主題，初始值從 localStorage 讀取 */
  const currentTheme = ref<ThemeId>(loadTheme())

  // Apply theme on init
  applyTheme(currentTheme.value)

  // 當 currentTheme 改變時自動套用
  watch(currentTheme, (id) => applyTheme(id))

  /**
   * 切換主題。
   * @param id - 要切換到的主題識別碼
   */
  function setTheme(id: ThemeId) {
    currentTheme.value = id
    void englishApi.setSetting('unus-theme', id).catch(() => {})
  }

  async function syncSharedTheme() {
    try {
      const saved = await englishApi.getSetting('unus-theme')
      if (saved && themes.some((theme) => theme.id === saved)) currentTheme.value = saved as ThemeId
      else await englishApi.setSetting('unus-theme', currentTheme.value)
    } catch { /* The connection banner offers retry while the service starts. */ }
  }
  onEnglishTheme((id) => { if (themes.some((theme) => theme.id === id)) currentTheme.value = id as ThemeId })
  void syncSharedTheme()


  return {
    currentTheme, setTheme,
  }
})
