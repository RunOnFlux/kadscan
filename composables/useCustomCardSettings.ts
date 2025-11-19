import { useStorage } from '@vueuse/core'

export type CardType = 'blocks' | 'transactions';

export const useCustomCardSettings = () => {
  const blockCardPreset = useStorage('custom-card-preset-blocks', 'recent-blocks');
  const transactionCardPreset = useStorage('custom-card-preset-transactions', 'recent-transactions');

  const getPreset = (cardType: CardType) => {
    return cardType === 'blocks' ? blockCardPreset : transactionCardPreset;
  };

  return {
    getPreset,
  }
} 