import { useStorage } from '@vueuse/core'

export const useCustomCardSettings = () => {
  const cardPreset = useStorage('custom-card-preset', 'latest-transactions')

  return {
    cardPreset,
  }
} 