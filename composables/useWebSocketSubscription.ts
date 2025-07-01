import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly } from 'vue'

/**
 * @description The singleton graphql-ws client instance.
 * It is initialized only on the client-side to avoid issues during server-side rendering.
 */
let client: any = null

// Only create client on the client side (browser)
if (process.client) {
  client = createClient({
    url: 'wss://mainnet.kadindexer.io/graphql',
    connectionParams: () => {
      return {}
    },
  })
}

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
  subscription Events {
    newBlocks {
      height
      transactions {
        totalCount
      }
      chainId
      creationTime
    }
  }
`

/**
 * @description A variable to hold the unsubscribe function returned by the client.
 * This is used to stop the subscription.
 */
let unsubscribe: (() => void) | null = null

/**
 * @description Starts the WebSocket subscription for new blocks.
 * If a subscription is already active or the client is not initialized, it does nothing.
 */
const startSubscription = () => {
  if (unsubscribe || !client) {
    return
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
          if (result.data?.newBlocks && Array.isArray(result.data.newBlocks)) {
            // Prepend the new blocks to the beginning of the array.
            newBlocks.value.unshift(...result.data.newBlocks);
            // Ensure the array does not grow indefinitely by capping it at 10 blocks.
            if (newBlocks.value.length > 10) {
              newBlocks.value.length = 10;
            }
          }
          isConnected.value = true
        },
        // 'error' is called when something goes wrong with the subscription.
        error: (err: any) => {
          console.error('WebSocket Subscription Error:', err)
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
    console.error('Failed to start WebSocket subscription:', err)
    error.value = err instanceof Error ? err.message : 'Failed to start subscription'
  }
}

/**
 * @description Stops the active WebSocket subscription.
 */
const stopSubscription = () => {
  if (unsubscribe) {
    unsubscribe()
  }
}

/**
 * @description A Vue composable that provides an interface to the application's
 * WebSocket subscription for real-time block updates.
 * @returns An object with functions to control the subscription and reactive state
 * variables for connection status, errors, and new block data.
 */
export const useWebSocketSubscription = () => {
  /**
   * @description The component's unmount hook. It ensures that the WebSocket subscription
   * and client are properly cleaned up when the component using this composable is destroyed.
   * This is crucial for preventing memory leaks.
   */
  onUnmounted(() => {
    // We might not want to automatically unsubscribe on unmount
    // if we want the subscription to be persistent across the app.
    stopSubscription()
    client.dispose()
  })

  return {
    startSubscription,
    stopSubscription,
    isConnected: readonly(isConnected),
    error: readonly(error),
    newBlocks: readonly(newBlocks),
  }
} 