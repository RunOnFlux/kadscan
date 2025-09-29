export type AppTheme = 'light' | 'dim' | 'dark'

const THEME_STORAGE_KEY = 'theme'

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function readStoredTheme(): AppTheme {
  if (!isClient()) return 'light'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === 'light' || raw === 'dim' || raw === 'dark') return raw
  } catch {}
  return 'light'
}

export function writeStoredTheme(theme: AppTheme): void {
  if (!isClient()) return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
}

export function applyThemeAttribute(theme: AppTheme): void {
  if (!isClient()) return
  const root = document.documentElement
  // Ensure legacy .dark class does not interfere
  root.removeAttribute('class')
  root.setAttribute('data-theme', theme)
}

export function initThemeFromStorage(): AppTheme {
  const theme = readStoredTheme()
  applyThemeAttribute(theme)
  return theme
}


