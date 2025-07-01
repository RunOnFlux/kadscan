import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly } from 'vue'

let client: any = null

// Only create client on the client side (browser)
if (process.client) {
  console.log('Creating WebSocket client...')
  client = createClient({
    url: 'wss://mainnet.kadindexer.io/graphql',
    connectionParams: () => {
      return {}
    },
  })
}

const isConnected = ref(false)
const error = ref<string | null>(null)
const newBlocks = ref<any[]>([])

const subscriptionQuery = `
  subscription Events {
    newBlocks {
      height
      minerAccount {
        accountName
      }
      transactions {
        totalCount
      }
      chainId
      creationTime
    }
  }
`

let unsubscribe: (() => void) | null = null

const startSubscription = () => {
  if (unsubscribe || !client) {
    return
  }
  
  try {
    unsubscribe = client.subscribe(
      {
        query: subscriptionQuery,
      },
      {
        next: (result: any) => {
          if (result.data?.newBlocks && Array.isArray(result.data.newBlocks)) {
            newBlocks.value.unshift(...result.data.newBlocks);
            if (newBlocks.value.length > 100) {
              newBlocks.value.length = 100;
            }
          }
          isConnected.value = true
        },
        error: (err: any) => {
          console.error('WebSocket Subscription Error:', err)
          error.value = err.message || 'Unknown error'
          isConnected.value = false
        },
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

const stopSubscription = () => {
  if (unsubscribe) {
    unsubscribe()
  }
}

export const useWebSocketSubscription = () => {
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