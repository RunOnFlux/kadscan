import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly, watch } from 'vue'
import { useSharedData } from '~/composables/useSharedData';
import { updateTransactionCount } from '~/composables/useTransactionCount';

let client: any = null;
let unsubscribe: (() => void) | null = null;
const isConnected = ref(false);
const error = ref<string | null>(null);
const newTransactions = ref<any[]>([]);

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
`;

const startSubscription = () => {
  if (unsubscribe || !client) {
    console.warn("Transaction WSS client not ready or already subscribed.");
    return;
  }
  try {
    unsubscribe = client.subscribe(
      { query: subscriptionQuery, variables: { first: 200 } },
      {
        next: (result: any) => {
          if (result.data?.newBlocks && Array.isArray(result.data.newBlocks) && result.data.newBlocks.length > 0) {
            const allTxs = result.data.newBlocks.flatMap((block: any) => {
              if (block.transactions.totalCount > 0) {
                updateTransactionCount(block.height, block.chainId, block.transactions.totalCount, block.transactions.edges[0].node.cmd.meta.creationTime);
                return block.transactions.edges.map((edge: any) => edge.node)
              }
              return []
            });
            newTransactions.value.unshift(...allTxs);
            if (newTransactions.value.length > 50) {
              newTransactions.value.length = 50;
            }
          }
          isConnected.value = true
        },
        error: (err: any) => {
          console.error('Transaction WebSocket Subscription Error:', err);
          error.value = err.message || 'Unknown error';
          isConnected.value = false;
        },
        complete: () => {
          isConnected.value = false;
          unsubscribe = null;
        },
      }
    )
  } catch (err: unknown) {
    console.error('Failed to start Transaction WebSocket subscription:', err);
    error.value = err instanceof Error ? err.message : 'Failed to start subscription';
  }
}

const stopSubscription = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export const useTransactionWss = () => {
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
    newTransactions.value = [];

    // Setup new client
    const wssUrl = network.id === 'mainnet01'
      ? 'wss://vps.mainnet.kadindexer.io/wss/graphql'
      : 'wss://testnet.kadindexer.io/graphql';

    client = createClient({
      url: wssUrl,
      connectionParams: () => ({}),
    });
    console.log(`Transaction WSS client initialized for ${network.id}`);
  }, { immediate: true, deep: true });
  
  onUnmounted(() => {
    stopSubscription();
    if (client) {
      client.dispose();
      client = null;
    }
  })

  return {
    startSubscription,
    stopSubscription,
    isConnected: readonly(isConnected),
    error: readonly(error),
    newTransactions: readonly(newTransactions),
  }
} 