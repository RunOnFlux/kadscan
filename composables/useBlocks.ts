import { ref } from 'vue';
import { useTime } from './useTime';

const GQL_QUERY = `
query Blocks($heightCount: Int, $completedHeights: Boolean, $first: Int) {
  completedBlockHeights(heightCount: $heightCount, completedHeights: $completedHeights, first: $first) {
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
      }
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

const processBlockDetails = (node: any) => {
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
      .filter((price: any) => typeof price === 'number');
    
    if (gasPrices.length > 0) {
      const sum = gasPrices.reduce((acc: number, price: number) => acc + price, 0);
      gasPrice = sum / gasPrices.length;
    }
  }

  const formatGasPrice = (price: number): string => {
    if (price === 0) return '0';
    // Format to a high number of decimal places and remove trailing zeros
    // to prevent scientific notation on small numbers.
    return price.toFixed(12).replace(/\.?0+$/, '');
  };

  return {
    miner,
    reward: `${reward} KDA`,
    gasPrice: `${formatGasPrice(gasPrice)} KDA`,
    gasLimit: '150,000',
  };
};

export const useBlocks = () => {
  const blocks = ref<any[]>([]);
  const loading = ref(false);
  const { formatRelativeTime } = useTime();

  const fetchBlocks = async (limit: number) => {
    loading.value = true;
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            heightCount: 6,
            completedHeights: false,
            first: limit,
          }
        }
      });

      const rawBlocks = response?.data?.completedBlockHeights?.edges || [];
      blocks.value = rawBlocks.map((edge: any) => {
        const details = processBlockDetails(edge.node);
        return {
          block: edge.node.height,
          chainId: edge.node.chainId,
          age: formatRelativeTime(edge.node.creationTime),
          txn: edge.node.transactions.totalCount,
          ...details,
        };
      });
    } catch (error) {
      console.error('Error fetching or processing blocks:', error);
      blocks.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    blocks,
    loading,
    fetchBlocks,
  };
}; 