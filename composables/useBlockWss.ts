import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly, watch } from 'vue'
import { useSharedData } from '~/composables/useSharedData';
import { updateTransactionCount } from '~/composables/useTransactionCount';

/**
 * @description The singleton graphql-ws client instance.
 * It is initialized only on the client-side to avoid issues during server-side rendering.
 */
let client: any = null
let unsubscribe: (() => void) | null = null

/**
 * @description A reactive ref that holds the connection status of the WebSocket.
 */
const isConnected = ref(false)
/**
 * @description A reactive ref that stores any error message from the WebSocket connection.
 */
const error = ref<string | null>(null)
/**
 * @description A reactive ref holding the array of new blocks received from the subscription.
 * This array is capped at 10 items.
 */
const newBlocks = ref<any[]>([])

/**
 * @description The GraphQL subscription query string for receiving new block events.
 */
const subscriptionQuery = `
  subscription HomeBlockList {
    newBlocks {
      height
      transactions {
        totalCount
      }
      chainId
      creationTime
      coinbase
    }
  }
`

/**
 * @description Starts the WebSocket subscription for new blocks.
 * If a subscription is already active or the client is not initialized, it does nothing.
 */
const startSubscription = () => {
  if (unsubscribe || !client) {
    console.warn("Block WSS client not ready or already subscribed.");
    return;
  }
  
  try {
    // Initiate the subscription with the GraphQL client.
    unsubscribe = client.subscribe(
      {
        query: subscriptionQuery,
      },
      {
        // 'next' is called every time the server sends data.
        next: (result: any) => {
          if (result.data?.newBlocks) {
            const blocks = Array.isArray(result.data.newBlocks) ? result.data.newBlocks : [result.data.newBlocks];
            blocks.forEach((block: any) => {
              if (block.transactions.totalCount > 0) {
                updateTransactionCount(block.height, block.chainId, block.transactions.totalCount, block.creationTime);
              }
            });

            newBlocks.value.unshift(...blocks);
            // Ensure the array does not grow indefinitely by capping it at 10 blocks.
            if (newBlocks.value.length > 10) {
              newBlocks.value.length = 10
            }
          }
          isConnected.value = true
        },
        // 'error' is called when something goes wrong with the subscription.
        error: (err: any) => {
          error.value = 'Unable to connect to live blocks'
          isConnected.value = false
        },
        // 'complete' is called when the subscription is terminated by the server.
        complete: () => {
          isConnected.value = false
          unsubscribe = null
        },
      }
    )
  } catch (err: unknown) {
    error.value = 'Failed to start subscription'
  }
}

/**
 * @description Stops the active WebSocket subscription.
 */
const stopSubscription = () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

export const useBlockWss = () => {
  const { selectedNetwork } = useSharedData();
  
  watch(selectedNetwork, (network) => {
    if (!process.client || !network) return;

    // Teardown existing client
    stopSubscription();
    if (client) {
      client.dispose();
      client = null;
    }
    isConnected.value = false;
    newBlocks.value = [];

    // Setup new client
    const wssUrl = network.id === 'mainnet01'
      ? 'wss://devnet.kadindexer.io/mainnet/wss/graphql'
      : 'wss://devnet.kadindexer.io/testnet/wss/graphql';

    client = createClient({
      url: wssUrl,
      connectionParams: () => ({}),
    });
  }, { immediate: true, deep: true });

  /**
   * @description The component's unmount hook. It ensures that the WebSocket subscription
   * and client are properly cleaned up when the component using this composable is destroyed.
   * This is crucial for preventing memory leaks.
   */
  onUnmounted(() => {
    // We might not want to automatically unsubscribe on unmount
    // if we want the subscription to be persistent across the app.
    stopSubscription()
    if (client) {
      client.dispose()
      client = null
    }
  })

  return {
    startSubscription,
    stopSubscription,
    isConnected: readonly(isConnected),
    error: readonly(error),
    newBlocks: readonly(newBlocks),
  }
} 

// =========================
// Incoming count subscription
// =========================

let countClient: any = null;
let countUnsubscribe: (() => void) | null = null;
const countIsConnected = ref(false);
const countError = ref<string | null>(null);
const incomingCount = ref(0);
const baselineHash = ref<string | null>(null);
const hasSeenBaseline = ref(false);
const lastTopHash = ref<string | null>(null);
const TRANSACTION_FRAME_SIZE = 100;
const MAX_INCOMING_COUNT = 100;
const overLimit = ref(false);

const COUNT_SUBSCRIPTION = `
  subscription NewBlocks($quantity: Int) {
    newBlocks(quantity: $quantity) {
      hash
    }
  }
`;

function noop() {}

const startCountSubscription = () => {
  if (countUnsubscribe || !countClient) {
    return;
  }
  try {
    countUnsubscribe = countClient.subscribe(
      { query: COUNT_SUBSCRIPTION, variables: { quantity: TRANSACTION_FRAME_SIZE } },
      {
        next: (result: any) => {
          const payload = result?.data?.newBlocks;
          const items = Array.isArray(payload) ? payload : payload ? [payload] : [];
          const hashes = items.map((t: any) => t?.hash).filter(Boolean);
          const baseline = baselineHash.value;

          if (!hasSeenBaseline.value) {
            const idx = baseline ? hashes.indexOf(baseline) : -1;
            if (idx >= 0) {
              // Count only those strictly before baseline
              incomingCount.value += idx;
              hasSeenBaseline.value = true;
              lastTopHash.value = hashes[0] || null;
            } else {
              // Not seen yet; wait for a frame containing baseline
              const prevTop = lastTopHash.value;
              lastTopHash.value = hashes[0] || lastTopHash.value;
            }
          } else {
            // Incremental counting since last frame
            const idxPrevTop = lastTopHash.value ? hashes.indexOf(lastTopHash.value) : -1;
            if (idxPrevTop >= 0) {
              incomingCount.value += idxPrevTop; // number of newer hashes before previous top
              const prevTop = lastTopHash.value;
              lastTopHash.value = hashes[0] || lastTopHash.value;
            } else {
              // If our lastTopHash is not present, we do not adjust baseline; just update lastTopHash
              const prevTop = lastTopHash.value;
              lastTopHash.value = hashes[0] || lastTopHash.value;
            }
          }
          // Cap and shutdown when reaching threshold
          if (!overLimit.value && incomingCount.value >= MAX_INCOMING_COUNT) {
            incomingCount.value = MAX_INCOMING_COUNT;
            overLimit.value = true;
            try { stopCountSubscription(); } catch {}
          }
          countIsConnected.value = true;
        },
        error: (err: any) => {
          countError.value = 'Unable to connect to live block count.';
          countIsConnected.value = false;
        },
        complete: () => {
          countIsConnected.value = false;
          countUnsubscribe = null;
        },
      }
    );
  } catch (err: unknown) {
    countError.value = 'Failed to start subscription';
  }
}

const stopCountSubscription = () => {
  if (countUnsubscribe) {
    countUnsubscribe();
    countUnsubscribe = null;
  }
}

export const useBlockCountWss = () => {
  const { selectedNetwork } = useSharedData();

  const setBaselineHash = (hash: string | null | undefined) => {
    const previous = baselineHash.value;
    baselineHash.value = hash || null;
    // Reset counter and dedup trackers when baseline changes
    incomingCount.value = 0;
    hasSeenBaseline.value = false;
    lastTopHash.value = null;
    overLimit.value = false;
    if (baselineHash.value) {
      // Wait until we see this baseline in a ws frame
      noop();
    }
    // baseline updated
  };

  const refreshBaseline = (hash: string | null | undefined) => {
    setBaselineHash(hash);
  };

  const resetCountStream = () => {
    // Clear and restart subscription; keep baseline cleared until caller sets it
    stopCountSubscription();
    if (countClient) {
      try { countClient.dispose(); } catch {}
      countClient = null;
    }
    countIsConnected.value = false;
    incomingCount.value = 0;
    hasSeenBaseline.value = false;
    lastTopHash.value = null;
    baselineHash.value = null;
    overLimit.value = false;

    // Recreate client for current network
    const network = useSharedData().selectedNetwork.value;
    if (process.client && network) {
      const wssUrl = network.id === 'mainnet01'
        ? 'wss://devnet.kadindexer.io/mainnet/wss/graphql'
        : 'wss://devnet.kadindexer.io/testnet/wss/graphql';
      countClient = createClient({ url: wssUrl, connectionParams: () => ({}) });
      // reset stream; client recreated
      startCountSubscription();
    }
  };

  watch(selectedNetwork, (network) => {
    if (!process.client || !network) return;

    // Teardown existing client
    stopCountSubscription();
    if (countClient) {
      countClient.dispose();
      countClient = null;
    }
    countIsConnected.value = false;
    incomingCount.value = 0;
    hasSeenBaseline.value = false;
    lastTopHash.value = null;
    baselineHash.value = null;
    overLimit.value = false;

    // Setup new client
    const wssUrl = network.id === 'mainnet01'
      ? 'wss://devnet.kadindexer.io/mainnet/wss/graphql'
      : 'wss://devnet.kadindexer.io/testnet/wss/graphql';

    countClient = createClient({
      url: wssUrl,
      connectionParams: () => ({}),
    });
    // Start subscription immediately after client is created
    startCountSubscription();
  }, { immediate: true, deep: true });

  onUnmounted(() => {
    stopCountSubscription();
    if (countClient) {
      countClient.dispose();
      countClient = null;
    }
  });

  return {
    startSubscription: startCountSubscription,
    stopSubscription: stopCountSubscription,
    isConnected: readonly(countIsConnected),
    error: readonly(countError),
    incomingCount: readonly(incomingCount),
    baseline: readonly(baselineHash),
    hasSeenBaseline: readonly(hasSeenBaseline),
    overLimit: readonly(overLimit),
    maxIncomingCount: MAX_INCOMING_COUNT,
    setBaselineHash,
    refreshBaseline,
    resetCountStream,
  };
}