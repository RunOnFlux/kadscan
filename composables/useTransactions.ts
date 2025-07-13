import { ref } from 'vue';
import { useFormat } from './useFormat';

const GQL_QUERY = `
  query Transactions($first: Int, $last: Int, $after: String, $before: String) {
    transactions(first: $first, last: $last, after: $after, before: $before) {
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
              gasPrice
              sender
            }
          }
          result {
            ... on TransactionResult {
              gas
              block {
                height
              }
            }
          }
        }
        cursor
      }
    }
  }
`;

export const useTransactions = () => {
  const transactions = ref<any[]>([]);
  const loading = ref(false);
  const { formatRelativeTime, formatGasPrice } = useFormat();
  const pageInfo = ref<any>(null);
  const totalCount = ref(0);

  const fetchTransactions = async ({
    networkId,
    limit,
    after,
    before,
  }: {
    networkId: string,
    limit: number,
    after?: string,
    before?: string,
  }) => {
    if (!networkId) return;
    loading.value = true;
    try {
      const isForward = !!after || (!after && !before);
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            first: isForward ? limit : null,
            last: isForward ? null : limit,
            after,
            before,
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
          block: edge.node.result.block?.height,
          chainId: edge.node.cmd.meta.chainId,
          time: formatRelativeTime(edge.node.cmd.meta.creationTime),
          sender: edge.node.cmd.meta.sender,
          gasPrice: formatGasPrice(edge.node.cmd.meta.gasPrice),
          gas: edge.node.result.gas,
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
  };
}; 