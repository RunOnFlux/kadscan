import { ref, computed, onMounted, watch } from 'vue';
import { useTransactionWss } from '~/composables/useTransactionWss';

export const useTransactionFeed = () => {
  const displayedTransactions = ref(new Map());

  const sortedTransactionGroups = computed(() => {
    return Array.from(displayedTransactions.value.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  const { startSubscription, newTransactions } = useTransactionWss();

  const homeTransactionsQuery = `
    query HomeTxListInit($heightCount: Int, $completedHeights: Boolean, $first: Int, $transactionsFirst2: Int) {
      completedBlockHeights(heightCount: $heightCount, completedHeights: $completedHeights, first: $first) {
        edges {
          node {
            transactions(first: $transactionsFirst2) {
              edges {
                node {
                  cmd {
                    meta {
                      chainId
                      creationTime
                      gasPrice
                      sender
                    }
                  }
                  result {
                    ... on TransactionResult {
                      gas
                    }
                  }
                  hash
                }
              }
            }
            height
          }
        }
      }
    }
  `;

  const fetchInitialTransactions = async () => {
    const GRAPHQL_URL = 'https://mainnet.kadindexer.io/graphql';

    try {
      const response: any = await $fetch(GRAPHQL_URL, {
        method: 'POST',
        body: {
          query: homeTransactionsQuery,
          variables: {
            heightCount: 1,
            completedHeights: false,
            first: 6,
            transactionsFirst2: 10,
          },
        },
      });

      const responseData = response?.data?.completedBlockHeights;

      if (responseData && responseData.edges) {
        const allTransactions: any[] = [];
        responseData.edges.forEach((edge: any) => {
          if (edge.node.transactions && edge.node.transactions.edges) {
            edge.node.transactions.edges.forEach((txEdge: any) => {
              const tx = txEdge.node;
              const fee = (tx.result.gas || 0) * parseFloat(tx.cmd.meta.gasPrice || '0');
              allTransactions.push({
                hash: tx.hash,
                createdAt: tx.cmd.meta.creationTime,
                sender: tx.cmd.meta.sender,
                chainId: tx.cmd.meta.chainId,
                fee,
              });
            });
          }
        });

        const sortedTxs = allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestTxs = sortedTxs.slice(0, 6);

        latestTxs.forEach(tx => {
            displayedTransactions.value.set(tx.hash, tx);
        });
      }
    } catch (e) {
      console.error('Failed to fetch initial transactions:', e);
    }
  };

  watch(newTransactions, (latestTransactions) => {
    const MAX_TRANSACTIONS = 6;
    latestTransactions.forEach((tx: any) => {
      const fee = (tx.result.gas || 0) * parseFloat(tx.cmd.meta.gasPrice || '0');
      const newTransaction = {
        hash: tx.hash,
        createdAt: tx.cmd.meta.creationTime,
        sender: tx.cmd.meta.sender,
        chainId: tx.cmd.meta.chainId,
        fee,
      };

      displayedTransactions.value.set(newTransaction.hash, newTransaction);
    });

    if (displayedTransactions.value.size > MAX_TRANSACTIONS) {
      const sorted = Array.from(displayedTransactions.value.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const toDeleteCount = displayedTransactions.value.size - MAX_TRANSACTIONS;
      for (let i = 0; i < toDeleteCount; i++) {
        displayedTransactions.value.delete(sorted[i].hash);
      }
    }
  }, { deep: true });

  onMounted(async () => {
    await fetchInitialTransactions();
    startSubscription();
  });

  return {
    sortedTransactionGroups,
  };
};
