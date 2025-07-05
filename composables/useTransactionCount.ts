import { useState } from '#app';

const useTransactionCount = () => useState<number | null>('transaction-count', () => null);
const useProcessedHeights = () => useState<Set<string>>('processed-heights', () => new Set());

const updateTransactionCount = (blocks: any[]) => {
  const transactionCount = useTransactionCount();
  const processedHeights = useProcessedHeights();

  blocks.forEach(block => {
    const key = `${block.height}-${block.chainId}`;
    if (processedHeights.value.has(key)) {
      return;
    }

    if (transactionCount.value !== null && block.transactions?.totalCount > 0) {
      transactionCount.value += block.transactions.totalCount;
    }
    processedHeights.value.add(key);
  });

  while (processedHeights.value.size > 6) {
    const oldestKey = processedHeights.value.values().next().value;
    if (oldestKey) {
      processedHeights.value.delete(oldestKey);
    } else {
      break;
    }
  }
};

const query = `
  query NetworkInfo {
    networkInfo {
      transactionCount
    }
  }
`;

const fetchInitialTransactionCount = async () => {
  const transactionCount = useTransactionCount();

  try {
    const response: any = await $fetch('/api/graphql', {
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