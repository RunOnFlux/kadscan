<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTransaction } from '~/composables/useTransaction'
import { useFormat } from '~/composables/useFormat'
import { useScreenSize } from '~/composables/useScreenSize'
import { useSharedData } from '~/composables/useSharedData'
import { useBlocks } from '~/composables/useBlocks'
import { staticTokens } from '~/constants/tokens'
import { integer } from '~/composables/number'
import { unescapeCodeString, parsePactCode, formatJsonPretty, formatSignatures } from '~/composables/string'
import TransactionLogs from '~/components/transaction/Logs.vue'
import TransactionCrossChain from '~/components/transaction/CrossChain.vue'
import { useStatus } from '~/composables/useStatus'
import IconHourglass from '~/components/icon/Hourglass.vue'
import IconCancel from '~/components/icon/Cancel.vue'
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import Clock from '~/components/icon/Clock.vue'
import SkeletonTransactionDetails from '~/components/skeleton/TransactionDetails.vue'
import ErrorOverlay from '~/components/error/Overlay.vue'
import Tooltip from '~/components/Tooltip.vue'
import Informational from '~/components/icon/Informational.vue'

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Transaction Details'
})

const { isMobile } = useScreenSize()
const { formatRelativeTime, truncateAddress } = useFormat()
const { selectedNetwork } = useSharedData()
const route = useRoute()

const transactionId = computed(() => route.params.requestKey as string)
const networkId = computed(() => selectedNetwork.value?.id)

const { lastBlockHeight, fetchLastBlockHeight } = useBlocks();

const {
  transaction,
  loading,
  error,
  fetchTransaction,
  clearState,
  primaryTransfer,
  transactionFee,
  gasPriceFormatted,
  blockConfirmations,
  kadenaPrice,
  signerTransferValue,
  transactionSigners,
  crossChainTransactionStatus,
  // Cross-chain properties
  crossChainTransaction,
  loadingCrossChain,
  crossChainTransfers,
  isSourceTransaction,
  hasCrossChainData,
  transactionExecutionResult,
} = useTransaction(transactionId, networkId)

// Text content for tooltips and labels
const textContent = {
  transactionHash: { label: 'Request Key:', description: 'Request Key is a unique identifier that is generated whenever a transaction is executed.' },
  status: { label: 'Status:', description: 'The status of the transaction.' },
  block: { label: 'Block:', description: 'Number of the block height in which the transaction is recorded. Block confirmations indicate how many blocks have been added since the transaction was produced.' },
  chainId: { label: 'Chain ID:', description: 'The specific chain (0-19) on which this block was mined' },
  timestamp: { label: 'Timestamp:', description: 'Date and time at which a transaction is produced.' },
  signers: { label: 'Signers:', description: 'Accounts that authorized this transaction.' },
  paidBy: { label: 'Paid By:', description: 'The account that submitted and paid the gas fees for this transaction.' },
  tokenTransfers: { label: 'Token Transfers:', description: 'Individual token transfers within this transaction' },
  value: { label: 'Value:', description: 'Total KDA transferred out of the signer(s) account(s) due to this transaction.' },
  transactionFee: { label: 'Transaction Fee:', description: 'Amount paid to process this transaction in KDA.' },
  gasPrice: { label: 'Gas Price:', description: 'Cost per unit of gas spent for this transaction.' },
  kadenaPrice: { label: 'Kadena Price:', description: 'Price of KDA on the day this transaction was created.' },
  gasLimit: { label: 'Gas Limit & Usage by Txn:', description: 'Maximum amount of gas allocated for the transaction & the amount eventually used.' },
  result: { label: 'Result:', description: 'Transaction execution result returned by Pact.' },
  otherAttributes: { label: 'Other Attributes:', description: 'Other data related to this transaction.' },
  inputData: { label: 'Input Data:', description: 'Pact code executed in this transaction.' },
  moreDetails: { label: 'More Details:' },
}

// Polling variables and functions
let pollingInterval: ReturnType<typeof setInterval> | null = null;

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

const startPolling = () => {
  stopPolling();
  pollingInterval = setInterval(() => {
    if (networkId.value && transactionId.value) {
      fetchTransaction();
      fetchLastBlockHeight({ networkId: networkId.value });
    }
  }, 6000);
};

// Tab management - simplified for now
const activeTab = ref('Overview')

// More details functionality
const showMoreDetails = ref(false)
const contentHeight = ref(0)
const contentRef = ref<HTMLElement | null>(null)

// Code resize functionality
const initialCodeContainerHeight = 125
const codeContainerHeight = ref(initialCodeContainerHeight) // Initial height
const isResizing = ref(false)
const resizeStartY = ref(0)
const resizeStartHeight = ref(0)
const contentHeightCodeVariation = ref(0)

// Code view functionality
const codeView = ref('default') // 'default' or 'raw'

const toggleMoreDetails = () => {
  if (!showMoreDetails.value) {
    showMoreDetails.value = true
    nextTick(() => {
      if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight - contentHeightCodeVariation.value
      }
    })
  } else {
    showMoreDetails.value = false
    setTimeout(() => {
      contentHeight.value = 0
    }, 300)
  }
}

// Draggable resize functionality
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  resizeStartY.value = event.clientY
  resizeStartHeight.value = codeContainerHeight.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return
  
  const deltaY = event.clientY - resizeStartY.value
  const newHeight = Math.max(30, Math.min(600, resizeStartHeight.value + deltaY))
  codeContainerHeight.value = newHeight
  contentHeightCodeVariation.value = newHeight - initialCodeContainerHeight
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Computed property for code display
const displayedCode = computed(() => {
  const rawCode = transaction.value?.cmd?.payload?.code
  
  if (codeView.value === 'raw') {
    return rawCode ? unescapeCodeString(rawCode) : 'No code available'
  } else if (codeView.value === 'default') {
    return rawCode ? parsePactCode(unescapeCodeString(rawCode)) : 'No code available'
  } else if (codeView.value === 'data') {
    return formatJsonPretty(transaction.value?.cmd?.payload?.data)
  } else if (codeView.value === 'signatures') {
    return formatSignatures(transaction.value?.sigs)
  }
})

  const { transactionStatus: computeTxStatus } = useStatus(lastBlockHeight)
  const transactionStatus = computed(() => computeTxStatus(
    transaction.value?.result?.block?.height,
    transaction.value?.result?.block?.canonical,
    transaction.value?.result?.badResult,
  ))

  // Cross-chain transaction status (duplicated from transactionStatus pattern)
  const crossChainStatus = computed(() => {
    // Return null if no cross-chain transaction detected
    if (!crossChainTransactionStatus.value) return null

    if (crossChainTransactionStatus.value === 'failed') {
      return {
        text: 'Cross Chain Transfer',
        icon: IconCancel,
        classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
        description: 'Cross-chain transaction failed to execute',
      };
    }

    if (crossChainTransactionStatus.value === 'success') {
      return {
        text: 'Cross Chain Transfer',
        icon: IconCheckmarkFill,
        classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
        description: 'Cross-chain transaction executed successfully',
      };
    }

    return {
      text: 'Cross Chain Transfer',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#44464980] text-[#989898]',
      description: 'Cross-chain transaction is pending to be finalized or failed',
    };
  });

const displayHash = computed(() => {
  if (!transaction.value?.hash) return ''
  return transaction.value.hash
})

const displayChainId = computed(() => {
  return transaction.value?.cmd?.meta?.chainId ?? '-'
})

const age = computed(() => {
  if (!transaction.value?.cmd?.meta?.creationTime) return ''
  return formatRelativeTime(transaction.value.cmd.meta.creationTime)
})

// Removed: from computed - now using transactionSigners from composable

const feePayer = computed(() => {
  return transaction.value?.cmd?.meta?.sender || ''
})

const transfersCount = computed(() => {
  return transaction.value?.result?.transfers?.totalCount || 0
})

const eventsCount = computed(() => {
  return transaction.value?.result?.eventCount || 0
})

// Tab management - defined after eventsCount to avoid initialization order issues
const tabLabels = computed(() => {
  const labels = ['Overview', `Logs (${eventsCount.value})`]
  
  if (hasCrossChainData.value) {
    labels.push('Cross Chain')
  }
  
  return labels
})

// Update activeTab when tabLabels change to ensure we're on a valid tab
watch(tabLabels, (newLabels) => {
  if (newLabels.length > 0 && !newLabels.includes(activeTab.value)) {
    activeTab.value = newLabels[0]
  }
}, { immediate: true })

// Token metadata helper function
const getTokenMetadata = (moduleName: string) => {
  const tokenData = staticTokens.find(token => token.module === moduleName)
  return tokenData || {
    name: moduleName,
    symbol: moduleName === 'coin' ? 'KDA' : moduleName.toUpperCase(),
    icon: null,
    module: moduleName
  }
}

// Calculate USD value for KDA transfers
const calculateKdaUsdValue = (amount: string, isKda: boolean) => {
  if (!isKda || !kadenaPrice.value || !amount) return null
  
  const numericAmount = parseFloat(amount)
  const priceValue = parseFloat(kadenaPrice.value.toString())
  const usdValue = numericAmount * priceValue
  
  return usdValue.toFixed(6)
}

// Format kadena price for display
const formattedKadenaPrice = computed(() => {
  if (!kadenaPrice.value) return null
  
  const price = typeof kadenaPrice.value === 'number' 
    ? kadenaPrice.value 
    : parseFloat(kadenaPrice.value.toString())
    
  return isNaN(price) ? null : `$${price.toFixed(4)} / KDA`
})

// Format gas limit and usage information
const formattedGasInfo = computed(() => {
  const gasUsed = transaction.value?.result?.gas
  const gasLimit = transaction.value?.cmd?.meta?.gasLimit
  
  if (!gasUsed || !gasLimit) return '-'
  
  const usedNum = parseInt(gasUsed)
  const limitNum = parseInt(gasLimit)

  // Don't show percentage if both are 0 or if calculation would result in NaN
  if (usedNum === 0 && limitNum === 0) {
    return "0 | 0"
  }
  
  // Calculate percentage
  const percentage = ((usedNum / limitNum) * 100).toFixed(2)
  
  // Format numbers with commas
  const formattedUsed = integer.format(usedNum)
  const formattedLimit = integer.format(limitNum)
  
  return `${formattedLimit} | ${formattedUsed} (${percentage}%)`
})

// Execution Result badge mapping (Good/Bad)
const executionResultBadge = computed(() => {
  if (!transactionExecutionResult?.value) return null
  if (transactionExecutionResult.value.type === 'badResult') {
    return {
      text: 'Bad',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
      description: 'Transaction returned a bad result',
    }
  }
  return {
    text: 'Good',
    icon: IconCheckmarkFill,
    classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
    description: 'Transaction returned a good result',
  }
})

// Helper function to conditionally truncate only hash-format addresses
const smartTruncateAddress = (address: string) => {
  if (!address) return address
  
  // Check if it's a long hash format address (k: followed by a long hex string)
  const isHashFormat = address.startsWith('k:') || address.length > 25
  
  if (isHashFormat) {
    return truncateAddress(address, 10, 10)
  }
  
  // Return as-is for short/human-readable addresses
  return address
}

// Helper functions to get actual sender/receiver addresses for cross-chain transfers
const getActualSender = (transfer: any) => {
  // Try regular senderAccount first, then crossChainTransfer.senderAccount
  return transfer.senderAccount || transfer.crossChainTransfer?.senderAccount || ''
}

const getActualReceiver = (transfer: any) => {
  // Try regular receiverAccount first, then crossChainTransfer.receiverAccount
  const receiver = transfer.receiverAccount || transfer.crossChainTransfer?.receiverAccount
  if (receiver) return receiver
  return 'k:system'
}

// Fetch transaction data
watch([transactionId, networkId], ([newTxId, newNetworkId], [oldTxId, oldNetworkId]) => {
  // If network changes while on the page, clear state to show skeleton
  if (newNetworkId !== oldNetworkId) {
    clearState()
  }
  if (newTxId && newNetworkId) {
    fetchTransaction()
  }
}, { immediate: true })

watch(
  networkId,
  (newNetworkId) => {
    if (newNetworkId) {
      fetchLastBlockHeight({ networkId: newNetworkId });
    }
  },
  { immediate: true }
);

// Polling control watcher
watch(
  [() => transaction.value, lastBlockHeight],
  ([currentTransaction, newLastBlockHeight]) => {
    if (!currentTransaction) return;

    const hasFailed = currentTransaction?.result?.badResult !== null;
    const isOldEnough = currentTransaction?.result?.block?.height &&
      (newLastBlockHeight - currentTransaction.result.block.height) > 6;

    // Keep polling until the transaction's block is old enough (>= 6 confirmations)
    // or the transaction has failed. Canonical flag may flip later; do not stop based on it.
    if (hasFailed || isOldEnough) {
      stopPolling();
    } else {
      startPolling();
    }
  },
  { deep: true }
);

onMounted(() => {
  // Fresh page mount: clear shared composable state to show skeleton
  clearState()
  if (transactionId.value && networkId.value) {
    fetchTransaction()
  }
})

onUnmounted(() => {
  // Clean up polling interval
  stopPolling();
  // Clean up event listeners
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <ErrorOverlay v-if="error" :message="error?.message" />
  <div v-else>
    <!-- Header -->
    <div class="flex items-center pb-5 border-b border-[#222222] mb-6 gap-2">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#f5f5f5]">
        Transaction Details
      </h1>
    </div>

    <!-- Loading state -->
    <SkeletonTransactionDetails v-if="loading && !pollingInterval" />

    <!-- Transaction content -->
    <div v-else-if="transaction">
      <!-- Tabs -->
      <div class="flex items-center justify-between pb-3">
        <div class="flex gap-2">
          <button
            v-for="label in tabLabels"
            :key="label"
            :class="[
              'px-[10px] py-[5px] text-[13px] rounded-lg font-medium transition-colors',
              activeTab === label
                ? 'bg-[#009367] text-[#f5f5f5]'
                : 'bg-[#252525] text-[#bbbbbb] hover:bg-[#333333]'
            ]"
            @click="activeTab = label"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Tab Content with Fade Transition -->
      <Transition name="tab-fade" mode="out-in">
        <!-- Logs Tab Content -->
        <TransactionLogs v-if="activeTab.startsWith('Logs')" :key="'logs'" :transaction="transaction" />

        <!-- Cross Chain Tab Content -->
        <TransactionCrossChain 
          v-else-if="activeTab.startsWith('Cross Chain')" 
          :key="'cross-chain'" 
          :transaction="transaction" 
          :cross-chain-transaction="crossChainTransaction"
          :cross-chain-transfers="crossChainTransfers"
          :is-source-transaction="isSourceTransaction"
          :loading-cross-chain="loadingCrossChain"
        />

        <!-- Transaction Details -->
        <div v-else-if="activeTab.startsWith('Overview')" :key="'overview'" class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
          <Divide>
            <!-- Section 1: Basic Information -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue  
                  :label="textContent.transactionHash.label" 
                  :description="textContent.transactionHash.description" 
                  tooltipPos="right"
                  topAlign="true"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#f5f5f5] break-all text-[15px]">{{ displayHash }}</span>
                      <Copy 
                        v-if="!isMobile"
                        :value="transaction.hash" 
                        tooltipText="Copy Transaction Request Key"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5"
                      />
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :row="isMobile" :label="textContent.status.label" :description="textContent.status.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <div class="w-fit">
                        <StatusBadge :status="transactionStatus" />
                      </div>
                      <!-- Cross Chain Transfer Badge with Status -->
                      <div v-if="crossChainStatus" class="w-fit">
                        <StatusBadge :status="crossChainStatus" />
                      </div>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :row="isMobile" :label="textContent.block.label" :description="textContent.block.description" tooltipPos="right">
                 <template #value>
                   <div class="flex items-center gap-2">
                     <IconHourglass v-if="transactionStatus.text === 'Pending'" class="w-3 h-3 text-[#bbbbbb]" />
                     <NuxtLink v-if="transaction?.result?.block?.height" :to="`/blocks/${transaction.result.block.height}/chain/${transaction.result.block.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ transaction.result.block.height }}</NuxtLink>
                     <span v-else-if="!transaction?.result?.block?.height && transaction?.cmd?.meta?.chainId && (transaction?.cmd?.meta?.creationTime === 0 || new Date(transaction?.cmd?.meta?.creationTime).getTime() < new Date('1970-01-02').getTime())" class="text-[#f5f5f5]">Genesis</span>
                     <span v-else class="text-[#f5f5f5]">-</span>
                     <span v-if="blockConfirmations !== null" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] text-[#f5f5f5] font-semibold flex items-center leading-none">
                      {{ blockConfirmations }} Block Confirmations
                     </span>
                   </div>
                 </template>
               </LabelValue>
              <LabelValue :row="isMobile" :label="textContent.chainId.label" :description="textContent.chainId.description" tooltipPos="right">
                <template #value>
                  <span class="text-[#f5f5f5] text-[15px]">
                    {{ displayChainId }}
                  </span>
                </template>
              </LabelValue>
               <LabelValue 
                :label="textContent.timestamp.label" 
                :description="textContent.timestamp.description" 
                tooltipPos="right"
                topAlign="true"
              >
                 <template #value>
                   <div class="flex items-center gap-2">
                     <!-- Show just "Genesis" for Genesis transactions without clock icon -->
                     <template v-if="!transaction?.result?.block?.height && transaction?.cmd?.meta?.chainId && (transaction?.cmd?.meta?.creationTime === 0 || new Date(transaction?.cmd?.meta?.creationTime).getTime() < new Date('1970-01-02').getTime())">
                       <span class="text-[#f5f5f5] text-[15px]">Genesis</span>
                     </template>
                     <!-- Normal timestamp display with clock icon -->
                     <template v-else>
                       <Clock class="w-4 h-4 text-[#bbbbbb]" />
                       <span v-if="age && transaction?.cmd?.meta?.creationTime" class="text-[#f5f5f5] text-[15px]">{{ age }} ({{ new Date(transaction.cmd.meta.creationTime).toUTCString() }})</span>
                       <span v-else class="text-[#f5f5f5] text-[15px]">-</span>
                     </template>
                   </div>
                 </template>
               </LabelValue>
              </div>
            </DivideItem>

            <!-- Section 2: Addresses -->
            <DivideItem v-if="transactionSigners.length > 0 || feePayer">
              <div class="flex flex-col gap-4">
                <LabelValue 
                  v-if="transactionSigners.length > 0" 
                  :topAlign="true"
                  :label="transactionSigners.length === 1 ? 'Signer:' : textContent.signers.label" 
                  :description="transactionSigners.length === 1 ? 'Key/account that authorized this transaction.' : 'Keys/accounts that authorized this transaction.'" 
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex flex-col gap-2">
                      <div 
                        v-for="signer in transactionSigners" 
                        :key="signer.pubkey"
                        class="flex items-center gap-2"
                      >
                        <template v-if="signer.address">
                          <NuxtLink :to="`/account/${signer.address}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ signer.address }}</NuxtLink>
                          <Copy 
                            :value="signer.address" 
                            tooltipText="Copy Signer Address"
                            iconSize="h-5 w-5"
                            buttonClass="w-5 h-5 lg:block hidden"
                          />
                        </template>
                        <template v-else>
                          <span class="text-[#f5f5f5] break-all">{{ smartTruncateAddress(signer.pubkey) }}</span>
                          <Copy 
                            :value="signer.pubkey" 
                            tooltipText="Copy Signer Pubkey"
                            iconSize="h-5 w-5"
                            buttonClass="w-5 h-5 lg:block hidden"
                          />
                        </template>
                      </div>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  v-if="feePayer" 
                  :label="textContent.paidBy.label" 
                  :description="textContent.paidBy.description" 
                  tooltipPos="right"
                  topAlign="true"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <NuxtLink :to="`/account/${feePayer}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ feePayer }}</NuxtLink>
                      <Copy 
                        :value="feePayer" 
                        tooltipText="Copy Fee Payer Address"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5 lg:block hidden"
                      />
                    </div>
                  </template>
                </LabelValue>
              </div>
            </DivideItem>

            <!-- Section 3: Token Transfers -->
            <DivideItem v-if="transaction?.result?.transfers?.edges?.length && activeTab === 'Overview'">
              <LabelValue
                :topAlign="true"
                :label="textContent.tokenTransfers.label"
                :description="textContent.tokenTransfers.description"
                tooltipPos="right"
              >
                <template #value>
                  <div class="flex flex-col gap-3">
                    <div 
                      v-for="(transferEdge, index) in transaction.result.transfers.edges" 
                      :key="transferEdge.node.id"
                      class="flex flex-wrap items-center gap-1.5 text-[15px]"
                    >
                      <!-- From Address -->
                      <span class="text-[#f5f5f5] font-medium">From</span>
                      <NuxtLink 
                        :to="`/account/${getActualSender(transferEdge.node)}`" 
                        class="text-[#6ab5db] hover:text-[#9ccee7]"
                      >{{ smartTruncateAddress(getActualSender(transferEdge.node)) }}</NuxtLink>
                      <Copy 
                        :value="getActualSender(transferEdge.node)" 
                        tooltipText="Copy sender address"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5 hover:opacity-100"
                      />
                      
                      <!-- To Address -->
                      <span class="text-[#f5f5f5] font-medium">To</span>
                      <NuxtLink 
                        v-if="getActualReceiver(transferEdge.node) !== 'k:system'"
                        :to="`/account/${getActualReceiver(transferEdge.node)}`" 
                        class="text-[#6ab5db] hover:text-[#9ccee7]"
                      >{{ smartTruncateAddress(getActualReceiver(transferEdge.node)) }}</NuxtLink>
                      <Copy 
                        v-if="getActualReceiver(transferEdge.node) !== 'k:system'"
                        :value="getActualReceiver(transferEdge.node)" 
                        tooltipText="Copy receiver address"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5 hover:opacity-100"
                      />
                      <span v-else class="text-[#f5f5f5]">{{ getActualReceiver(transferEdge.node) }}</span>
                      
                      <!-- Amount and Token Info -->
                      <span class="text-[#f5f5f5] font-medium">For</span>
                      <span class="text-[#f5f5f5]">{{ transferEdge.node.amount }}</span>
                      
                      <!-- USD Value for KDA -->
                      <span 
                        v-if="calculateKdaUsdValue(transferEdge.node.amount, transferEdge.node.moduleName === 'coin')" 
                        class="text-[#bbbbbb]"
                      >
                        (${{ calculateKdaUsdValue(transferEdge.node.amount, transferEdge.node.moduleName === 'coin') }})
                      </span>
                      
                      <!-- Token Icon -->
                      <div class="flex items-center gap-1">
                        <img 
                          v-if="getTokenMetadata(transferEdge.node.moduleName).icon"
                          :src="getTokenMetadata(transferEdge.node.moduleName).icon"
                          :alt="getTokenMetadata(transferEdge.node.moduleName).name"
                          class="w-5 h-5"
                        />
                        <div 
                          v-else
                          class="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        >
                          {{ getTokenMetadata(transferEdge.node.moduleName).symbol.charAt(0) }}
                        </div>
                        
                        <!-- Token Name -->
                        <NuxtLink 
                          :to="`/token/${transferEdge.node.moduleName}`" 
                          class="text-[#6ab5db] hover:text-[#9ccee7] font-medium"
                        >
                          {{ getTokenMetadata(transferEdge.node.moduleName).symbol }}
                        </NuxtLink>
                        
                        <!-- Copy Token Address -->
                        <Copy 
                          :value="transferEdge.node.moduleName" 
                          tooltipText="Copy token address"
                          iconSize="h-5 w-5"
                          buttonClass="w-5 h-5 opacity-70 hover:opacity-100"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </LabelValue>
            </DivideItem>

            <!-- Section 4: Misc -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue :row="isMobile" :label="textContent.value.label" :description="textContent.value.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#f5f5f5]">{{ signerTransferValue }} KDA</span>
                      <span v-if="signerTransferValue > 0" class="text-[#bbbbbb]">(${{ calculateKdaUsdValue(signerTransferValue, true) }})</span>
                    </div>
                  </template>
                </LabelValue>
                
                <LabelValue :row="isMobile" :label="textContent.transactionFee.label" :description="textContent.transactionFee.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#f5f5f5]">{{ transactionFee }} KDA</span>
                      <span v-if="transactionFee > 0" class="text-[#bbbbbb]">(${{ calculateKdaUsdValue(transactionFee, true) }})</span>
                    </div>
                  </template>
                </LabelValue>
                
                <LabelValue :row="isMobile" :label="textContent.gasPrice.label" :description="textContent.gasPrice.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#f5f5f5]">{{ gasPriceFormatted || '-' }}</span>
                    </div>
                  </template>
                </LabelValue>
              </div>
            </DivideItem>
          </Divide>
        </div>
      </Transition>

      <!-- Tab Content with Fade Transition -->
      <Transition name="tab-fade" mode="out-in">
        <!-- More Details Section -->
        <div v-if="activeTab.startsWith('Overview')" class="bg-[#111111] border border-[#222222] rounded-xl p-5 mb-2 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
          <div 
            ref="contentRef"
            class="overflow-hidden transition-all duration-300 ease-out"
            :style="{ height: showMoreDetails ? contentHeight + contentHeightCodeVariation + 'px' : '0px' }"
          >
            <div class="mb-4 pb-4 border-b border-[#222222]">
              <Divide>
                <!-- More Details -->
                <DivideItem>
                  <div class="flex flex-col gap-4">
                    <LabelValue :row="isMobile" :label="textContent.kadenaPrice.label" :description="textContent.kadenaPrice.description" tooltipPos="right">
                      <template #value>
                        <div class="flex items-center gap-2">
                          <span class="text-[#f5f5f5]">{{ formattedKadenaPrice || '-' }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue
                      :label="textContent.gasLimit.label"
                      :description="textContent.gasLimit.description"
                      tooltipPos="right"
                      :row="isMobile"
                    >
                      <template #value>
                        <div class="flex items-center gap-2">
                          <span class="text-[#f5f5f5]">{{ formattedGasInfo }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <!-- Execution Result (Good/Bad) -->
                    <LabelValue
                      v-if="executionResultBadge"
                      :label="textContent.result.label"
                      :description="textContent.result.description"
                      tooltipPos="right"
                      :row="isMobile"
                    >
                      <template #value>
                        <div class="flex items-stretch gap-3 w-full min-w-0">
                          <div class="shrink-0">
                            <StatusBadge :status="executionResultBadge" />
                          </div>
                          <div class="flex-1 text-[#f5f5f5]">
                            {{ transactionExecutionResult.value }}
                          </div>
                        </div>
                      </template>
                    </LabelValue>
                  </div>
                </DivideItem>

                <!-- Transaction Details -->
                <DivideItem>
                  <div class="flex flex-col gap-4">
                    <LabelValue 
                      :label="textContent.otherAttributes.label" 
                      :description="textContent.otherAttributes.description"
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex flex-wrap gap-2">
                          <span v-if="transaction?.cmd?.meta?.ttl !== undefined" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                            <span class="text-[#bbbbbb]">TTL:</span>
                            <span class="text-[#f5f5f5] ml-1">{{ transaction?.cmd?.meta?.ttl }}</span>
                          </span>
                          <span v-if="transaction?.cmd?.nonce !== undefined" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                            <span class="text-[#bbbbbb]">Nonce:</span>
                            <span class="text-[#f5f5f5] ml-1">{{ transaction?.cmd?.nonce }}</span>
                          </span>
                          <span v-if="transaction?.result?.transactionId !== undefined" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                            <span class="text-[#bbbbbb]">TXID:</span>
                            <span class="text-[#f5f5f5] ml-1">{{ transaction?.result?.transactionId }}</span>
                          </span>
                        </div>
                      </template>
                    </LabelValue>
                    <!-- Custom Code Section with Full Width -->
                    <div class="flex flex-col md:flex-row items-start gap-1 md:gap-0">
                      <!-- Label Section (matching LabelValue styling) -->
                      <div class="flex gap-2 w-full md:min-w-[300px] md:max-w-[300px]">
                        <div class="flex items-center gap-2">
                          <Tooltip
                            :value="textContent.inputData.description"
                            placement="right"
                            :offset-distance="16"
                          >
                            <Informational class="w-4 h-4" />
                          </Tooltip>
                          <span class="text-[#bbbbbb] text-[15px] font-normal">
                            {{ textContent.inputData.label }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Code Container with proper boundaries -->
                      <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
                        <div class="w-full">
                          <!-- Resizable Code Container -->
                          <div class="relative">
                            <div class="relative">
                              <textarea
                                readonly
                                :value="displayedCode"
                                class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto"
                                :style="{ height: codeContainerHeight + 'px' }"
                              ></textarea>
                              
                              <!-- Diagonal Triangle Resize Handle -->
                              <div 
                                @mousedown="startResize"
                                class="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize group"
                                :class="{ 'opacity-80': isResizing }"
                              >
                                <!-- Simple diagonal grip lines -->
                                <div class="absolute bottom-1 right-1 w-3 h-3">
                                  <div class="absolute bottom-0 right-0 w-[1px] h-1.5 bg-[#bbbbbb] transform rotate-45 origin-bottom-right translate-y-[-5px] translate-x-[-4px]"></div>
                                  <div class="absolute bottom-0 right-0 w-[1px] h-2.5 bg-[#bbbbbb] transform rotate-45 origin-bottom-right translate-y-[-5px] translate-x-[-7px]"></div>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Toggle buttons for code view -->
                            <div class="flex gap-2 mt-3">
                              <button 
                                @click="codeView = 'default'"
                                :class="[
                                  'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                  codeView === 'default' 
                                    ? 'text-[#f5f5f5] cursor-default' 
                                    : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dadfe3] hover:text-[#000000]'
                                ]"
                              >
                                Default View
                              </button>
                              <button 
                                @click="codeView = 'raw'"
                                :class="[
                                  'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                  codeView === 'raw' 
                                    ? 'text-[#f5f5f5] cursor-default' 
                                    : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dadfe3] hover:text-[#000000]'
                                ]"
                              >
                                Original
                              </button>
                              <button 
                                @click="codeView = 'data'"
                                :class="[
                                  'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                  codeView === 'data' 
                                    ? 'text-[#f5f5f5] cursor-default' 
                                    : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dadfe3] hover:text-[#000000]'
                                ]"
                              >
                                Data
                              </button>
                              <button 
                                @click="codeView = 'signatures'"
                                :class="[
                                  'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                  codeView === 'signatures' 
                                    ? 'text-[#f5f5f5] cursor-default' 
                                    : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dadfe3] hover:text-[#000000]'
                                ]"
                              >
                                Signatures
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DivideItem>
              </Divide>
            </div>
          </div>
          
          <Divide>
            <DivideItem>
              <LabelValue
                :label="isMobile ? '' : textContent.moreDetails.label"
                tooltipPos="right"
              >
                <template #value>
                  <button 
                    @click="toggleMoreDetails"
                    class="flex items-center gap-1 transition-colors text-[15px] hover:text-[#9ccee7] text-[#6AB5DB]"
                  >
                    <svg 
                      class="w-3 h-3 transition-transform duration-300" 
                      :class="showMoreDetails ? 'rotate-45' : ''"
                      fill="none" 
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ showMoreDetails ? 'Click to hide' : 'Click to show more' }}
                  </button>
                </template>
              </LabelValue>
            </DivideItem>
          </Divide>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Tab fade transition styles */
.tab-fade-enter-active {
  transition: opacity 0.15s ease-in-out;
}

.tab-fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

.tab-fade-enter-to,
.tab-fade-leave-from {
  opacity: 1;
}
</style>
