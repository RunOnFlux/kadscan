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

  const fetchBlock = async () => {
    if (height.value === undefined || chainId.value === undefined || !networkId.value) {
      return;
    }

    loading.value = block.value === null;
    error.value = null;
    competingBlocks.value = [];
    canonicalIndex.value = -1;

    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: BLOCK_QUERY,
          variables: {
            startHeight: height.value,
            endHeight: height.value,
            chainIds: [String(chainId.value)],
          },
          networkId: networkId.value,
        },
      });

      if (response.errors) {
        throw new Error(response.errors.map((e: any) => e.message).join(', '));
      }

      const edges = response?.data?.blocksFromHeight?.edges || [];
      if (edges.length === 0) {
        throw new Error('Block not found');
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
      }
    } catch (e) {
      error.value = e;
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
    fetchKadenaPrice,
    kadenaPrice,
    kadenaPriceLastDay,
    totalGasUsed,
    totalGasPrice,
    gasLoading,
  };
}; 