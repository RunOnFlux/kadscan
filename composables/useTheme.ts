import { ref, onMounted } from 'vue'
import { applyThemeAttribute, readStoredTheme, writeStoredTheme } from '~/lib/theme'

export type AppTheme = 'light' | 'dim' | 'dark'

const currentTheme = ref<AppTheme>('light')
let didInitFromStorage = false

export function useTheme() {
  if (process.client && !didInitFromStorage) {
    didInitFromStorage = true
    onMounted(() => {
      const stored = readStoredTheme()
      currentTheme.value = stored
      applyThemeAttribute(stored)
      try { document.documentElement.setAttribute('data-theme-ready', '1') } catch {}
    })
  }
  function setTheme(theme: AppTheme) {
    currentTheme.value = theme
    writeStoredTheme(theme)
    applyThemeAttribute(theme)
  }

  return {
    theme: currentTheme,
    setTheme,
  }
}


