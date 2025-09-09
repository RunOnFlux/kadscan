import { ref } from 'vue';
import { useFormat } from './useFormat';
import { extractPactCall, unescapeCodeString } from '~/composables/string'

const GQL_QUERY = `
  query Transactions(
    $first: Int,
    $last: Int,
    $after: String,
    $before: String,
    $chainId: String,
    $isCoinbase: Boolean,
    $minHeight: Int,
    $maxHeight: Int
  ) {
    transactions(
      first: $first,
      last: $last,
      after: $after,
      before: $before,
      chainId: $chainId,
      isCoinbase: $isCoinbase,
      minHeight: $minHeight,
      maxHeight: $maxHeight
    ) {
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
            payload {
              ... on ExecutionPayload {
                code
              }
            }
          }
          result {
            ... on TransactionResult {
              badResult
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

const transactions = ref<any[]>([]);
const loading = ref(true);
const { formatRelativeTime } = useFormat();
const pageInfo = ref<any>(null);
const totalCount = ref(0);
const rowsToShow = ref(25);
const error = ref<any>(null);

export const useTransactions = () => {
  const clearState = () => {
    transactions.value = [];
    loading.value = true;
    pageInfo.value = null;
    error.value = null;
  };

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value;
  };

  const fetchTransactions = async ({
    networkId,
    after,
    before,
    toLastPage = false,
    chainId,
    isCoinbase = false,
    minHeight,
    maxHeight,
  }: {
    networkId: string,
    after?: string,
    before?: string,
    toLastPage?: boolean,
    chainId?: string,
    isCoinbase?: boolean,
    minHeight?: number,
    maxHeight?: number,
  }) => {
    if (!networkId) return;
    loading.value = transactions.value.length === 0;
    
    // Reset error state at the beginning of each fetch
    error.value = null;
    
    try {
      // Validate optional filters
      if (chainId !== undefined && chainId !== null) {
        const n = Number(chainId);
        if (Number.isNaN(n)) {
          throw new Error('Chain Id provided is not a valid chain.');
        }
        if (!Number.isInteger(n) || n < 0 || n > 19) {
          throw new Error(`Chain Id ${n} doesn't exist.`);
        }
      }
      if (minHeight !== undefined) {
        const h = Number(minHeight);
        if (Number.isNaN(h) || h < 0) {
          throw new Error('Minimum block height is not valid.');
        }
      }
      if (maxHeight !== undefined) {
        const h = Number(maxHeight);
        if (Number.isNaN(h) || h < 0) {
          throw new Error('Maximum block height is not valid.');
        }
      }
      if (minHeight !== undefined && maxHeight !== undefined && Number(minHeight) > Number(maxHeight)) {
        throw new Error('Minimum height cannot be greater than maximum height.');
      }
      const isForward = !!after || (!after && !before);
      // Compute the correct page size for the last page when requested
      const lastPageSize = (() => {
        const remainder = totalCount.value % rowsToShow.value;
        return remainder === 0 ? rowsToShow.value : remainder;
      })();

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            // When jumping to the last page, request only the remaining items
            last: toLastPage ? lastPageSize : isForward ? null : rowsToShow.value,
            after,
            before,
            chainId,
            isCoinbase,
            minHeight,
            maxHeight,
          },
          networkId,
        }
      });

      if (response?.errors) {
        throw new Error('Unable to load transactions. Please try again.');
      }

      const result = response?.data?.transactions;
      pageInfo.value = result?.pageInfo || null;
      totalCount.value = result?.totalCount || 0;

      // If transaction is null, it means the transaction doesn't exist
      if (result === undefined || result.edges.length === 0) {
        throw new Error('No transactions found for the selected filters.');
      }

      const rawTxs = result?.edges || [];
      transactions.value = rawTxs.map((edge: any) => {
        const rawCode = edge?.node?.cmd?.payload?.code ? unescapeCodeString(edge.node.cmd.payload.code) : ''
        const parsed = extractPactCall(rawCode)
        return {
          requestKey: edge.node.hash,
          height: edge.node.result.block?.height,
          canonical: edge.node.result.block?.canonical,
          badResult: edge.node.result.badResult,
          chainId: edge.node.cmd.meta.chainId,
          time: formatRelativeTime(edge.node.cmd.meta.creationTime),
          timeUtc: new Date(edge.node.cmd.meta.creationTime).toISOString(),
          sender: edge.node.cmd.meta.sender,
          rawGasPrice: edge.node.cmd.meta.gasPrice,
          gas: edge.node.result.gas,
          gasLimit: new Intl.NumberFormat().format(edge.node.cmd.meta.gasLimit),
          rawGasLimit: edge.node.cmd.meta.gasLimit,
          method: parsed.method || '-',
          cursor: edge.cursor,
        };
      });
    } catch (e: any) {
      error.value = new Error('Unable to load transactions. Please try again.');
      transactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    error,
    transactions,
    loading,
    fetchTransactions,
    pageInfo,
    totalCount,
    rowsToShow,
    updateRowsToShow,
    clearState,
  };
}; 