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

export const useBlock = (height: Ref<number>, chainId: Ref<number>, networkId: Ref<string | undefined>) => {
  const block = ref<any>(null);
  const loading = ref(true);
  const error = ref<any>(null);

  const fetchBlock = async () => {
    if (!height.value || chainId.value === undefined || !networkId.value) {
      return;
    }

    loading.value = true;
    error.value = null;

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
      block.value = response?.data?.blocksFromHeight?.edges?.[0]?.node;
      if (!block.value) {
        throw new Error('Block not found');
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
    loading,
    error,
    fetchBlock,
  };
}; 