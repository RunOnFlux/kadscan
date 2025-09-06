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
      ? 'wss://devnet.kadindexer.io/mainnet/wss/graphql'
      : 'wss://devnet.kadindexer.io/testnet/wss/graphql';

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
const MAX_INCOMING_COUNT = 1000;
const overLimit = ref(false);

const COUNT_SUBSCRIPTION = `
  subscription Subscription($quantity: Int) {
    transactions(quantity: $quantity) {
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
          const payload = result?.data?.transactions;
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
          console.error('Transaction Count WebSocket Subscription Error:', err);
          countError.value = err?.message || 'Unknown error';
          countIsConnected.value = false;
        },
        complete: () => {
          countIsConnected.value = false;
          countUnsubscribe = null;
        },
      }
    );
  } catch (err: unknown) {
    console.error('Failed to start Transaction Count WebSocket subscription:', err);
    countError.value = err instanceof Error ? err.message : 'Failed to start subscription';
  }
}

const stopCountSubscription = () => {
  if (countUnsubscribe) {
    countUnsubscribe();
    countUnsubscribe = null;
  }
}

export const useTransactionCountWss = () => {
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