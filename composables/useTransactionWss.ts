import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly } from 'vue'
import { updateTransactionCount } from './useTransactionCount';

let client: any = null

if (process.client) {
  client = createClient({
    url: 'wss://mainnet.kadindexer.io/graphql',
    connectionParams: () => {
      return {}
    },
  })
}

const isConnected = ref(false)
const error = ref<string | null>(null)
const newTransactions = ref<any[]>([])

const subscriptionQuery = `
  subscription HomeTxList($first: Int) {
    newBlocks {
      height
      chainId
      transactions(first: $first) {
        edges {
          node {
            result {
              ... on TransactionResult {
                gas
              }
            }
            cmd {
              meta {
                chainId
                creationTime
                gasPrice
                sender
              }
            }
            hash
          }
        }
        totalCount
      }
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
        variables: {
          first: 200
        }
      },
      {
        next: (result: any) => {
          if (result.data?.newBlocks && Array.isArray(result.data.newBlocks)) {
            const allTxs: any[] = [];
            result.data.newBlocks.forEach((block: any) => {
              if (block.transactions?.totalCount > 0) {
                updateTransactionCount(block.transactions.totalCount, block.height, block.chainId);
              }

              if (block.transactions?.edges) {
                const txsInBlock = block.transactions.edges.map((edge: any) => edge.node);
                allTxs.push(...txsInBlock);
              }
            });

            newTransactions.value.unshift(...allTxs);
            if (newTransactions.value.length > 50) {
              newTransactions.value.length = 50;
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

export const useTransactionWss = () => {
  onUnmounted(() => {
    stopSubscription()
    client.dispose()
  })

  return {
    startSubscription,
    stopSubscription,
    isConnected: readonly(isConnected),
    error: readonly(error),
    newTransactions: readonly(newTransactions),
  }
} 