import { useState } from '#app';

const useTransactionCount = () => useState<{ transactionCount: number, averageTransactionPerSecond: number }>('transaction-count', () => ({
  transactionCount: 0,
  averageTransactionPerSecond: 0,
}));
const transactionCountProcessed = ref(new Map());
const MAX_KEY_LIMIT = 100;

const resetTransactionCount = () => {
  const stats = useTransactionCount();
  stats.value.transactionCount = 0;
  stats.value.averageTransactionPerSecond = 0;
};

const updateTransactionCount = (height: number, chainId: number, transactionsInBlock: number, createdAt: string) => {
  const key = `${height}-${chainId}`;
  if (transactionCountProcessed.value.has(key)) {
    return;
  }
  const transactionCountInMap = { createdAt, count: transactionsInBlock };
  transactionCountProcessed.value.set(key, transactionCountInMap);

  const stats = useTransactionCount();
  stats.value.transactionCount += transactionsInBlock;

  // Provisional TPS logging (without changing UI behavior):
  // Compute TPS using the current window even if it's < MAX_KEY_LIMIT.
  try {
    const entries = Array.from(transactionCountProcessed.value.values());
    if (entries.length >= 2) {
      const sortedByTime = entries.sort(
        (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const first = sortedByTime[0];
      const last = sortedByTime[sortedByTime.length - 1];
      const windowSeconds = (new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()) / 1000;
      const totalTxInWindow = entries.reduce((sum: number, entry: any) => sum + entry.count, 0);
      const provisionalTps = windowSeconds > 0 ? totalTxInWindow / windowSeconds : 0;
      // eslint-disable-next-line no-console
      console.debug('[TPS] windowSize=', entries.length, 'totalTx=', totalTxInWindow, 'windowSeconds=', windowSeconds.toFixed(1), 'provisionalTPS=', provisionalTps.toFixed(2));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[TPS] provisional computation failed', err);
  }

  if (transactionCountProcessed.value.size > MAX_KEY_LIMIT) {
    // Sort the map by creation time
    const toDeleteCount = transactionCountProcessed.value.size - MAX_KEY_LIMIT;
    const sortedEntries = Array.from(transactionCountProcessed.value.entries()).sort(
      (a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime()
    );

    // Calculate TPS
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const timeDifferenceInSeconds = (new Date(lastEntry[1].createdAt).getTime() - new Date(firstEntry[1].createdAt).getTime()) / 1000;
    const totalTransactionsInMap = Array.from(transactionCountProcessed.value.values()).reduce((sum, entry) => sum + entry.count, 0);

    // Manages the map size to avoid memory leaks
    for (let i = 0; i < toDeleteCount; i++) {
      transactionCountProcessed.value.delete(sortedEntries[i][0]);
      stats.value.averageTransactionPerSecond = totalTransactionsInMap / timeDifferenceInSeconds;
    }
  }
};

export { updateTransactionCount, useTransactionCount, resetTransactionCount }; 