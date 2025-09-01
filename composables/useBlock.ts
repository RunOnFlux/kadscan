import { ref } from 'vue';
import { useBinance } from '~/composables/useBinance';

const BLOCK_QUERY = `
  query blocksFromHeight($startHeight: Int!, $endHeight: Int, $chainIds: [String!]) {
    blocksFromHeight(startHeight: $startHeight, endHeight: $endHeight, chainIds: $chainIds) {
      edges {
        node {
          chainId
          coinbase
          creationTime
          difficulty
          epoch
          flags
          hash
          height
          neighbors {
            hash
            chainId
          }
          nonce
          parent {
            height
            chainId
            hash
          }
          powHash
          target
          weight
          payloadHash
          transactions {
            totalCount
          }
          events {
            totalCount
          }
          canonical
        }
      }
    }
  }
`;

const BLOCK_TRANSACTIONS_QUERY = `
  query blockTransactions($startHeight: Int!, $endHeight: Int, $chainIds: [String!], $first: Int, $after: String) {
    blocksFromHeight(startHeight: $startHeight, endHeight: $endHeight, chainIds: $chainIds) {
      edges {
        node {
          transactions(first: $first, after: $after) {
            totalCount
            edges {
              node {
                result {
                  ... on TransactionResult {
                    gas
                  }
                }
                cmd {
                  meta {
                    gasPrice
                  }
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    }
  }
`;

const NEIGHBOR_EXISTENCE_QUERY = `
  query BlocksFromHeight($startHeight: Int!, $endHeight: Int, $chainIds: [String!]) {
    blocksFromHeight(startHeight: $startHeight, endHeight: $endHeight, chainIds: $chainIds) {
      edges {
        node {
          chainId
          height
        }
      }
    }
  }
`;

const block = ref<any>(null);
const competingBlocks = ref<any[]>([]);
const canonicalIndex = ref(-1);
const loading = ref(true);
const error = ref<any>(null);
const kadenaPrice = ref<number | null>(null);
const kadenaPriceLastDay = ref<Date | null>(null);
const totalGasUsed = ref<number | null>(null);
const totalGasPrice = ref<string | null>(null);
const gasLoading = ref(false);
const neighborAvailability = ref({
  prevOnSameChain: false,
  nextOnSameChain: false,
  prevChainSameHeight: false,
  nextChainSameHeight: false,
});

// Clear state for fresh page mounts or network changes
const clearState = () => {
  block.value = null;
  competingBlocks.value = [];
  canonicalIndex.value = -1;
  loading.value = true;
  error.value = null;
  kadenaPrice.value = null;
  kadenaPriceLastDay.value = null;
  totalGasUsed.value = null;
  totalGasPrice.value = null;
  gasLoading.value = false;
  neighborAvailability.value = {
    prevOnSameChain: false,
    nextOnSameChain: false,
    prevChainSameHeight: false,
    nextChainSameHeight: false,
  };
};

export const useBlock = (
  height: Ref<number>,
  chainId: Ref<number>,
  networkId: Ref<string | undefined>
) => {
  const { fetchKadenaPriceAtDate } = useBinance();

  const fetchKadenaPrice = async (newCreationTime: any) => {
    if (!block.value?.creationTime) {
      return;
    }

    let newCreationTimeDayOnly = new Date(newCreationTime);
    newCreationTimeDayOnly.setUTCHours(0, 0, 0, 0);
    let creationTimeDayOnly = new Date(block.value.creationTime);
    creationTimeDayOnly.setUTCHours(0, 0, 0, 0);
    
    if (kadenaPrice.value === null || kadenaPriceLastDay.value?.getTime() !== newCreationTimeDayOnly.getTime()) {
      const priceData: any = await fetchKadenaPriceAtDate(newCreationTimeDayOnly);
      kadenaPriceLastDay.value = newCreationTimeDayOnly;
      if (priceData && priceData.price) {
        kadenaPrice.value = priceData.price;
      }
    }
  };

  const calculateTotalGas = async () => {
    if (!block.value || !networkId.value) {
      return;
    }

    gasLoading.value = true;
    if (totalGasUsed.value === null) {
      totalGasUsed.value = 0;
      totalGasPrice.value = "0";
    }
    let hasNextPage = true;
    let cursor: string | undefined = undefined;

    try {
      let gasAccumulator = 0;
      let gasPriceAccumulator = 0;
      while (hasNextPage) {
        const response: any = await $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: BLOCK_TRANSACTIONS_QUERY,
            variables: {
              startHeight: height.value,
              endHeight: height.value,
              chainIds: [String(chainId.value)],
              first: 100,
              after: cursor,
            },
            networkId: networkId.value,
          },
        });

        if (response.errors) {
          throw new Error(response.errors.map((e: any) => e.message).join(', '));
        }

        const txEdges = response.data?.blocksFromHeight?.edges?.[0]?.node?.transactions?.edges || [];
        const pageInfo = response.data?.blocksFromHeight?.edges?.[0]?.node?.transactions?.pageInfo;

        // Sum gas and average gas price using only transactions that actually used gas (excludes coinbase)
        let includedCount = 0;
        txEdges.forEach((edge: any) => {
          if (edge?.node?.result?.gas) {
            includedCount++;
            gasAccumulator += Number(edge.node.result.gas);
            gasPriceAccumulator += parseFloat(edge?.node?.cmd?.meta?.gasPrice);
          }
        });

        // Use the count of included transactions as denominator to avoid dilution
        gasPriceAccumulator = includedCount ? (gasPriceAccumulator / includedCount) : 0;
        hasNextPage = pageInfo?.hasNextPage || false;
        cursor = pageInfo?.endCursor;
      }

      if(totalGasUsed.value !== gasAccumulator) {
        totalGasUsed.value = gasAccumulator;
        // Keep numeric precision; formatting handled in view
        totalGasPrice.value = String(gasPriceAccumulator);
      }
    } catch (e) {
      console.error('Error calculating total gas:', e);
      totalGasUsed.value = null; // Reset on error
      totalGasPrice.value = null;
    } finally {
      gasLoading.value = false;
    }
  };

  const fetchNeighborAvailability = async () => {
    if (height.value === undefined || chainId.value === undefined || !networkId.value) {
      return;
    }

    try {
      const currentHeight = Number(height.value);
      const currentChain = Number(chainId.value);

      const chainIds: number[] = [currentChain];
      if (currentChain > 0) chainIds.push(currentChain - 1);
      if (currentChain < 19) chainIds.push(currentChain + 1);

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: NEIGHBOR_EXISTENCE_QUERY,
          variables: {
            startHeight: Math.max(0, currentHeight - 1),
            endHeight: currentHeight + 1,
            chainIds: chainIds.map((c) => String(c)),
          },
          networkId: networkId.value,
        },
      });

      const edges = response?.data?.blocksFromHeight?.edges || [];
      const exists = new Set<string>();
      for (const edge of edges) {
        const node = edge?.node;
        if (node?.height !== undefined && node?.chainId !== undefined) {
          exists.add(`${node.height}:${node.chainId}`);
        }
      }

      const prevOnSameChain = currentHeight > 0 && exists.has(`${currentHeight - 1}:${currentChain}`);
      const nextOnSameChain = exists.has(`${currentHeight + 1}:${currentChain}`);
      const prevChainSameHeight = currentChain > 0 && exists.has(`${currentHeight}:${currentChain - 1}`);
      const nextChainSameHeight = currentChain < 19 && exists.has(`${currentHeight}:${currentChain + 1}`);

      neighborAvailability.value = {
        prevOnSameChain,
        nextOnSameChain,
        prevChainSameHeight,
        nextChainSameHeight,
      };
    } catch (e) {
      neighborAvailability.value = {
        prevOnSameChain: false,
        nextOnSameChain: false,
        prevChainSameHeight: false,
        nextChainSameHeight: false,
      };
    }
  };

  const fetchBlock = async () => {
    if (height.value === undefined || chainId.value === undefined || !networkId.value) {
      return;
    }

    // Normalize and validate params before querying
    const h = Number(height.value);
    const c = Number(chainId.value);

    loading.value = block.value === null;
    error.value = null;
    competingBlocks.value = [];
    canonicalIndex.value = -1;

    // Height validation
    if (Number.isNaN(h) || h < 0) {
      error.value = new Error('Block height is not valid.');
      block.value = null;
      loading.value = false;
      return;
    }

    // ChainId validation
    if (Number.isNaN(c)) {
      error.value = new Error('Chain Id provided is not a valid chain.');
      block.value = null;
      loading.value = false;
      return;
    }
    if (!Number.isInteger(c) || c < 0 || c > 19) {
      error.value = new Error(`Chain Id ${c} doesn't exist.`);
      block.value = null;
      loading.value = false;
      return;
    }

    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: BLOCK_QUERY,
          variables: {
            startHeight: h,
            endHeight: h,
            chainIds: [String(c)],
          },
          networkId: networkId.value,
        },
      });

      if (response.errors) {
        // Hide low-level GraphQL messages
        throw new Error('Unable to load block. Please try again.');
      }

      const edges = response?.data?.blocksFromHeight?.edges || [];
      if (edges.length === 0) {
        throw new Error('Block Height not found');
      }

      let nodes = edges.map((edge: any) => edge.node);
      competingBlocks.value = nodes;

      const foundIndex = nodes.findIndex((node: any) => node.canonical);
      canonicalIndex.value = foundIndex;

      if (foundIndex !== -1) {
        block.value = nodes[foundIndex];
      } else {
        block.value = nodes.length > 0 ? nodes[0] : null;
      }

      if (block.value) {
        calculateTotalGas();
        fetchKadenaPrice(block.value.creationTime);
        fetchNeighborAvailability();
      }
    } catch (e: any) {
      // Normalize any thrown error to a user-friendly message
      const message = typeof e?.message === 'string' ? e.message : 'Unable to load block. Please try again.';
      error.value = new Error(message);
      block.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    block,
    competingBlocks,
    canonicalIndex,
    loading,
    error,
    fetchBlock,
    clearState,
    fetchKadenaPrice,
    kadenaPrice,
    kadenaPriceLastDay,
    totalGasUsed,
    totalGasPrice,
    gasLoading,
    neighborAvailability,
    fetchNeighborAvailability,
  };
}; 