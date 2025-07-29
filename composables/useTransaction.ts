import { ref, computed } from 'vue'
import { useBinance } from '~/composables/useBinance'

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
              id
              height
              chainId
              moduleName
              name
              orderIndex
              parameterText
              parameters
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
              creationTime
              id
              crossChainTransfer {
                amount
                creationTime
                id
                moduleHash
                moduleName
                orderIndex
                receiverAccount
                requestKey
                senderAccount
              }
              moduleHash
              moduleName
              orderIndex
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

const LAST_BLOCK_HEIGHT_QUERY = `
  query Query {
    lastBlockHeight
  }
`;

const transaction = ref<any>(null)
const loading = ref(true)
const error = ref<any>(null)
const kadenaPrice = ref<number | null>(null)
const kadenaPriceLastDay = ref<Date | null>(null)
const lastBlockHeight = ref<number | null>(null)

export const useTransaction = (
  transactionId: Ref<string | undefined>,
  networkId: Ref<string | undefined>
) => {
  const { fetchKadenaPriceAtDate } = useBinance()

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

  const fetchLastBlockHeight = async () => {
    if (!networkId.value) return
    
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: { 
          query: LAST_BLOCK_HEIGHT_QUERY,
          networkId: networkId.value,
        },
      });
      lastBlockHeight.value = response?.data?.lastBlockHeight || null;
    } catch (error) {
      console.error('Error fetching last block height:', error);
      lastBlockHeight.value = null;
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
    if (!transaction.value?.result?.gas || !transaction.value?.cmd?.meta?.gasPrice) return '0'
    const gasUsed = parseFloat(transaction.value.result.gas)
    const gasPrice = parseFloat(transaction.value.cmd.meta.gasPrice)
    return (gasUsed * gasPrice).toString()
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
        // Keep signers that DON'T have coin.GAS capability
        if (!signer.clist || signer.clist.length === 0) {
          return true // Unrestricted signer (not gas payer)
        }
        
        // Check if this signer has coin.GAS capability
        const hasGasCapability = signer.clist.some((cap: any) => cap.name === 'coin.GAS')
        return !hasGasCapability // Keep only non-gas signers
      })
      .map((signer: any) => ({
        address: signer.pubkey ? `k:${signer.pubkey}` : '',
        pubkey: signer.pubkey
      }))
  })

  const signerTransferValue = computed(() => {
    if (!transaction.value?.cmd?.signers?.length || !transaction.value?.result?.transfers?.edges?.length) {
      return '0'
    }
    
    // Use pubkey with k: prefix just like the "From" field does
    const pubkey = transaction.value.cmd.signers[0].pubkey
    const signerAddress = pubkey ? `k:${pubkey}` : ''
    let totalValue = 0
    
    // Loop through all transfers and sum KDA transfers from the signer
    transaction.value.result.transfers.edges.forEach((edge: any) => {
      const transfer = edge.node
      if (transfer.senderAccount === signerAddress && transfer.moduleName === 'coin') {
        totalValue += parseFloat(transfer.amount || '0')
      }
    })
    
    return totalValue.toString()
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
        fetchLastBlockHeight()
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
    fetchKadenaPrice,
    kadenaPrice,
    kadenaPriceLastDay,
    lastBlockHeight,
    primaryTransfer,
    transactionFee,
    blockConfirmations,
    signerTransferValue,
    transactionSigners,
  }
}