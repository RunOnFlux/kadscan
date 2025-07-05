import { ref, computed, onMounted, watch } from 'vue';
import { useTransactionWss } from '~/composables/useTransactionWss';
import { useCustomCardSettings } from '~/composables/useCustomCardSettings';

export const useTransactionFeed = () => {
  const regularTransactions = ref(new Map());
  const coinbaseTransactions = ref(new Map());
  const { getPreset } = useCustomCardSettings();
  const cardPreset = getPreset('transactions');

  const sortedTransactionGroups = computed(() => {
    const sourceMap = cardPreset.value === 'latest-coinbase-transactions'
      ? coinbaseTransactions.value
      : regularTransactions.value;
    return Array.from(sourceMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    try {
      const response: any = await $fetch('/api/graphql', {
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
        const allRegularTxs: any[] = [];
        const allCoinbaseTxs: any[] = [];

        responseData.edges.forEach((edge: any) => {
          if (edge.node.transactions && edge.node.transactions.edges) {
            edge.node.transactions.edges.forEach((txEdge: any) => {
              const tx = txEdge.node;
              const fee = (tx.result.gas || 0) * parseFloat(tx.cmd.meta.gasPrice || '0');
              const transaction = {
                hash: tx.hash,
                createdAt: tx.cmd.meta.creationTime,
                sender: tx.cmd.meta.sender,
                chainId: tx.cmd.meta.chainId,
                fee,
              };

              if (tx.cmd.meta.sender === 'coinbase') {
                allCoinbaseTxs.push(transaction);
              } else {
                allRegularTxs.push(transaction);
              }
            });
          }
        });

        const sortedRegular = allRegularTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
        const sortedCoinbase = allCoinbaseTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

        regularTransactions.value.clear();
        coinbaseTransactions.value.clear();
        sortedRegular.forEach(tx => regularTransactions.value.set(tx.hash, tx));
        sortedCoinbase.forEach(tx => coinbaseTransactions.value.set(tx.hash, tx));
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

      const targetMap = tx.cmd.meta.sender === 'coinbase' ? coinbaseTransactions.value : regularTransactions.value;
      targetMap.set(newTransaction.hash, newTransaction);

      if (targetMap.size > MAX_TRANSACTIONS) {
        const sorted = Array.from(targetMap.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const toDeleteCount = targetMap.size - MAX_TRANSACTIONS;
        for (let i = 0; i < toDeleteCount; i++) {
          targetMap.delete(sorted[i].hash);
        }
      }
    });
  }, { deep: true });

  onMounted(async () => {
    await fetchInitialTransactions();
    startSubscription();
  });

  return {
    sortedTransactionGroups,
  };
};
