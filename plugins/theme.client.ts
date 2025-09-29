import { defineNuxtPlugin } from '#app'
import { initThemeFromStorage } from '~/lib/theme'

export default defineNuxtPlugin(() => {
  initThemeFromStorage()
})


