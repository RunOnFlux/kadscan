<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTransaction } from '~/composables/useTransaction'
import { useFormat } from '~/composables/useFormat'
import { useScreenSize } from '~/composables/useScreenSize'
import { useSharedData } from '~/composables/useSharedData'
import { staticTokens } from '~/constants/tokens'
import { integer } from '~/composables/number'
import { unescapeCodeString, parsePactCode, formatJsonPretty, formatSignatures } from '~/composables/string'
import Informational from '~/components/icon/Informational.vue'
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue';
import IconHourglass from '~/components/icon/Hourglass.vue';
import IconCancel from '~/components/icon/Cancel.vue';
import Clock from '~/components/icon/Clock.vue'

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

const { totalCount: lastBlockHeight, fetchTotalCount } = useBlocks();

const {
  transaction,
  loading,
  error,
  fetchTransaction,
  primaryTransfer,
  transactionFee,
  blockConfirmations,
  kadenaPrice,
  signerTransferValue,
  transactionSigners,
} = useTransaction(transactionId, networkId)

// Text content for tooltips and labels
const textContent = {
  transactionHash: { label: 'Transaction Hash:', description: 'Transaction hash is a unique 43-character or 58-character(coinbase) identifier that is generated whenever a transaction is executed.' },
  status: { label: 'Status:', description: 'The status of the transaction.' },
  block: { label: 'Block:', description: 'Number of the block height in which the transaction is recorded. Block confirmations indicate how many blocks have been added since the transaction was produced.' },
  chainId: { label: 'Chain ID:', description: 'The specific chain (0-19) on which this block was mined' },
  timestamp: { label: 'Timestamp:', description: 'Date and time at which a transaction is produced.' },
  signers: { label: 'Signers:', description: 'Accounts that authorized this transaction.' },
  paidBy: { label: 'Paid By:', description: 'The account that submitted and paid the gas fees for this transaction.' },
  value: { label: 'Value:', description: 'Total KDA transferred out of the signer account due to this transaction.' },
  transactionFee: { label: 'Transaction Fee:', description: 'Amount paid to process this transaction in KDA.' },
  gasPrice: { label: 'Gas Price:', description: 'Cost per unit of gas spent for this transaction.' },
  kadenaPrice: { label: 'Kadena Price:', description: 'Price of KDA on the day this transaction was created.' },
  otherAttributes: { label: 'Other Attributes:', description: 'Other data related to this transaction.' },
  moreDetails: { label: 'More Details:' },
}

// Tab management
const tabLabels = ['Overview', 'Logs (1)']
const activeTab = ref(tabLabels[0])

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
  if (!rawCode) return 'No code available'
  
  if (codeView.value === 'raw') {
    return unescapeCodeString(rawCode)
  } else if (codeView.value === 'default') {
    return parsePactCode(unescapeCodeString(rawCode))
  } else if (codeView.value === 'data') {
    return formatJsonPretty(transaction.value?.cmd?.payload?.data)
  } else if (codeView.value === 'signatures') {
    return formatSignatures(transaction.value?.sigs)
  }
})

const transactionStatus = computed(() => {
  if((lastBlockHeight.value - 10 >= transaction.value?.result?.block?.height && !transaction.value?.result?.block?.canonical) || transaction.value?.result?.badResult !== null) {
    return {
      text: 'Failed',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
      description: 'Transaction failed to execute',
    };
  }

  if(transaction.value?.result?.block?.canonical) {
    return {
      text: 'Success',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
      description: 'Transaction executed successfully',
    };
  }

  return {
    text: 'Pending',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#44464980] text-[#989898]',
    description: 'Transaction is pending to be finalized',
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

const method = computed(() => {
  // Extract method from the transaction code or use a default
  if (transaction.value?.cmd?.payload?.code?.includes?.('close-send-receive')) {
    return 'Close Send Receive'
  }
  return 'Transfer'
})

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

// Helper function to conditionally truncate only hash-format addresses
const smartTruncateAddress = (address: string) => {
  if (!address) return address
  
  // Check if it's a long hash format address (k: followed by a long hex string)
  const isHashFormat = address.startsWith('k:') || address.length > 20
  
  if (isHashFormat) {
    return truncateAddress(address, 10, 10)
  }
  
  // Return as-is for short/human-readable addresses
  return address
}

// Fetch transaction data
watch([transactionId, networkId], () => {
  if (transactionId.value && networkId.value) {
    fetchTransaction()
  }
}, { immediate: true })

watch(
  networkId,
  (newNetworkId) => {
    if (newNetworkId) {
      fetchTotalCount({ networkId: newNetworkId });
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (transactionId.value && networkId.value) {
    fetchTransaction()
  }
})

onUnmounted(() => {
  // Clean up event listeners
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-[#fafafa]">Loading transaction...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex items-center justify-center py-20">
      <div class="text-red-400">Error loading transaction: {{ error.message }}</div>
    </div>

    <!-- Transaction content -->
    <div v-else-if="transaction">
      <!-- Header -->
      <div class="flex items-center pb-5 border-b border-[#222222] mb-6 gap-2">
        <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
          Transaction Details
        </h1>
      </div>

      <!-- Tabs -->
      <div class="flex items-center justify-between pb-3">
        <div class="flex gap-2">
          <button
            v-for="label in tabLabels"
            :key="label"
            :class="[
              'px-[10px] py-[5px] text-[13px] rounded-lg border font-medium transition-colors',
              activeTab === label
                ? 'bg-[#009367] border-[#222222] text-[#f5f5f5]'
                : 'bg-transparent border-[#222222] text-[#bbbbbb] hover:bg-[#222222]'
            ]"
            @click="activeTab = label"
          >
            {{ label.replace('(1)', `(${eventsCount})`) }}
          </button>
        </div>
      </div>

      <!-- Logs Tab Content -->
      <div v-if="activeTab.startsWith('Logs')" class="mb-6">
        <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5">
          <div v-if="transaction?.result?.events?.edges?.length">
            <Divide>
              <DivideItem>
                <div class="flex flex-col gap-6">
                  <div 
                    v-for="(eventEdge, index) in transaction.result.events.edges" 
                    :key="eventEdge.node.id"
                    class="flex flex-col gap-4"
                  >
                    <LabelValue
                      :label="`Event #${index}:`"
                      :description="`${eventEdge.node.qualifiedName} event details`"
                      tooltipPos="right"
                    >
                      <template #value>
                        <div class="flex flex-col gap-3">
                          <div class="flex items-center gap-4 text-[15px]">
                            <div class="flex items-center gap-2">
                              <span class="text-[#bbbbbb]">Module:</span>
                              <span class="text-[#fafafa]">{{ eventEdge.node.moduleName }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-[#bbbbbb]">Event:</span>
                              <span class="text-[#fafafa]">{{ eventEdge.node.name }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-[#bbbbbb]">Order:</span>
                              <span class="text-[#fafafa]">{{ eventEdge.node.orderIndex }}</span>
                            </div>
                          </div>
                          
                          <div>
                            <span class="text-[#bbbbbb] text-sm">Parameters:</span>
                            <div class="mt-1 p-3 bg-[#1a1a1a] rounded border border-[#bbbbbb] text-xs text-[#fafafa] break-all">
                              {{ eventEdge.node.parameterText }}
                            </div>
                          </div>
                        </div>
                      </template>
                    </LabelValue>
                    
                    <!-- Divider between events (except last one) -->
                    <div v-if="index < transaction.result.events.edges.length - 1" class="border-b border-[#bbbbbb]"></div>
                  </div>
                </div>
              </DivideItem>
            </Divide>
          </div>
          <div v-else class="text-center py-8 text-[#bbbbbb]">
            No events found for this transaction
          </div>
        </div>
      </div>

      <!-- Transaction Details -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
        <Divide>
          <!-- Section 1: Basic Information -->
          <DivideItem>
            <div class="flex flex-col gap-4">
              <LabelValue  :label="textContent.transactionHash.label" :description="textContent.transactionHash.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <span class="text-[#fafafa] break-all text-[15px]">{{ displayHash }}</span>
                    <Copy 
                      :value="transaction.hash" 
                      tooltipText="Copy Transaction Hash"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
                    />
                  </div>
                </template>
              </LabelValue>
              <LabelValue :row="isMobile" :label="textContent.status.label" :description="textContent.status.description" tooltipPos="right">
                <template #value>
                  <div :class="['flex items-center px-2 py-1 rounded-lg border text-xs w-fit gap-2', transactionStatus.classes]">
                    <component :is="transactionStatus.icon" class="w-3 h-3" />
                    {{ transactionStatus.text }}
                  </div>
                </template>
              </LabelValue>
              <LabelValue :row="isMobile" :label="textContent.block.label" :description="textContent.block.description" tooltipPos="right">
               <template #value>
                 <div class="flex items-center gap-2">
                   <IconHourglass v-if="transactionStatus.text === 'Pending'" class="w-3 h-3 text-[#bbbbbb]" />
                   <NuxtLink v-if="transaction?.result?.block?.height" :to="`/blocks/${transaction.result.block.height}/chain/${transaction.result.block.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ transaction.result.block.height }}</NuxtLink>
                   <span v-else-if="!transaction?.result?.block?.height && transaction?.cmd?.meta?.chainId && (transaction?.cmd?.meta?.creationTime === 0 || new Date(transaction?.cmd?.meta?.creationTime).getTime() < new Date('1970-01-02').getTime())" class="text-[#fafafa]">Genesis</span>
                   <span v-else class="text-[#fafafa]">-</span>
                   <span v-if="blockConfirmations !== null" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] text-[#fafafa] font-semibold flex items-center leading-none">
                    {{ blockConfirmations }} Block Confirmations
                   </span>
                 </div>
               </template>
             </LabelValue>
            <LabelValue :row="isMobile" :label="textContent.chainId.label" :description="textContent.chainId.description" tooltipPos="right">
              <template #value>
                <span class="text-[#fafafa] text-[15px]">
                  {{ displayChainId }}
                </span>
              </template>
            </LabelValue>
             <LabelValue :row="isMobile" :label="textContent.timestamp.label" :description="textContent.timestamp.description" tooltipPos="right">
               <template #value>
                 <div class="flex items-center gap-2">
                   <!-- Show just "Genesis" for Genesis transactions without clock icon -->
                   <template v-if="!transaction?.result?.block?.height && transaction?.cmd?.meta?.chainId && (transaction?.cmd?.meta?.creationTime === 0 || new Date(transaction?.cmd?.meta?.creationTime).getTime() < new Date('1970-01-02').getTime())">
                     <span class="text-[#fafafa] text-[15px]">Genesis</span>
                   </template>
                   <!-- Normal timestamp display with clock icon -->
                   <template v-else>
                     <Clock class="w-4 h-4 text-[#bbbbbb]" />
                     <span v-if="age && transaction?.cmd?.meta?.creationTime" class="text-[#fafafa] text-[15px]">{{ age }} ({{ new Date(transaction.cmd.meta.creationTime).toUTCString() }})</span>
                     <span v-else class="text-[#fafafa] text-[15px]">-</span>
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
                :row="isMobile" 
                :label="transactionSigners.length === 1 ? 'Signer:' : textContent.signers.label" 
                :description="transactionSigners.length === 1 ? 'Account that authorized this transaction.' : textContent.signers.description" 
                tooltipPos="right"
              >
                <template #value>
                  <div class="flex flex-col gap-2">
                    <div 
                      v-for="signer in transactionSigners" 
                      :key="signer.pubkey"
                      class="flex items-center gap-2"
                    >
                      <NuxtLink :to="`/account/${signer.address}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ signer.address }}</NuxtLink>
                      <Copy 
                        :value="signer.address" 
                        tooltipText="Copy Signer Address"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5"
                      />
                    </div>
                  </div>
                </template>
              </LabelValue>
              <LabelValue v-if="feePayer" :row="isMobile" :label="textContent.paidBy.label" :description="textContent.paidBy.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <NuxtLink :to="`/account/${feePayer}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ feePayer }}</NuxtLink>
                    <Copy 
                      :value="feePayer" 
                      tooltipText="Copy Fee Payer Address"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
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
              label="Token Transfers:"
              description="Individual token transfers within this transaction"
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
                    <span class="text-[#fafafa] font-medium">From</span>
                    <NuxtLink 
                      :to="`/account/${transferEdge.node.senderAccount}`" 
                      class="text-[#6ab5db] hover:text-[#9ccee7]"
                    >{{ smartTruncateAddress(transferEdge.node.senderAccount) }}</NuxtLink>
                    <Copy 
                      :value="transferEdge.node.senderAccount" 
                      tooltipText="Copy sender address"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5 hover:opacity-100"
                    />
                    
                    <!-- To Address -->
                    <span class="text-[#fafafa] font-medium">To</span>
                    <NuxtLink 
                      :to="`/account/${transferEdge.node.receiverAccount}`" 
                      class="text-[#6ab5db] hover:text-[#9ccee7]"
                    >{{ smartTruncateAddress(transferEdge.node.receiverAccount) }}</NuxtLink>
                    <Copy 
                      :value="transferEdge.node.receiverAccount" 
                      tooltipText="Copy receiver address"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5 hover:opacity-100"
                    />
                    
                    <!-- Amount and Token Info -->
                    <span class="text-[#fafafa] font-medium">For</span>
                    <span class="text-[#fafafa]">{{ transferEdge.node.amount }}</span>
                    
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
                      <span class="text-[#fafafa] font-medium">
                        {{ getTokenMetadata(transferEdge.node.moduleName).symbol }}
                      </span>
                      
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
                    <span class="text-[#fafafa]">{{ signerTransferValue }} KDA</span>
                    <span v-if="signerTransferValue > 0" class="text-[#bbbbbb]">(${{ calculateKdaUsdValue(signerTransferValue, true) }})</span>
                  </div>
                </template>
              </LabelValue>
              
              <LabelValue :row="isMobile" :label="textContent.transactionFee.label" :description="textContent.transactionFee.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <span class="text-[#fafafa]">{{ transactionFee }} KDA</span>
                    <span v-if="transactionFee > 0" class="text-[#bbbbbb]">(${{ calculateKdaUsdValue(transactionFee, true) }})</span>
                  </div>
                </template>
              </LabelValue>
              
              <LabelValue :row="isMobile" :label="textContent.gasPrice.label" :description="textContent.gasPrice.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <span class="text-[#fafafa]">{{ transaction?.cmd?.meta?.gasPrice || '-' }}</span>
                  </div>
                </template>
              </LabelValue>
            </div>
          </DivideItem>
        </Divide>
      </div>

      <!-- More Details Section -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-5 mb-2">
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
                        <span class="text-[#fafafa]">{{ formattedKadenaPrice || '-' }}</span>
                      </div>
                    </template>
                  </LabelValue>
                  <LabelValue
                     label="Gas Limit & Usage by Txn:"
                     description="Maximum amount of gas allocated for the transaction & the amount eventually used."
                     tooltipPos="right"
                  >
                    <template #value>
                      <div class="flex items-center gap-2">
                        <span class="text-[#fafafa]">{{ formattedGasInfo }}</span>
                      </div>
                    </template>
                  </LabelValue>
                </div>
              </DivideItem>

              <!-- Transaction Details -->
              <DivideItem>
                <div class="flex flex-col gap-4">
                  <LabelValue 
                    :row="isMobile"
                    :label="textContent.otherAttributes.label" 
                    :description="textContent.otherAttributes.description"
                    tooltipPos="right"
                  >
                    <template #value>
                      <div class="flex flex-wrap gap-2">
                        <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                          <span class="text-[#bbbbbb]">TTL:</span>
                          <span class="text-[#fafafa] ml-1">{{ transaction?.cmd?.meta?.ttl || '-' }}</span>
                        </span>
                        <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                          <span class="text-[#bbbbbb]">Nonce:</span>
                          <span class="text-[#fafafa] ml-1">{{ transaction?.cmd?.nonce || '0' }}</span>
                        </span>
                        <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                          <span class="text-[#bbbbbb]">TXID:</span>
                          <span class="text-[#fafafa] ml-1">{{ transaction?.result?.transactionId || '0' }}</span>
                        </span>
                      </div>
                    </template>
                  </LabelValue>
                  <!-- Custom Code Section with Full Width -->
                  <div class="flex flex-col md:flex-row items-start">
                    <!-- Label Section (matching LabelValue styling) -->
                    <div class="flex gap-2 w-full min-w-[300px] max-w-[300px]">
                      <div class="flex items-center gap-2">
                        <Tooltip
                          value="Smart contract code executed"
                          placement="right"
                          :offset-distance="16"
                        >
                          <Informational class="w-4 h-4" />
                        </Tooltip>
                        <span class="text-[#bbbbbb] text-[15px] font-normal">
                          Input Data:
                        </span>
                      </div>
                    </div>
                    
                    <!-- Code Container with proper boundaries -->
                    <div class="text-[#f5f5f5] text-[15px] fix flex gap-2 flex-1 overflow-hidden">
                      <div v-if="transaction?.cmd?.payload?.code" class="w-full">
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
                                  ? 'text-[#fafafa] cursor-default' 
                                  : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dee2e6] hover:text-[#000000]'
                              ]"
                            >
                              Default View
                            </button>
                            <button 
                              @click="codeView = 'raw'"
                              :class="[
                                'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                codeView === 'raw' 
                                  ? 'text-[#fafafa] cursor-default' 
                                  : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dee2e6] hover:text-[#000000]'
                              ]"
                            >
                              Original
                            </button>
                            <button 
                              @click="codeView = 'data'"
                              :class="[
                                'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                codeView === 'data' 
                                  ? 'text-[#fafafa] cursor-default' 
                                  : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dee2e6] hover:text-[#000000]'
                              ]"
                            >
                              Data
                            </button>
                            <button 
                              @click="codeView = 'signatures'"
                              :class="[
                                'px-3 py-1.5 text-xs rounded-md transition-colors bg-[#222222]',
                                codeView === 'signatures' 
                                  ? 'text-[#fafafa] cursor-default' 
                                  : 'bg-[#222222] text-[#bbbbbb] hover:bg-[#dee2e6] hover:text-[#000000]'
                              ]"
                            >
                              Signatures
                            </button>
                          </div>
                        </div>
                      </div>
                      <span v-else class="text-[#fafafa] text-xs">No code available</span>
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
    </div>

    <!-- No transaction found -->
    <div v-else class="flex items-center justify-center py-20">
      <div class="text-[#bbbbbb]">Transaction not found</div>
    </div>
  </div>
</template>
