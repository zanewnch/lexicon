export type ThemeMode = 'dark' | 'light' | 'system'

const THEME_STORAGE_KEY = 'lexicon.theme'
const THEME_CHANNEL_NAME = 'lexicon-theme'
const DEFAULT_THEME: ThemeMode = 'dark'
export const THEME_CHANGE_EVENT = 'lexicon:theme-change'

let themeChannel: BroadcastChannel | undefined
let systemThemeQuery: MediaQueryList | undefined

export function initializeTheme(): ThemeMode {
  const mode = getThemeMode()

  if (!systemThemeQuery) {
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeQuery.addEventListener('change', () => {
      if (getThemeMode() === 'system') applyTheme('system')
    })
  }

  applyTheme(mode)

  if (!themeChannel && typeof BroadcastChannel !== 'undefined') {
    themeChannel = new BroadcastChannel(THEME_CHANNEL_NAME)
    themeChannel.addEventListener('message', (event: MessageEvent<ThemeMode>) => {
      if (isThemeMode(event.data)) applyTheme(event.data)
    })
  }

  window.addEventListener('storage', (event) => {
    if (event.key === THEME_STORAGE_KEY && isThemeMode(event.newValue)) applyTheme(event.newValue)
  })

  return mode
}

export function getThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function setTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // The current renderer can still apply the theme even when storage is unavailable.
  }

  applyTheme(mode)
  themeChannel?.postMessage(mode)
}

function applyTheme(mode: ThemeMode): void {
  const resolvedTheme = mode === 'system' ? (systemThemeQuery?.matches ? 'dark' : 'light') : mode
  document.documentElement.dataset.theme = resolvedTheme
  document.documentElement.dataset.themeMode = mode
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: mode }))
}

function isThemeMode(value: string | null | unknown): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'system'
}
