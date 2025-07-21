import { ref } from 'vue';
import { useFormat } from './useFormat';

const GQL_QUERY = `
  query Transactions($first: Int, $last: Int, $after: String, $before: String, $chainId: String) {
    transactions(first: $first, last: $last, after: $after, before: $before, chainId: $chainId) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        node {
          hash
          cmd {
            meta {
              gasLimit
              chainId
              creationTime
              gasPrice
              sender
            }
          }
          result {
            ... on TransactionResult {
              gas
              block {
                height
                canonical
              }
            }
          }
        }
        cursor
      }
    }
  }
`;

const TOTAL_COUNT_QUERY = `
query TransactionCount {
  networkInfo {
    transactionCount
  }
}
`;

const transactions = ref<any[]>([]);
const loading = ref(true);
const { formatRelativeTime, formatGasPrice } = useFormat();
const pageInfo = ref<any>(null);
const totalCount = ref(0);
const rowsToShow = ref(25);

export const useTransactions = () => {
  const clearState = () => {
    transactions.value = [];
    loading.value = true;
    pageInfo.value = null;
  };

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value;
  };

  const fetchTotalCount = async ({ networkId }: { networkId: string }) => {
    if (!networkId) return;
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: { 
          query: TOTAL_COUNT_QUERY,
          networkId,
        },
      });
      totalCount.value = response?.data?.networkInfo?.transactionCount || 0;
    } catch (error) {
      console.error('Error fetching total block count:', error);
    }
  };

  const fetchTransactions = async ({
    networkId,
    after,
    before,
    toLastPage = false,
    chainId,
  }: {
    networkId: string,
    after?: string,
    before?: string,
    toLastPage?: boolean,
    chainId?: string,
  }) => {
    if (!networkId) return;
    loading.value = transactions.value.length === 0;
    try {
      const isForward = !!after || (!after && !before);
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? rowsToShow.value : isForward ? null : rowsToShow.value,
            after,
            before,
            chainId,
          },
          networkId,
        }
      });

      const result = response?.data?.transactions;
      pageInfo.value = result?.pageInfo || null;
      totalCount.value = result?.totalCount || 0;

      const rawTxs = result?.edges || [];
      transactions.value = rawTxs.map((edge: any) => {
        return {
          requestKey: edge.node.hash,
          height: edge.node.result.block?.height,
          canonical: edge.node.result.block?.canonical,
          chainId: edge.node.cmd.meta.chainId,
          time: formatRelativeTime(edge.node.cmd.meta.creationTime),
          sender: edge.node.cmd.meta.sender,
          gasPrice: formatGasPrice(parseFloat(edge.node.cmd.meta.gasPrice)),
          rawGasPrice: edge.node.cmd.meta.gasPrice,
          gas: edge.node.result.gas,
          gasLimit: new Intl.NumberFormat().format(edge.node.cmd.meta.gasLimit),
          rawGasLimit: edge.node.cmd.meta.gasLimit,
          cursor: edge.cursor,
        };
      });
    } catch (error) {
      console.error('Error fetching or processing transactions:', error);
      transactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    transactions,
    loading,
    fetchTransactions,
    pageInfo,
    totalCount,
    fetchTotalCount,
    rowsToShow,
    updateRowsToShow,
    clearState,
  };
}; 