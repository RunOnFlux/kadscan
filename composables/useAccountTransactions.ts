import { ref, readonly } from 'vue';
import { useFormat } from './useFormat';

const GQL_QUERY = `
  query Transactions($accountName: String, $after: String, $before: String, $first: Int, $last: Int, $chainId: String) {
    transactions(accountName: $accountName, after: $after, before: $before, first: $first, last: $last, chainId: $chainId) {
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
              chainId
              creationTime
              gasLimit
              gasPrice
              sender
              ttl
            }
          }
          result {
            ... on TransactionResult {
              badResult
              gas
              block {
                chainId
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

const transactions = ref<any[]>([]);
const loading = ref(true);
const { formatRelativeTime, formatGasPrice } = useFormat();
const pageInfo = ref<any>(null);
const totalCount = ref(0);
const rowsToShow = ref(10);
const error = ref<any>(null);

export const useAccountTransactions = () => {
  const clearState = () => {
    transactions.value = [];
    loading.value = true;
    pageInfo.value = null;
    error.value = null;
  };

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value;
  };

  const fetchAccountTransactions = async ({
    networkId,
    accountName,
    after,
    before,
    toLastPage = false,
    chainId,
  }: {
    networkId: string,
    accountName: string,
    after?: string,
    before?: string,
    toLastPage?: boolean,
    chainId?: string,
  }) => {
    if (!networkId || !accountName) return;
    loading.value = transactions.value.length === 0;
    error.value = null;

    try {
      const isForward = !!after || (!after && !before);
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            accountName,
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? rowsToShow.value : isForward ? null : rowsToShow.value,
            after,
            before,
            chainId,
          },
          networkId,
        },
      });

      const result = response?.data?.transactions;
      pageInfo.value = result?.pageInfo || null;
      totalCount.value = result?.totalCount || 0;

      if (result === undefined || result.edges.length === 0) {
        transactions.value = [];
        return;
      }

      console.log('result', result)

      const rawTxs = result?.edges || [];
      transactions.value = rawTxs.map((edge: any) => ({
        requestKey: edge.node.hash,
        height: edge.node.result.block?.height,
        canonical: edge.node.result.block?.canonical,
        badResult: edge.node.result.badResult,
        chainId: edge.node.cmd.meta.chainId,
        time: formatRelativeTime(edge.node.cmd.meta.creationTime),
        sender: edge.node.cmd.meta.sender,
        gasPrice: formatGasPrice(parseFloat(edge.node.cmd.meta.gasPrice)),
        rawGasPrice: edge.node.cmd.meta.gasPrice,
        gas: edge.node.result.gas,
        gasLimit: new Intl.NumberFormat().format(edge.node.cmd.meta.gasLimit),
        rawGasLimit: edge.node.cmd.meta.gasLimit,
        cursor: edge.cursor,
      }));
    } catch (e) {
      console.error('Error fetching or processing account transactions:', e);
      error.value = e;
      transactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    error: readonly(error),
    transactions: readonly(transactions),
    loading: readonly(loading),
    fetchAccountTransactions,
    pageInfo: readonly(pageInfo),
    totalCount: readonly(totalCount),
    rowsToShow: readonly(rowsToShow),
    updateRowsToShow,
    clearState,
  };
};