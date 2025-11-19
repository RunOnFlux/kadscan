import { useState, useNuxtApp } from '#app';

const useGasPriceStats = () => useState<{ totalGasPrice: number; txCount: number }>('gas-price-stats', () => ({
  totalGasPrice: 0,
  txCount: 0,
}));
const useIsInitialGasPrice = () => useState<boolean>('is-initial-gas-price', () => false);
const gasPriceProcessed = ref(new Map());
const MAX_KEY_LIMIT = 100;

export const resetGasPriceStats = () => {
  const stats = useGasPriceStats();
  stats.value.totalGasPrice = 0;
  stats.value.txCount = 0;
  gasPriceProcessed.value.clear();
  useIsInitialGasPrice().value = false;
};

const homeTransactionsQuery = `
query AverageGasPrice($first: Int) {
  transactions(first: $first) {
    edges {
      node {
        hash
        cmd {
          meta {
            creationTime
            gasPrice
          }
        }
      }
    }
  }
}
`;

const fetchInitialGasPriceStats = async (networkId: string) => {
  const stats = useGasPriceStats();
  const isInitial = useIsInitialGasPrice();

  // Avoid re-fetching if we already have some data.
  if (stats.value.txCount > 0) {
    return;
  }

  try {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: homeTransactionsQuery,
        networkId: networkId,
        variables: {
          first: 20,
        },
      },
    });

    const responseData = response?.data?.transactions;

    if (responseData && responseData.edges) {
      let totalGas = 0;
      let count = 0;
      for (const edge of responseData.edges) {
        if (parseFloat(edge.node.cmd.meta.gasPrice) > 0) {
          totalGas += parseFloat(edge.node.cmd.meta.gasPrice);
          count++;
          // also populate the processed map
          gasPriceProcessed.value.set(edge.node.hash, edge.node.cmd.meta.creationTime);
        }
      }

      if (count > 0) {
        stats.value.totalGasPrice = totalGas;
        stats.value.txCount = count;
        isInitial.value = true;
      }
    }
  } catch (e) {
    console.error('Failed to fetch initial gas price stats:', e);
  }
}

const updateGasPriceStats = (gasPrice: number, hash: string, createdAt: string) => {
  if (gasPriceProcessed.value.has(hash)) {
    return;
  }
  useIsInitialGasPrice().value = false;
  gasPriceProcessed.value.set(hash, createdAt);

  const stats = useGasPriceStats();
  stats.value.txCount += 1;
  stats.value.totalGasPrice += gasPrice;

  if (gasPriceProcessed.value.size > MAX_KEY_LIMIT) {
    const toDeleteCount = gasPriceProcessed.value.size - MAX_KEY_LIMIT;
    const sortedEntries = Array.from(gasPriceProcessed.value.entries()).sort(
      (a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime()
    );
    for (let i = 0; i < toDeleteCount; i++) {
      gasPriceProcessed.value.delete(sortedEntries[i][0]);
    }
  }
};

export { useGasPriceStats, useIsInitialGasPrice, updateGasPriceStats, fetchInitialGasPriceStats }; 