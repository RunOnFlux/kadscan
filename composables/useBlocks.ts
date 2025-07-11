import { ref } from 'vue';
import { useFormat } from './useFormat';

const GQL_QUERY = `
query Blocks(
  $heightCount: Int,
  $completedHeights: Boolean,
  $first: Int,
  $last: Int,
  $after: String,
  $before: String
) {
  completedBlockHeights(
    heightCount: $heightCount,
    completedHeights: $completedHeights,
    first: $first,
    last: $last,
    after: $after,
    before: $before
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
      .filter((price: any) => typeof price === 'number');
    
    if (gasPrices.length > 0) {
      const sum = gasPrices.reduce((acc: number, price: number) => acc + price, 0);
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

export const useBlocks = () => {
  const blocks = ref<any[]>([]);
  const loading = ref(false);
  const { formatRelativeTime } = useFormat();
  const pageInfo = ref<any>(null);
  const totalCount = ref(0);

  const fetchTotalCount = async () => {
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: { query: TOTAL_COUNT_QUERY },
      });
      totalCount.value = response?.data?.lastBlockHeight || 0;
    } catch (error) {
      console.error('Error fetching total block count:', error);
    }
  };

  const fetchBlocks = async ({
    limit,
    after,
    before,
  }: {
    limit: number,
    after?: string,
    before?: string,
  }) => {
    loading.value = true;
    try {
      const isForward = !!after || (!after && !before);
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            heightCount: 6,
            completedHeights: false,
            first: isForward ? limit : null,
            last: isForward ? null : limit,
            after,
            before,
          }
        }
      });

      const result = response?.data?.completedBlockHeights;
      pageInfo.value = result?.pageInfo || null;

      const rawBlocks = result?.edges || [];
      blocks.value = rawBlocks.map((edge: any) => {
        const details = processBlockDetails(edge.node);
        return {
          block: edge.node.height,
          chainId: edge.node.chainId,
          age: formatRelativeTime(edge.node.creationTime),
          txn: edge.node.transactions.totalCount,
          cursor: edge.cursor,
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

  fetchTotalCount();

  return {
    blocks,
    loading,
    fetchBlocks,
    pageInfo,
    totalCount
  };
}; 