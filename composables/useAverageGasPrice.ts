import { useState } from '#app';

const useGasPriceStats = () => useState<{ totalGasPrice: number; txCount: number }>('gas-price-stats', () => ({
  totalGasPrice: 0,
  txCount: 0,
}));
const gasPriceProcessed = ref(new Map());
const MAX_HASH_LIMIT = 100;

const updateGasPriceStats = (gasPrice: number, hash: string, createdAt: string) => {
  if (gasPriceProcessed.value.has(hash)) {
    return;
  }
  gasPriceProcessed.value.set(hash, createdAt);

  const stats = useGasPriceStats();
  stats.value.txCount += 1;
  stats.value.totalGasPrice += gasPrice;

  if (gasPriceProcessed.value.size > MAX_HASH_LIMIT) {
    const toDeleteCount = gasPriceProcessed.value.size - MAX_HASH_LIMIT;

    const sortedEntries = Array.from(gasPriceProcessed.value.entries()).sort(
      (a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime()
    );

    for (let i = 0; i < toDeleteCount; i++) {
      const hashToDelete = sortedEntries[i][0];
      gasPriceProcessed.value.delete(hashToDelete);
    }
  }
};

export { useGasPriceStats, updateGasPriceStats }; 