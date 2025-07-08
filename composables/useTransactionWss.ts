import { createClient } from 'graphql-ws'
import { ref, onUnmounted, readonly, watch } from 'vue'
import { useSharedData } from '~/composables/useSharedData';

let client: any = null;
let unsubscribe: (() => void) | null = null;
const isConnected = ref(false);
const error = ref<string | null>(null);
const newTransactions = ref<any[]>([]);

const subscriptionQuery = `
  subscription HomeTxList($quantity: Int) {
    transactions(quantity: $quantity) {
      hash
      cmd {
        meta {
          chainId
          creationTime
          gasPrice
          sender
        }
      }
      result {
        ... on TransactionResult {
          gas
          block {
            height
          }
        }
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
      { query: subscriptionQuery, variables: { quantity: 12 } },
      {
        next: (result: any) => {
          if (result.data?.transactions) {
            const transaction = result.data.transactions;
            const txs = Array.isArray(transaction) ? transaction : [transaction];
            newTransactions.value.unshift(...txs);
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