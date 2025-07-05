import { useState } from '#app';

const useTransactionCount = () => useState<{ transactionCount: number }>('transaction-count', () => ({
  transactionCount: 0,
}));
const transactionCountProcessed = ref(new Map());
const MAX_KEY_LIMIT = 100;

const updateTransactionCount = (height: number, chainId: number, transactionsInBlock: number, createdAt: string) => {
  const key = `${height}-${chainId}`;
  if (transactionCountProcessed.value.has(key)) {
    return;
  }
  transactionCountProcessed.value.set(key, createdAt);

  const stats = useTransactionCount();
  stats.value.transactionCount += transactionsInBlock;

  if (transactionCountProcessed.value.size > MAX_KEY_LIMIT) {
    const toDeleteCount = transactionCountProcessed.value.size - MAX_KEY_LIMIT;
    const sortedEntries = Array.from(transactionCountProcessed.value.entries()).sort(
      (a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime()
    );
    for (let i = 0; i < toDeleteCount; i++) {
      transactionCountProcessed.value.delete(sortedEntries[i][0]);
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
  const stats = useTransactionCount();

  try {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: { query },
    });

    if (response.data && response.data.networkInfo) {
      stats.value.transactionCount = response.data.networkInfo.transactionCount;
    }
  } catch (e) {
    console.error('Failed to fetch initial transaction count:', e);
    stats.value.transactionCount = 0;
  }
};

export { useTransactionCount, fetchInitialTransactionCount, updateTransactionCount }; 