import { ref } from 'vue';
import { useFormat } from './useFormat';

const BLOCKS_FROM_DEPTH_QUERY = `
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
    totalCount
  }
}
`;

const LAST_BLOCK_HEIGHT_QUERY = `
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
    // Average only positive gas prices; this safely excludes coinbase without assuming position
    const parsedGasPrices: number[] = (node.transactions.edges || [])
      .map((edge: any) => parseFloat(edge?.node?.cmd?.meta?.gasPrice))
      .filter((value: number) => !Number.isNaN(value) && value > 0);

    if (parsedGasPrices.length > 0) {
      const sum = parsedGasPrices.reduce((acc: number, value: number) => acc + value, 0);
      gasPrice = sum / parsedGasPrices.length;
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
const lastBlockHeight = ref(0);
const totalCount = ref(0);
const rowsToShow = ref<number>(25);
const error = ref<any>(null);

// State for blocks by height
const blocksByHeight = ref<any[]>([]);
const loadingByHeight = ref(true);

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

  const fetchLastBlockHeight = async ({ networkId }: { networkId: string }) => {
    if (!networkId) return;
    
    // Reset error state at the beginning of each fetch
    error.value = null;
    
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: { 
          query: LAST_BLOCK_HEIGHT_QUERY,
          networkId,
        },
      });

      if (response?.errors) {
        throw new Error('Unable to load latest block height.');
      }

      if (typeof response?.data?.lastBlockHeight === 'number') {
        lastBlockHeight.value = response?.data?.lastBlockHeight;
      } else {
        error.value = new Error('Unable to load latest block height.');
      }

    } catch (e) {
      const message = (e as any)?.message || 'Unable to load latest block height.';
      error.value = new Error(message);
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
    
    // Reset error state at the beginning of each fetch
    error.value = null;
    try {
      // Validate chainIds if provided
      if (chainIds && chainIds.length > 0) {
        for (const raw of chainIds) {
          const n = Number(raw);
          if (Number.isNaN(n)) {
            throw new Error('Chain Id provided is not a valid chain.');
          }
          if (!Number.isInteger(n) || n < 0 || n > 19) {
            throw new Error(`Chain Id ${n} doesn't exist.`);
          }
        }
      }
      const isForward = !!after || (!after && !before);
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: BLOCKS_FROM_DEPTH_QUERY,
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

      if (response?.errors) {
        throw new Error('Unable to load blocks. Please try again.');
      }

      if (!response) {
        throw new Error('Unable to load blocks. Please try again.');
      }

      const result = response.data?.blocksFromDepth;
      pageInfo.value = result?.pageInfo || null;

      const rawBlocks = result?.edges || [];
      
      // Check if no blocks found - this should trigger error state
      if (rawBlocks.length === 0) {
        throw new Error('No blocks found for the selected filters.');
      }

      totalCount.value = result?.totalCount;

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
    } catch (e) {
      const message = (e as any)?.message || 'Unable to load blocks. Please try again.';
      error.value = new Error(message);
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
    if (!networkId) return;
    loadingByHeight.value = blocksByHeight.value.length === 0;
    
    // Reset error state at the beginning of each fetch
    error.value = null;

    try {
      // Validate height
      const h = Number(height);
      if (Number.isNaN(h) || h < 0) {
        throw new Error('Block height is not valid.');
      }
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: BLOCKS_BY_HEIGHT_QUERY,
          variables: {
            startHeight: h,
            endHeight: h,
          },
          networkId,
        }
      });

      if (response?.errors) {
        throw new Error('Unable to load blocks for this height. Please try again.');
      }

      const result = response?.data?.blocksFromHeight;
      const rawBlocks = result?.edges || [];
      
      // Check if no blocks found for this height
      if (rawBlocks.length === 0) {
        throw new Error('Block Height not found');
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
      const message = (e as any)?.message || 'Unable to load blocks for this height. Please try again.';
      error.value = new Error(message);
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
    lastBlockHeight,
    fetchLastBlockHeight,
    blocksByHeight,
    loadingByHeight,
    error,
    fetchBlocksByHeight,
    clearState,
  };
}; 