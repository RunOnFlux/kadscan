import { ref, computed, onMounted, watch } from 'vue';
import { useBlockWss } from '~/composables/useBlockWss';

/**
 * @description Manages the real-time block feed for the homepage.
 * This composable handles fetching the initial historical block data,
 * subscribing to a WebSocket for live updates, and processing the
 * incoming data to maintain a sorted list of block groups.
 * @returns An object containing the reactive `sortedBlockGroups` computed property.
 */
export const useBlockFeed = () => {
  /**
   * @description A reactive map that stores block data, with the block height as the key.
   * Each value is a "block group" object, which contains details like creation time
   * and a map of all chains that have produced a block at that height.
   */
  const displayedBlockGroups = ref(new Map());

  /**
   * @description A computed property that returns the block groups sorted by height in descending order.
   * This is the final, ready-to-render list for the UI.
   */
  const sortedBlockGroups = computed(() => {
    return Array.from(displayedBlockGroups.value.values()).sort((a, b) => b.height - a.height);
  });

  /**
   * @description Calculates and updates the total number of transactions for a given block group.
   * It sums the transaction counts from all chains within that group.
   * @param {any} blockGroup - The block group object to update.
   */
  function updateTotalTransactions(blockGroup: any) {
    blockGroup.totalTransactions = Array.from(blockGroup.chains.values()).reduce((sum, chain: any) => sum + (chain.transactions?.totalCount || 0), 0);
  }

  const { startSubscription, newBlocks } = useBlockWss();

  const completedBlockHeightsQuery = `
    query CompletedBlockHeights($heightCount: Int, $completedHeights: Boolean, $first: Int) {
      completedBlockHeights(heightCount: $heightCount, completedHeights: $completedHeights, first: $first) {
        edges {
          node {
            chainId
            creationTime
            height
            transactions {
              totalCount
            }
          }
        }
      }
    }
  `;

  /**
   * @description Fetches the initial set of the last 6 block heights to populate the feed on component mount.
   * This ensures the UI has data to display immediately, before the real-time subscription starts.
   * It uses the `completedBlockHeights` GraphQL query to get all chain data for the last 6 heights.
   */
  const fetchInitialBlocks = async () => {
    const GRAPHQL_URL = 'https://mainnet.kadindexer.io/graphql';

    try {
      // Make a POST request to the GraphQL endpoint to fetch the initial block data.
      const response: any = await $fetch(GRAPHQL_URL, {
        method: 'POST',
        body: {
          query: completedBlockHeightsQuery,
          variables: {
            heightCount: 6,
            completedHeights: false,
            first: 120, // 6 heights * 20 chains = 120
          },
        },
      });

      // Extract the block data from the nested response object.
      const responseData = response?.data?.completedBlockHeights;

      if (responseData && responseData.edges) {
        // Iterate over each block returned from the API.
        responseData.edges.forEach((edge: any) => {
          const block = edge.node;
          let blockToUpdate = displayedBlockGroups.value.get(block.height);

          // If a group for this block height already exists, update it with the new chain data.
          if (blockToUpdate) {
            blockToUpdate.chains.set(block.chainId, block);
            updateTotalTransactions(blockToUpdate);
          } else {
            // Otherwise, create a new block group for this height.
            const newGroup = {
              height: block.height,
              chains: new Map([[block.chainId, block]]),
              createdAt: block.creationTime,
              totalTransactions: block.transactions?.totalCount || 0,
            };
            displayedBlockGroups.value.set(block.height, newGroup);
          }
        });

        // After processing all blocks, ensure we only keep the top 6 block heights.
        const sortedGroups = Array.from(displayedBlockGroups.value.values()).sort((a, b) => b.height - a.height);
        if (sortedGroups.length > 6) {
          // Identify the cutoff height (the height of the 6th block).
          const cutoffHeight = sortedGroups[5].height;
          // Remove any block groups that are older than the cutoff.
          for (const height of displayedBlockGroups.value.keys()) {
            if (height < cutoffHeight) {
              displayedBlockGroups.value.delete(height);
            }
          }
        }
      }
    } catch (e) {
      // Log any errors that occur during the fetch process.
      console.error('Failed to fetch initial blocks:', e);
    }
  };

  /**
   * @description A watcher that processes new blocks arriving from the WebSocket subscription.
   * It updates existing block groups with new chain data or adds new block groups to the list,
   * ensuring the feed stays up-to-date in real-time.
   */
  watch(newBlocks, (latestBlocks) => {
    latestBlocks.forEach((block: any) => {
      let blockToUpdate = displayedBlockGroups.value.get(block.height);

      if (blockToUpdate) {
        blockToUpdate.chains.set(block.chainId, block);
        updateTotalTransactions(blockToUpdate);
      } else {
        const heights = Array.from(displayedBlockGroups.value.keys());
        if (heights.length === 0) { // First block ever
          const newGroup = {
            height: block.height,
            chains: new Map([[block.chainId, block]]),
            createdAt: block.creationTime,
            totalTransactions: block.transactions?.totalCount || 0,
          };
          displayedBlockGroups.value.set(block.height, newGroup);
          return;
        }

        const minHeight = Math.min(...heights);

        if (block.height > minHeight || displayedBlockGroups.value.size < 6) {
          const newGroup = {
            height: block.height,
            chains: new Map([[block.chainId, block]]),
            createdAt: block.creationTime,
            totalTransactions: block.transactions?.totalCount || 0,
          };
          displayedBlockGroups.value.set(block.height, newGroup);

          if (displayedBlockGroups.value.size > 6) {
              const sortedHeights = Array.from(displayedBlockGroups.value.keys()).sort((a,b) => a-b);
              displayedBlockGroups.value.delete(sortedHeights[0]);
          }
        }
      }
    });
  }, { deep: true });

  /**
   * @description The component's mount hook. It orchestrates the data loading process by
   * first fetching the initial historical blocks and then starting the real-time WebSocket subscription.
   */
  onMounted(async () => {
    await fetchInitialBlocks();
    startSubscription();
  });

  return {
    sortedBlockGroups,
  };
}; 