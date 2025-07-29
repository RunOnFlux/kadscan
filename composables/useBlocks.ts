import { ref } from 'vue';
import { useFormat } from './useFormat';

const GQL_QUERY = `
query Blocks(
  $minimumDepth: Int!,
  $first: Int,
  $last: Int,
  $after: String,
  $before: String,
  $chainIds: [String!]
) {
  blocksFromDepth(
    minimumDepth: $minimumDepth,
    first: $first,
    last: $last,
    after: $after,
    before: $before,
    chainIds: $chainIds
  ) {
    edges {
      node {
        chainId
        creationTime
        transactions {
          totalCount
          edges {
            node {
              cmd {
                meta {
                  gasPrice
                }
              }
            }
          }
        }
        height
        coinbase
        hash
        canonical
      }
      cursor
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
`;

const TOTAL_COUNT_QUERY = `
  query Query {
    lastBlockHeight
  }
`;

const BLOCKS_BY_HEIGHT_QUERY = `
query BlocksByHeight($startHeight: Int!, $endHeight: Int) {
  blocksFromHeight(startHeight: $startHeight, endHeight: $endHeight) {
    edges {
      node {
        chainId
        creationTime
        transactions {
          totalCount
          edges {
            node {
              cmd {
                meta {
                  gasPrice
                }
              }
            }
          }
        }
        height
        coinbase
        hash
        canonical
      }
    }
  }
}
`;

const processBlockDetails = (node: any) => {
  const { formatGasPrice } = useFormat();
  let miner = 'N/A';
  let reward = '0';
  
  try {
    const coinbaseData = JSON.parse(node.coinbase);
    miner = coinbaseData?.events?.[0]?.params?.[1] || 'N/A';
    reward = coinbaseData?.events?.[0]?.params?.[2]?.toString() || '0';
  } catch (e) {
    // Coinbase parsing failed, defaults will be used
  }

  let gasPrice = 0;
  const txCount = node.transactions.totalCount;

  if (txCount > 1) {
    const gasPrices = node.transactions.edges
      .slice(1) // Skip coinbase transaction
      .map((edge: any) => edge.node.cmd.meta.gasPrice)
      .filter((price: any) => typeof price === 'string');
    
    if (gasPrices.length > 0) {
      const sum = gasPrices.reduce((acc: string, price: string) => parseFloat(acc) + parseFloat(price), 0);
      gasPrice = sum / gasPrices.length;
    }
  }

  return {
    miner,
    reward: `${reward} KDA`,
    gasPrice: gasPrice === 0 ? `0.0` : `${formatGasPrice(gasPrice)} KDA`,
    gasLimit: '150,000',
    hash: node.hash,
  };
};

const blocks = ref<any[]>([]);
const loading = ref(true);
const { formatRelativeTime } = useFormat();
const pageInfo = ref<any>(null);
const totalCount = ref(0);
const rowsToShow = ref<number>(25);

// State for blocks by height
const blocksByHeight = ref<any[]>([]);
const loadingByHeight = ref(true);
const error = ref<any>(null);

export const useBlocks = () => {
  const clearState = () => {
    blocks.value = [];
    blocksByHeight.value = [];
    loading.value = true;
    loadingByHeight.value = true;
    error.value = null;
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
      totalCount.value = response?.data?.lastBlockHeight || 0;
    } catch (error) {
      console.error('Error fetching total block count:', error);
    }
  };

  const fetchBlocks = async ({
    networkId,
    after,
    before,
    toLastPage = false,
    chainIds,
  }: {
    networkId: string,
    after?: string,
    before?: string,
    toLastPage?: boolean,
    chainIds?: string[],
  }) => {
    if (!networkId) return;
    loading.value = blocks.value.length === 0;
    try {
      const isForward = !!after || (!after && !before);
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            minimumDepth: 0,
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? rowsToShow.value : isForward ? null : rowsToShow.value,
            after,
            before,
            chainIds,
          },
          networkId,
        }
      });

      const result = response?.data?.blocksFromDepth;
      pageInfo.value = result?.pageInfo || null;

      const rawBlocks = result?.edges || [];
      const blocksMap = rawBlocks.map((edge: any) => {
        const details = processBlockDetails(edge.node);
        return {
          height: edge.node.height,
          chainId: edge.node.chainId,
          age: formatRelativeTime(edge.node.creationTime),
          canonical: edge.node.canonical,
          txn: edge.node.transactions.totalCount,
          cursor: edge.cursor,
          ...details,
        };
      });
      blocks.value = blocksMap;
    } catch (error) {
      console.error('Error fetching or processing blocks:', error);
      blocks.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchBlocksByHeight = async ({
    networkId,
    height,
  }: {
    networkId: string,
    height: number,
  }) => {
    if (!networkId || !height) return;
    loadingByHeight.value = blocksByHeight.value.length === 0;
    error.value = null;
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: BLOCKS_BY_HEIGHT_QUERY,
          variables: {
            startHeight: height,
            endHeight: height,
          },
          networkId,
        }
      });

      const result = response?.data?.blocksFromHeight;
      const rawBlocks = result?.edges || [];
      
      // Check if no blocks found for this height
      if (rawBlocks.length === 0) {
        error.value = new Error('No blocks found for this height');
        blocksByHeight.value = [];
        return;
      }
      
      const blocksMap = rawBlocks.map((edge: any) => {
        const details = processBlockDetails(edge.node);
        return {
          height: edge.node.height,
          chainId: edge.node.chainId,
          age: formatRelativeTime(edge.node.creationTime),
          canonical: edge.node.canonical,
          txn: edge.node.transactions.totalCount,
          ...details,
        };
      });
      
      // Sort by chainId in ascending order (0-19)
      blocksByHeight.value = blocksMap.sort((a: any, b: any) => a.chainId - b.chainId);
    } catch (e) {
      console.error('Error fetching or processing blocks by height:', e);
      blocksByHeight.value = [];
    } finally {
      loadingByHeight.value = false;
    }
  };

  return {
    blocks,
    rowsToShow,
    updateRowsToShow,
    loading,
    fetchBlocks,
    pageInfo,
    totalCount,
    fetchTotalCount,
    blocksByHeight,
    loadingByHeight,
    error,
    fetchBlocksByHeight,
    clearState,
  };
}; 