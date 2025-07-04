import { useState } from '#app';

const useTransactionCount = () => useState<number | null>('transaction-count', () => null);
const useProcessedHeights = () => useState<Set<string>>('processed-heights', () => new Set());

const updateTransactionCount = (count: number, height: number, chainId: number) => {
  const transactionCount = useTransactionCount();
  const processedHeights = useProcessedHeights();
  const key = `${height}-${chainId}`;

  if (processedHeights.value.has(key)) {
    return;
  }

  if (transactionCount.value !== null) {
    transactionCount.value += count;
  }

  processedHeights.value.add(key);
};

const fetchInitialTransactionCount = async () => {
  const transactionCount = useTransactionCount();
  const GRAPHQL_URL = 'https://mainnet.kadindexer.io/graphql';
  const query = `
    query NetworkInfo {
      networkInfo {
        transactionCount
      }
    }
  `;

  try {
    const response: any = await $fetch(GRAPHQL_URL, {
      method: 'POST',
      body: { query },
    });

    if (response.data && response.data.networkInfo) {
      transactionCount.value = response.data.networkInfo.transactionCount;
    }
  } catch (e) {
    console.error('Failed to fetch initial transaction count:', e);
    transactionCount.value = null;
  }
};

export { useTransactionCount, fetchInitialTransactionCount, updateTransactionCount }; 