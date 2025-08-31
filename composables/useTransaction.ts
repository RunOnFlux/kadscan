import { ref, computed } from 'vue'
import { useBinance } from '~/composables/useBinance'
import { useFormat } from '~/composables/useFormat'

// Helper: determine if a pubkey can be mapped to a Kadena k:<pubkey> account
const isKAccountPubKey = (value: string | undefined | null) => {
  if (!value) return false
  return /^[0-9a-f]{64}$/i.test(String(value))
}

const TRANSACTION_QUERY = `
query Transaction($requestKey: String!, $first: Int, $transfersFirst2: Int) {
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
      signers {
        address
        clist {
          args
          name
        }
        id
        orderIndex
        pubkey
        scheme
      }
    }
    id
    orphanedTransactions {
      id
      hash
    }
    sigs {
      sig
    }
    result {
      ... on TransactionMempoolInfo {
        status
      }
      ... on TransactionResult {
        badResult
        block {
          chainId
          canonical
          height
        }
        continuation
        eventCount
        events(first: $first) {
          totalCount
          edges {
            node {
              moduleName
              name
              orderIndex
              parameterText
              qualifiedName
              requestKey
            }
          }
        }
        gas
        goodResult
        transactionId
        logs
        transfers(first: $transfersFirst2) {
          totalCount
          edges {
            node {
              amount
              crossChainTransfer {
                creationTime
                receiverAccount
                requestKey
                senderAccount
                block {
                  canonical
                  chainId
                }
                transaction {
                  result {
                    ... on TransactionResult {
                      badResult
                      goodResult
                    }
                  }
                }
              }
              moduleName
              receiverAccount
              requestKey
              senderAccount
            }
          }
        }
      }
    }
  }
}
`;

// Query for fetching cross-chain related transaction
const CROSS_CHAIN_RELATED_TRANSACTION_QUERY = `
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
`;

const transaction = ref<any>(null)
const loading = ref(true)
const error = ref<any>(null)
const kadenaPrice = ref<number | null>(null)
const kadenaPriceLastDay = ref<Date | null>(null)

// Cross-chain related transaction state
const crossChainTransaction = ref<any>(null)
const loadingCrossChain = ref(false)

// Clear state for fresh page mounts (do not use for in-page param changes)
const clearState = () => {
  transaction.value = null
  loading.value = true
  error.value = null
  crossChainTransaction.value = null
  loadingCrossChain.value = false
}

export const useTransaction = (
  transactionId: Ref<string | undefined>,
  networkId: Ref<string | undefined>
) => {
  const { fetchKadenaPriceAtDate } = useBinance()
  const { lastBlockHeight, fetchLastBlockHeight } = useBlocks();
  const { formatGasPrice, formatKda } = useFormat()

  const fetchKadenaPrice = async (creationTime: string) => {
    if (!creationTime) return

    const creationTimeDayOnly = new Date(creationTime)
    creationTimeDayOnly.setUTCHours(0, 0, 0, 0)
    
    if (kadenaPrice.value === null || kadenaPriceLastDay.value?.getTime() !== creationTimeDayOnly.getTime()) {
      const priceData: any = await fetchKadenaPriceAtDate(creationTimeDayOnly)
      kadenaPriceLastDay.value = creationTimeDayOnly
      if (priceData && priceData.price) {
        kadenaPrice.value = priceData.price
      }
    }
  }

  // Function to fetch cross-chain related transaction
  const fetchCrossChainTransaction = async (requestKey: string, networkId: string) => {
    if (!requestKey || !networkId) return
    
    loadingCrossChain.value = true
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: CROSS_CHAIN_RELATED_TRANSACTION_QUERY,
          variables: {
            requestKey: requestKey
          },
          networkId: networkId
        }
      })
      
      crossChainTransaction.value = response?.data?.transaction
    } catch (error) {
      console.error('Error fetching cross-chain related transaction:', error)
      crossChainTransaction.value = null
    } finally {
      loadingCrossChain.value = false
    }
  }

  // Computed properties for derived data
  const primaryTransfer = computed(() => {
    if (!transaction.value?.result?.transfers?.edges) return null
    // Get the coin transfer (gas fee transfer)
    return transaction.value.result.transfers.edges.find((edge: any) => 
      edge.node.moduleName === 'coin'
    )?.node || transaction.value.result.transfers.edges[0]?.node
  })

  const transactionFee = computed(() => {
    const gas = transaction.value?.result?.gas
    const price = transaction.value?.cmd?.meta?.gasPrice
    if (!gas || !price) return '0.0'
    const gasUsed = parseFloat(gas)
    const gasPriceNumber = parseFloat(price)
    const fee = gasUsed * gasPriceNumber
    return formatKda(fee, 12)
  })

  const gasPriceFormatted = computed(() => {
    const price = transaction.value?.cmd?.meta?.gasPrice
    if (!price) return ''
    const num = parseFloat(price)
    if (Number.isNaN(num)) return String(price)
    return formatGasPrice(num, 10)
  })

  // Normalized execution result (good/bad)
  const transactionExecutionResult = computed(() => {
    const bad = transaction.value?.result?.badResult
    const good = transaction.value?.result?.goodResult

    if (bad !== null && bad !== undefined) {
      return { type: 'badResult' as const, value: String(bad) }
    }

    if (good !== null && good !== undefined) {
      return { type: 'goodResult' as const, value: String(good) }
    }

    return null
  })

  const blockConfirmations = computed(() => {
    if (!lastBlockHeight.value || !transaction.value?.result?.block?.height) return null
    
    // Calculate last safe block (lastBlockHeight - 6)
    const lastSafeBlock = lastBlockHeight.value - 6
    const transactionBlockHeight = transaction.value.result.block.height
    
    // Calculate confirmations as difference between safe block and transaction block
    const confirmations = lastSafeBlock - transactionBlockHeight
    
    // Only return confirmations if positive (block is confirmed and safe)
    return confirmations > 0 ? confirmations : null
  })

  const transactionSigners = computed(() => {
    if (!transaction.value?.cmd?.signers?.length) return []
    
    return transaction.value.cmd.signers
      .filter((signer: any) => {
        // Only filter out signers that have ONLY coin.GAS capability and no other capabilities
        if (!signer.clist || signer.clist.length === 0) {
          return true // Unrestricted signer
        }
        
        // If signer has capabilities, check if it's ONLY coin.GAS
        const hasGasCapability = signer.clist.some((cap: any) => cap.name === 'coin.GAS')
        const hasOtherCapabilities = signer.clist.some((cap: any) => cap.name !== 'coin.GAS')
        
        // Keep signers that either don't have gas capability OR have other capabilities besides gas
        return !hasGasCapability || hasOtherCapabilities
      })
      .map((signer: any) => {
        const pubkey: string = String(signer.pubkey || '')
        const address = isKAccountPubKey(pubkey) ? `k:${pubkey.toLowerCase()}` : ''
        return {
          address,
          pubkey
        }
      })
  })

  // Cross-chain transaction status detection
  const crossChainTransactionStatus = computed(() => {
    if (!transaction.value?.result?.transfers?.edges?.length) return null

    const transfers = transaction.value.result.transfers.edges.map((edge: any) => edge.node)
    
    // Check for source cross-chain (receiverAccount is empty)
    const sourceTransfer = transfers.find((transfer: any) => 
      !transfer.receiverAccount || transfer.receiverAccount === ''
    )
    
    // Check for destination cross-chain (senderAccount is empty)  
    const destinationTransfer = transfers.find((transfer: any) => 
      !transfer.senderAccount || transfer.senderAccount === ''
    )
    
    // If neither source nor destination cross-chain detected, return null
    if (!sourceTransfer && !destinationTransfer) return null
    
    // Find transfers that have crossChainTransfer data (not null)
    const transfersWithCrossChain = transfers.filter((transfer: any) => 
      transfer.crossChainTransfer !== null
    )
    
    // Check if any crossChainTransfer has badResult different than null (FAILED)
    for (const transfer of transfersWithCrossChain) {
      if (transfer.crossChainTransfer?.transaction?.result?.badResult !== null) {
        return 'failed'
      }
    }
    
    // If we have transfers with crossChainTransfer data, check for SUCCESS
    if (transfersWithCrossChain.length > 0) {
      // Check if we have complete pair across both levels (transfer + crossChainTransfer)
      const hasCompletePair = transfersWithCrossChain.some((transfer: any) => {
        const crossChain = transfer.crossChainTransfer
        
        // Check if we have complementary sender/receiver across both levels
        const hasSender = transfer.senderAccount || crossChain.senderAccount
        const hasReceiver = transfer.receiverAccount || crossChain.receiverAccount
        
        return hasSender && hasReceiver
      })
      
      if (hasCompletePair) {
        return 'success'
      }
    }
    
    // If we detected cross-chain activity but crossChainTransfer is null OR incomplete, it's PENDING
    return 'pending'
  })

  const signerTransferValue = computed(() => {
    if (!transaction.value?.cmd?.signers?.length || !transaction.value?.result?.transfers?.edges?.length) {
      return '0'
    }

    // Collect all valid k: addresses derived from 64-hex pubkeys
    const signerAddresses: string[] = (transactionSigners.value || [])
      .map((s: any) => s.address)
      .filter((addr: string) => Boolean(addr))

    if (signerAddresses.length === 0) return '0'

    let totalValue = 0

    transaction.value.result.transfers.edges.forEach((edge: any) => {
      const transfer = edge.node
      if (transfer.moduleName === 'coin' && signerAddresses.includes(transfer.senderAccount)) {
        totalValue += parseFloat(transfer.amount || '0')
      }
    })

    return totalValue.toString()
  })

  // Cross-chain computed properties
  const crossChainTransfers = computed(() => {
    if (!transaction.value?.result?.transfers?.edges) return []
    
    return transaction.value.result.transfers.edges
      .filter((edge: any) => edge.node.crossChainTransfer !== null)
      .map((edge: any) => {
        // Determine if current transaction is source or destination
        const isSource = transaction.value.cmd.payload?.step === undefined
        
        return {
          ...edge.node,
          // Always show correct source → destination flow regardless of which transaction we're viewing
          sourceChainId: isSource 
            ? transaction.value.cmd.meta.chainId 
            : edge.node.crossChainTransfer.block.chainId,
          destinationChainId: isSource 
            ? edge.node.crossChainTransfer.block.chainId 
            : transaction.value.cmd.meta.chainId,
          // Keep for backward compatibility but mark as deprecated
          currentChainId: transaction.value.cmd.meta.chainId,
          destinationRequestKey: edge.node.crossChainTransfer.requestKey,
          destinationCreationTime: edge.node.crossChainTransfer.creationTime,
          isDestinationSuccessful: edge.node.crossChainTransfer.transaction?.result?.badResult === null
        }
      })
  })

  // Determine if current transaction is source or destination
  const isSourceTransaction = computed(() => {
    // If we have a continuation payload, this is likely the destination
    return transaction.value?.cmd?.payload?.step === undefined
  })

  // Cross-chain data availability check
  const hasCrossChainData = computed(() => {
    return crossChainTransfers.value.length > 0
  })

  const fetchTransaction = async () => {
    if (!transactionId.value || !networkId.value) {
      return
    }

    loading.value = transaction.value === null
    error.value = null

    try {
      // Fetch both transaction data and last block height in parallel
      const [transactionResponse] = await Promise.all([
        $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: TRANSACTION_QUERY,
            variables: {
              requestKey: transactionId.value,
              first: 50,
              transfersFirst2: 50,
            },
            networkId: networkId.value,
          },
        }),
        fetchLastBlockHeight({ networkId: networkId.value })
      ]);

      if (transactionResponse.errors) {
        throw new Error(transactionResponse.errors.map((e: any) => e.message).join(', '));
      }

      transaction.value = transactionResponse?.data?.transaction;
      
      // If transaction is null, it means the transaction doesn't exist
      if (transaction.value === null) {
        error.value = true;
        return;
      }
      
      if (transaction.value && transaction.value.cmd?.meta?.creationTime) {
        await fetchKadenaPrice(transaction.value.cmd.meta.creationTime)
      }

      // Check for cross-chain transfers and fetch related transaction
      if (transaction.value?.result?.transfers?.edges) {
        const crossChainTransfer = transaction.value.result.transfers.edges
          .find((edge: any) => edge.node.crossChainTransfer !== null)
        
        if (crossChainTransfer?.node?.crossChainTransfer?.requestKey) {
          await fetchCrossChainTransaction(
            crossChainTransfer.node.crossChainTransfer.requestKey,
            networkId.value
          )
        }
      }
    } catch (e) {
      error.value = e
      transaction.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    transaction,
    loading,
    error,
    fetchTransaction,
    clearState,
    fetchKadenaPrice,
    kadenaPrice,
    kadenaPriceLastDay,
    lastBlockHeight,
    primaryTransfer,
    transactionFee,
    gasPriceFormatted,
    blockConfirmations,
    signerTransferValue,
    transactionSigners,
    crossChainTransactionStatus,
    // Cross-chain properties
    crossChainTransaction,
    loadingCrossChain,
    crossChainTransfers,
    isSourceTransaction,
    hasCrossChainData,
    fetchCrossChainTransaction,
    transactionExecutionResult,
  }
}