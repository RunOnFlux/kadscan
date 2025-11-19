import { ref, watch, onScopeDispose, type Ref } from 'vue'

// Minimal local shape for fields accessed by this composable
type TxLike = {
  result?: { badResult?: unknown | null; block?: { height?: number | undefined } }
}

export interface UseTransactionPollingParams {
  transaction: Ref<TxLike | null>
  lastBlockHeight: Ref<number>
  networkId: Ref<string | undefined>
  transactionId: Ref<string | undefined>
  fetchTransaction: () => Promise<void> | void
  fetchLastBlockHeight: (args: { networkId: string }) => Promise<void> | void
}

/**
 * Handles background polling for a single transaction view.
 * Starts a 6s cadence only after the first transaction is present, and stops
 * when the tx fails or reaches >= 6 safe confirmations. Ensures cleanup on
 * scope dispose; exposes a reactive `isPolling` for UI skeleton semantics.
 */
export function useTransactionPolling(params: UseTransactionPollingParams) {
  const { transaction, lastBlockHeight, networkId, transactionId, fetchTransaction, fetchLastBlockHeight } = params

  const isPolling = ref(false)
  let intervalHandle: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (intervalHandle) {
      clearInterval(intervalHandle)
      intervalHandle = null
    }
    isPolling.value = false
  }

  function start() {
    stop()
    // Do not begin polling until we have the minimum inputs
    if (!networkId.value || !transactionId.value) return
    isPolling.value = true
    intervalHandle = setInterval(() => {
      if (!networkId.value || !transactionId.value) return
      fetchTransaction()
      fetchLastBlockHeight({ networkId: networkId.value })
    }, 6000)
  }

  // Mirror page logic: stop when failed or when block is old enough (>= 6 confirmations)
  watch(
    [() => transaction.value, lastBlockHeight],
    ([currentTransaction, newLastBlockHeight]) => {
      // Do not poll until we have a transaction to evaluate
      if (!currentTransaction) {
        stop()
        return
      }

      const hasFailed = currentTransaction?.result?.badResult !== null
      const txHeight: number | undefined = currentTransaction?.result?.block?.height
      const isOldEnough = typeof txHeight === 'number' && (newLastBlockHeight - txHeight) > 6

      if (hasFailed || isOldEnough) {
        stop()
      } else {
        start()
      }
    },
    { deep: true }
  )

  onScopeDispose(() => {
    stop()
  })

  return { isPolling, start, stop }
}


