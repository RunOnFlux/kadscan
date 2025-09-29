import { ref } from 'vue'
import { applyThemeAttribute, readStoredTheme, writeStoredTheme } from '~/lib/theme'

export type AppTheme = 'light' | 'dim' | 'dark'

const currentTheme = ref<AppTheme>(readStoredTheme())

export function useTheme() {
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


