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
          console.error('Block WebSocket Subscription Error:', err)
          error.value = err.message || 'Unknown error'
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
    console.error('Failed to start Block WebSocket subscription:', err)
    error.value = err instanceof Error ? err.message : 'Failed to start subscription'
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
      ? 'wss://vps.mainnet.kadindexer.io/wss/graphql'
      : 'wss://testnet.kadindexer.io/graphql';

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