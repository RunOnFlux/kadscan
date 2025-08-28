import { ref } from 'vue';
import { useFormat } from './useFormat';

const GQL_QUERY = `
  query TransactionsByPactCode($pactCode: String!, $after: String, $before: String, $first: Int, $last: Int) {
    transactionsByPactCode(pactCode: $pactCode, after: $after, before: $before, first: $first, last: $last) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        node {
          requestKey
          canonical
          chainId
          creationTime
          badResult
          gas
          gasLimit
          gasPrice
          height
          sender
        }
        cursor
      }
    }
  }
`;

const transactions = ref<any[]>([]);
const loading = ref(true);
const pageInfo = ref<any>(null);
const rowsToShow = ref(25);
const error = ref<any>(null);
const totalCount = ref<number | null>(null);
const { formatRelativeTime, formatGasPrice } = useFormat();

export const useTransactionsByPactCode = () => {
  const clearState = () => {
    transactions.value = [];
    loading.value = true;
    pageInfo.value = null;
    error.value = null;
  };

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value;
  };

  const fetchTransactionsByCode = async ({
    networkId,
    pactCode,
    after,
    before,
  }: {
    networkId: string,
    pactCode: string,
    after?: string,
    before?: string,
  }) => {
    if (!networkId || !pactCode) return;
    loading.value = transactions.value.length === 0;
    error.value = null;

    try {
      const isForward = !!after || (!after && !before);

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            pactCode,
            first: isForward ? rowsToShow.value : null,
            last: isForward ? null : rowsToShow.value,
            after,
            before,
          },
          networkId,
        }
      });

      const result = response?.data?.transactionsByPactCode;
      pageInfo.value = result?.pageInfo || null;
      totalCount.value = null; // unknown

      if (!result || result.edges.length === 0) {
        transactions.value = [];
        return;
      }

      const rawTxs = result.edges;

      transactions.value = rawTxs.map((edge: any) => {
        const n = edge.node;
        return {
          requestKey: n.requestKey,
          height: n.height,
          canonical: n.canonical,
          badResult: n.badResult,
          chainId: n.chainId,
          time: formatRelativeTime(n.creationTime),
          sender: n.sender,
          gasPrice: formatGasPrice(parseFloat(n.gasPrice)),
          rawGasPrice: n.gasPrice,
          gas: n.gas,
          gasLimit: new Intl.NumberFormat().format(n.gasLimit),
          rawGasLimit: n.gasLimit,
          cursor: edge.cursor,
        };
      });
    } catch (e) {
      console.error('Error fetching code transactions:', e);
      error.value = e;
      transactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    error,
    transactions,
    loading,
    fetchTransactionsByCode,
    pageInfo,
    totalCount,
    rowsToShow,
    updateRowsToShow,
    clearState,
  };
};


