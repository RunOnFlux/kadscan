import { ref, computed, type Ref } from 'vue'

// Minimal local shape for fields accessed by this composable
type TxTransferNode = {
  crossChainTransfer: {
    requestKey: string
    creationTime?: string
    receiverAccount?: string
    senderAccount?: string
    block: { chainId: string; canonical?: boolean }
    transaction?: { result?: { badResult?: unknown | null } }
  } | null
  senderAccount?: string
  receiverAccount?: string
  moduleName: string
  amount: string
  requestKey?: string
}

type TxLike = {
  cmd?: { meta?: { chainId?: string }; payload?: { step?: unknown; pactId?: unknown } }
  result?: {
    continuation?: unknown
    transfers?: { edges?: Array<{ node: TxTransferNode }> }
  }
}

export interface UseTransactionCrossChainParams {
  transaction: Ref<TxLike | null>
}

/**
 * Cross-chain transaction utilities: state, fetch helpers, and derivations.
 * Encapsulates related/destination request fetch and derived mappings while
 * remaining side-effect free except for its own fetch method. Designed to be
 * delegated by useTransaction and re-exported for backward compatibility.
 */
export function useTransactionCrossChain(params: UseTransactionCrossChainParams) {
  const { transaction } = params

  const crossChainTransaction = ref<any>(null)
  const loadingCrossChain = ref(false)

  // Helper: determine if a continuation value is meaningful
  // TODO: Replace this with strict GraphQL union checks (__typename) or
  //       backend-normalized nulls so we don't need to special-case "null" strings here.
  const hasRealContinuation = (continuation: unknown): boolean => {
    if (continuation == null) return false
    if (typeof continuation === 'string') {
      const normalized = continuation.trim().toLowerCase()
      if (normalized === 'null' || normalized === '') return false
    }
    return true
  }

  const RELATED_TRANSACTION_QUERY = `
query GetRelatedTransaction($requestKey: String!) {
  transaction(requestKey: $requestKey) {
    hash
    cmd {
      meta {
        chainId
        creationTime
        gasLimit
        gasPrice
        sender
        ttl
      }
      networkId
      nonce
      payload {
        ... on ContinuationPayload {
          data
          pactId
          proof
          rollback
          step
        }
        ... on ExecutionPayload {
          code
          data
        }
      }
    }
    result {
      ... on TransactionResult {
        badResult
        block {
          chainId
          canonical
          height
        }
        continuation
        gas
        goodResult
        transactionId
      }
    }
  }
}
`

  const fetchCrossChainTransaction = async (requestKey: string, networkId: string) => {
    if (!requestKey || !networkId) return
    loadingCrossChain.value = true
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: RELATED_TRANSACTION_QUERY,
          variables: { requestKey },
          networkId,
        },
      })
      if (response?.errors) throw new Error('Unable to load related transaction.')
      crossChainTransaction.value = response?.data?.transaction || null
    } catch (_e) {
      crossChainTransaction.value = null
    } finally {
      loadingCrossChain.value = false
    }
  }

  const isCrossChain = computed(() => {
    const hasContResult = hasRealContinuation(transaction.value?.result?.continuation)
    const hasContPayload = transaction.value?.cmd?.payload?.pactId != null
    return Boolean(hasContResult || hasContPayload)
  })

  const crossChainTransfers = computed(() => {
    if (!transaction.value?.result?.transfers?.edges) return []
    return transaction.value.result.transfers.edges
      .filter((edge: any) => edge.node.crossChainTransfer !== null)
      .map((edge: any) => {
        const isSource = transaction.value?.cmd?.payload?.step === undefined
        return {
          ...edge.node,
          sourceChainId: isSource ? transaction.value?.cmd?.meta?.chainId : edge.node.crossChainTransfer.block.chainId,
          destinationChainId: isSource ? edge.node.crossChainTransfer.block.chainId : transaction.value?.cmd?.meta?.chainId,
          currentChainId: transaction.value?.cmd?.meta?.chainId,
          destinationRequestKey: edge.node.crossChainTransfer.requestKey,
          destinationCreationTime: edge.node.crossChainTransfer.creationTime,
          isDestinationSuccessful: edge.node.crossChainTransfer.transaction?.result?.badResult === null,
        }
      })
  })

  const isSourceTransaction = computed(() => transaction.value?.cmd?.payload?.step === undefined)

  const hasCrossChainData = computed(() => crossChainTransfers.value.length > 0)

  const crossChainTransactionStatus = computed<('failed' | 'success' | 'pending') | null>(() => {
    const hasContResult = hasRealContinuation(transaction.value?.result?.continuation)
    const hasContPayload = transaction.value?.cmd?.payload?.pactId != null
    if (!hasContResult && !hasContPayload) return null
    const transfers = transaction.value?.result?.transfers?.edges?.map((e: any) => e.node) || []
    const withX = transfers.filter((t: any) => t.crossChainTransfer !== null)
    for (const t of withX) {
      if (t?.crossChainTransfer?.transaction?.result?.badResult !== null) return 'failed'
    }
    const hasCompletePair = withX.some((t: any) => {
      const cc = t.crossChainTransfer
      return Boolean((t.senderAccount || cc?.senderAccount) && (t.receiverAccount || cc?.receiverAccount))
    })
    if (hasCompletePair) return 'success'
    return 'pending'
  })

  return {
    crossChainTransaction,
    loadingCrossChain,
    fetchCrossChainTransaction,
    isCrossChain,
    crossChainTransfers,
    isSourceTransaction,
    hasCrossChainData,
    crossChainTransactionStatus,
  }
}


