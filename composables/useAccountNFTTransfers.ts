import { ref, readonly } from 'vue';
import { useFormat } from './useFormat';

// GraphQL query for transfers with NFT filter
const GQL_QUERY = `
  query Transfers($accountName: String, $chainId: String, $after: String, $before: String, $first: Int, $last: Int, $isNft: Boolean) {
    transfers(accountName: $accountName, chainId: $chainId, after: $after, before: $before, first: $first, last: $last, isNFT: $isNft) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        cursor
        node {
          amount
          block {
            chainId
            height
          }
          creationTime
          moduleName
          receiverAccount
          senderAccount
          requestKey
          crossChainTransfer {
            senderAccount
            receiverAccount
          }
        }
      }
    }
  }
`;

const tokenTransfers = ref<any[]>([]);
const loading = ref(true);
const { formatRelativeTime, removeTrailingZeros } = useFormat();
const pageInfo = ref<any>(null);
const totalCount = ref(0);
const rowsToShow = ref(10);
const error = ref<any>(null);

export const useAccountNFTTransfers = () => {
  const clearState = () => {
    tokenTransfers.value = [];
    loading.value = true;
    pageInfo.value = null;
    error.value = null;
  };

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value;
  };

  const shapeTransfer = (edge: any, viewedAccount: string) => {
    const node = edge.node;
    const block = node.block || {};
    // When crossChainTransfer exists, fill missing sender/receiver
    const cross = node.crossChainTransfer || null;
    let sender: string | null = node.senderAccount || null;
    let receiver: string | null = node.receiverAccount || null;
    if (cross) {
      if (!sender) sender = cross.senderAccount || null;
      if (!receiver) receiver = cross.receiverAccount || null;
    }

    const isCross = !!cross;
    const action = isCross ? 'Cross-Chain' : 'Transfer';

    const normalizedSender = sender || '';
    const normalizedReceiver = receiver || '';

    // Direction logic
    let direction: 'IN' | 'OUT' = 'IN';
    if (normalizedSender === viewedAccount && normalizedReceiver !== normalizedSender) {
      direction = 'OUT';
    } else if (normalizedSender === normalizedReceiver && normalizedSender === viewedAccount) {
      direction = 'IN';
    } else if (normalizedReceiver === viewedAccount) {
      direction = 'IN';
    } else if (normalizedSender === viewedAccount) {
      direction = 'OUT';
    }

    return {
      requestKey: node.requestKey,
      action,
      height: block.height,
      chainId: block.chainId,
      time: formatRelativeTime(node.creationTime),
      sender: normalizedSender || 'N/A',
      receiver: normalizedReceiver || 'N/A',
      direction,
      amount: removeTrailingZeros(node.amount ?? ''),
      token: node.moduleName,
      cursor: edge.cursor,
    };
  };

  const fetchAccountTokenTransfers = async ({
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
    loading.value = tokenTransfers.value.length === 0;
    error.value = null;

    try {
      const isForward = !!after || (!after && !before);
      const lastPageSize = (() => {
        const remainder = totalCount.value % rowsToShow.value;
        return remainder === 0 ? rowsToShow.value : remainder;
      })();

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            accountName,
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? lastPageSize : isForward ? null : rowsToShow.value,
            after,
            before,
            chainId,
            isNft: true,
          },
          networkId,
        },
      });

      const result = response?.data?.transfers;
      pageInfo.value = result?.pageInfo || null;
      totalCount.value = result?.totalCount || 0;

      if (!result || result.edges.length === 0) {
        tokenTransfers.value = [];
        return;
      }

      const edges = result.edges || [];
      tokenTransfers.value = edges.map((edge: any) => shapeTransfer(edge, accountName));
    } catch (e) {
      console.error('Error fetching or processing account token transfers:', e);
      error.value = e;
      tokenTransfers.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Lightweight totalCount fetcher, honoring optional chainId
  const fetchTotalCount = async ({ networkId, accountName, chainId }: { networkId: string; accountName: string; chainId?: string }) => {
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            accountName,
            chainId,
            first: 1,
            last: null,
            after: null,
            before: null,
            isNft: true,
          },
          networkId,
        },
      });
      totalCount.value = response?.data?.transfers?.totalCount || 0;
    } catch (e) {
      // If this fails, we can still rely on main fetch to populate totalCount
      console.error('Error fetching transfers total count:', e);
    }
  };

  return {
    tokenTransfers: readonly(tokenTransfers),
    loading: readonly(loading),
    pageInfo: readonly(pageInfo),
    totalCount: readonly(totalCount),
    rowsToShow: readonly(rowsToShow),
    error: readonly(error),
    fetchAccountTokenTransfers,
    fetchTotalCount,
    updateRowsToShow,
    clearState,
  };
}; 