import { ref } from 'vue';

const GQL_QUERY = `
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

export const useBlock = (
  height: Ref<number>,
  chainId: Ref<number>,
  networkId: Ref<string | undefined>
) => {
  const block = ref<any>(null);
  const competingBlocks = ref<any[]>([]);
  const canonicalIndex = ref(-1);
  const loading = ref(true);
  const error = ref<any>(null);
  const totalGasUsed = ref<number | null>(null);
  const gasLoading = ref(false);

  const calculateTotalGas = async () => {
    if (!block.value || !networkId.value) {
      return;
    }

    gasLoading.value = true;
    totalGasUsed.value = 0;
    let hasNextPage = true;
    let cursor: string | undefined = undefined;

    try {
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

        for (const edge of txEdges) {
          if (edge.node?.result?.gas) {
            totalGasUsed.value += Number(edge.node.result.gas);
          }
        }

        hasNextPage = pageInfo?.hasNextPage || false;
        cursor = pageInfo?.endCursor;
      }
    } catch (e) {
      console.error('Error calculating total gas:', e);
      totalGasUsed.value = null; // Reset on error
    } finally {
      gasLoading.value = false;
    }
  };

  const fetchBlock = async () => {
    if (height.value === undefined || chainId.value === undefined || !networkId.value) {
      return;
    }

    loading.value = true;
    error.value = null;
    competingBlocks.value = [];
    canonicalIndex.value = -1;

    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
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
      }
    } catch (e) {
      error.value = e;
      block.value = null;
      console.error('Error fetching or processing block:', e);
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
    totalGasUsed,
    gasLoading,
  };
}; 