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
      console.log("foundIndex", foundIndex);
      console.log("nodes", nodes[0].canonical);
      canonicalIndex.value = foundIndex;

      if (foundIndex !== -1) {
        block.value = nodes[foundIndex];
      } else {
        block.value = nodes.length > 0 ? nodes[0] : null;
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
  };
}; 