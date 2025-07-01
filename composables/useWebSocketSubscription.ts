import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly } from 'vue'

let client: any = null

// Only create client on the client side (browser)
if (process.client) {
  console.log('Creating WebSocket client...')
  client = createClient({
    url: 'wss://mainnet.kadindexer.io/graphql',
    connectionParams: () => {
      console.log('WebSocket connection params requested')
      return {}
    },
    on: {
      connecting: () => {
        console.log('WebSocket connecting...')
      },
      connected: () => {
        console.log('WebSocket connected successfully!')
      },
      closed: (event) => {
        console.log('WebSocket connection closed:', event)
      },
    },
  })
  console.log('WebSocket client created')
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
  console.log('startSubscription called', { unsubscribe: !!unsubscribe, client: !!client })
  
  if (unsubscribe || !client) {
    console.log('Subscription not started - already exists or no client')
    return
  }
  
  console.log('Starting WebSocket subscription')
  
  try {
    unsubscribe = client.subscribe(
      {
        query: subscriptionQuery,
      },
      {
        next: (result: any) => {
          console.log('WebSocket Subscription Response:', result)
          if (result.data?.newBlocks && Array.isArray(result.data.newBlocks)) {
            console.log('Adding new blocks:', result.data.newBlocks)
            result.data.newBlocks.forEach((block: any) => {
              newBlocks.value.unshift(block)
            })
          }
          isConnected.value = true
        },
        error: (err: any) => {
          console.error('WebSocket Subscription Error:', err)
          error.value = err.message || 'Unknown error'
          isConnected.value = false
        },
        complete: () => {
          console.log('WebSocket Subscription Complete')
          isConnected.value = false
          unsubscribe = null
        },
      }
    )
    console.log('WebSocket subscription started successfully')
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
    // stopSubscription()
    // client.dispose()
  })

  return {
    startSubscription,
    stopSubscription,
    isConnected: readonly(isConnected),
    error: readonly(error),
    newBlocks: readonly(newBlocks),
  }
} 