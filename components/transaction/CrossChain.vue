<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatJsonPretty } from '~/composables/string'
import { useScreenSize } from '~/composables/useScreenSize'
import { useFormat } from '~/composables/useFormat'
import Informational from '~/components/icon/Informational.vue'
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue'
import IconCancel from '~/components/icon/Cancel.vue'
import IconHourglass from '~/components/icon/Hourglass.vue'

const props = defineProps<{
  transaction: any
}>()

const { isMobile } = useScreenSize()
const { formatRelativeTime } = useFormat()

// Find cross-chain transfers from the current transaction
const crossChainTransfers = computed(() => {
  if (!props.transaction?.result?.transfers?.edges) return []
  
  return props.transaction.result.transfers.edges
    .filter((edge: any) => edge.node.crossChainTransfer !== null)
    .map((edge: any) => ({
      ...edge.node,
      currentChainId: props.transaction.cmd.meta.chainId,
      destinationChainId: edge.node.crossChainTransfer.block.chainId,
      destinationRequestKey: edge.node.crossChainTransfer.requestKey,
      destinationCreationTime: edge.node.crossChainTransfer.creationTime,
      isDestinationSuccessful: edge.node.crossChainTransfer.transaction?.result?.badResult === null
    }))
})

// Related transaction data (destination transaction)
const relatedTransaction = ref<any>(null)
const loadingRelated = ref(false)

// Function to fetch related transaction
const fetchRelatedTransaction = async (requestKey: string, networkId: string) => {
  if (!requestKey || !networkId) return
  
  loadingRelated.value = true
  try {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: `
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
        `,
        variables: {
          requestKey: requestKey
        },
        networkId: networkId
      }
    })
    
    relatedTransaction.value = response?.data?.transaction
  } catch (error) {
    console.error('Error fetching related transaction:', error)
    relatedTransaction.value = null
  } finally {
    loadingRelated.value = false
  }
}

// Watch for cross-chain transfers and fetch related transaction
watch(crossChainTransfers, async (transfers) => {
  if (transfers.length > 0 && transfers[0].destinationRequestKey) {
    const networkId = props.transaction.cmd.networkId
    await fetchRelatedTransaction(transfers[0].destinationRequestKey, networkId)
  }
}, { immediate: true })

// Determine if current transaction is source or destination
const isSourceTransaction = computed(() => {
  // If we have a continuation payload, this is likely the destination
  return props.transaction.cmd.payload?.step === undefined
})

// Add computed properties to correctly extract sender and receiver accounts
const actualSender = computed(() => {
  if (crossChainTransfers.value.length === 0) return ''
  
  const transfer = crossChainTransfers.value[0]
  
  // For source transaction (step0): sender is in transfer.senderAccount
  // For destination transaction (step1): sender is in transfer.crossChainTransfer.senderAccount
  if (isSourceTransaction.value) {
    // This is the source transaction, sender is in senderAccount
    return transfer.senderAccount || transfer.crossChainTransfer?.senderAccount || ''
  } else {
    // This is the destination transaction, sender is in crossChainTransfer.senderAccount
    return transfer.crossChainTransfer?.senderAccount || transfer.senderAccount || ''
  }
})

const actualReceiver = computed(() => {
  if (crossChainTransfers.value.length === 0) return ''
  
  const transfer = crossChainTransfers.value[0]
  
  // For source transaction (step0): receiver is in transfer.crossChainTransfer.receiverAccount
  // For destination transaction (step1): receiver is in transfer.receiverAccount
  if (isSourceTransaction.value) {
    // This is the source transaction, receiver is in crossChainTransfer.receiverAccount
    return transfer.crossChainTransfer?.receiverAccount || transfer.receiverAccount || ''
  } else {
    // This is the destination transaction, receiver is in receiverAccount
    return transfer.receiverAccount || transfer.crossChainTransfer?.receiverAccount || ''
  }
})

const getTransactionStatus = (transaction: any) => {
  if (!transaction?.result) {
    return {
      text: 'Pending',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#44464980] text-[#989898]'
    }
  }
  
  if (transaction.result.badResult !== null) {
    return {
      text: 'Failed',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]'
    }
  }
  
  if (transaction.result.block?.canonical) {
    return {
      text: 'Success',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]'
    }
  }
  
  return {
    text: 'Pending',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#44464980] text-[#989898]'
  }
}

const sourceTransaction = computed(() => isSourceTransaction.value ? props.transaction : relatedTransaction.value)
const destinationTransaction = computed(() => isSourceTransaction.value ? relatedTransaction.value : props.transaction)

// Unified cross-chain status with priority logic: Failed > Pending > Success
const crossChainStatus = computed(() => {
  const sourceStatus = getTransactionStatus(sourceTransaction.value)
  const destinationStatus = getTransactionStatus(destinationTransaction.value)
  
  // Failed has highest priority
  if (sourceStatus.text === 'Failed' || destinationStatus.text === 'Failed') {
    return {
      text: 'Failed',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]'
    }
  }
  
  // Pending has second priority
  if (sourceStatus.text === 'Pending' || destinationStatus.text === 'Pending') {
    return {
      text: 'Pending',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#44464980] text-[#989898]'
    }
  }
  
  // Success only when both are successful
  if (sourceStatus.text === 'Success' && destinationStatus.text === 'Success') {
    return {
      text: 'Success',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]'
    }
  }
  
  // Default to pending if we can't determine
  return {
    text: 'Pending',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#44464980] text-[#989898]'
  }
})

const formatContinuationData = (continuation: string) => {
  try {
    const parsed = JSON.parse(continuation)
    return formatJsonPretty(JSON.stringify(parsed, null, 2))
  } catch {
    return continuation
  }
}
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
    <div v-if="crossChainTransfers.length > 0">
      <Divide>
        <!-- Cross Chain Transfer Overview -->
        <DivideItem>
          <div class="flex flex-col gap-4">
            <LabelValue
              :row="isMobile"
              label="Cross Chain Status:"
              description="Overall status of the cross-chain transfer process"
              tooltipPos="right"
            >
              <template #value>
                <div :class="['flex items-center px-2 py-1 rounded-lg border text-xs w-fit gap-2', crossChainStatus.classes]">
                  <component :is="crossChainStatus.icon" class="w-3 h-3" />
                  {{ crossChainStatus.text }}
                </div>
              </template>
            </LabelValue>

            <!-- Transfer Flow Visualization -->
            <div class="flex flex-col md:flex-row items-start">
              <div class="flex gap-2 w-full min-w-[300px] max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    value="Visual representation of the cross-chain transfer process"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px] font-normal">
                    Transfer Flow:
                  </span>
                </div>
              </div>
              
              <div class="text-[#f5f5f5] text-[15px] flex gap-2 flex-1 overflow-hidden">
                <div class="w-full">
                  <div class="flex items-center gap-4 p-4 bg-[#151515] border border-[#222222] rounded-lg">
                    <!-- Source Chain -->
                    <div class="flex flex-col items-center gap-2 flex-1">
                      <div class="text-sm text-[#bbbbbb]">Source Chain</div>
                      <div class="px-3 py-2 bg-[#009367] rounded-lg text-white font-medium">
                        Chain {{ crossChainTransfers[0].currentChainId }}
                      </div>
                      <div class="text-xs text-[#bbbbbb] break-all">
                        {{ actualSender }}
                      </div>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="flex flex-col items-center gap-1">
                      <svg class="w-8 h-8 text-[#00a186]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div class="text-xs text-[#bbbbbb]">{{ crossChainTransfers[0].amount }} KDA</div>
                    </div>
                    
                    <!-- Destination Chain -->
                    <div class="flex flex-col items-center gap-2 flex-1">
                      <div class="text-sm text-[#bbbbbb]">Destination Chain</div>
                      <div class="px-3 py-2 bg-[#6ab5db] rounded-lg text-white font-medium">
                        Chain {{ crossChainTransfers[0].destinationChainId }}
                      </div>
                      <div class="text-xs text-[#bbbbbb] break-all">
                        {{ actualReceiver }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DivideItem>

        <!-- Source Transaction Details -->
        <DivideItem v-if="sourceTransaction">
          <div class="flex flex-col gap-4">
            <LabelValue
              :row="isMobile"
              label="Source Transaction:"
              description="The initial transaction that initiated the cross-chain transfer"
              tooltipPos="right"
              :topAlign="true"
            >
              <template #value>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-[#bbbbbb]">Request Key:</span>
                    <NuxtLink 
                      :to="`/transactions/${sourceTransaction.hash}`" 
                      class="text-[#6ab5db] hover:text-[#9ccee7] break-all"
                    >
                      {{ sourceTransaction.hash }}
                    </NuxtLink>
                    <Copy 
                      :value="sourceTransaction.hash" 
                      tooltipText="Copy Source Request Key"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
                    />
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="text-[#bbbbbb]">From:</span>
                    <NuxtLink 
                      :to="`/account/${actualSender}`" 
                      class="text-[#6ab5db] hover:text-[#9ccee7] break-all"
                    >
                      {{ actualSender }}
                    </NuxtLink>
                    <Copy 
                      :value="actualSender" 
                      tooltipText="Copy From Address"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
                    />
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-4">
                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Chain:</span>
                      <span class="text-[#fafafa] ml-1">{{ sourceTransaction.cmd.meta.chainId }}</span>
                    </span>

                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Block:</span>
                      <span class="text-[#fafafa] ml-1">{{ sourceTransaction.result.block.height }}</span>
                    </span>

                    <span v-if="sourceTransaction.cmd.meta.creationTime" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Time:</span>
                      <span class="text-[#fafafa] ml-1">{{ formatRelativeTime(sourceTransaction.cmd.meta.creationTime) }} ({{ new Date(sourceTransaction.cmd.meta.creationTime).toUTCString() }})</span>
                    </span>               
                  </div>
                </div>
              </template>
            </LabelValue>
          </div>
        </DivideItem>

        <!-- Destination Transaction Details -->
        <DivideItem v-if="destinationTransaction">
          <div class="flex flex-col gap-4">
            <LabelValue
              :row="isMobile"
              label="Destination Transaction:"
              description="The completion transaction on the destination chain"
              tooltipPos="right"
              :topAlign="true"
            >
              <template #value>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-[#bbbbbb]">Request Key:</span>
                    <NuxtLink 
                      :to="`/transactions/${destinationTransaction.hash}`" 
                      class="text-[#6ab5db] hover:text-[#9ccee7] break-all"
                    >
                      {{ destinationTransaction.hash }}
                    </NuxtLink>
                    <Copy 
                      :value="destinationTransaction.hash" 
                      tooltipText="Copy Destination Request Key"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
                    />
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="text-[#bbbbbb]">To:</span>
                    <NuxtLink 
                      :to="`/account/${actualReceiver}`" 
                      class="text-[#6ab5db] hover:text-[#9ccee7] break-all"
                    >
                      {{ actualReceiver }}
                    </NuxtLink>
                    <Copy 
                      :value="actualReceiver" 
                      tooltipText="Copy To Address"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
                    />
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-4">
                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Chain:</span>
                      <span class="text-[#fafafa] ml-1">{{ destinationTransaction.cmd.meta.chainId }}</span>
                    </span>

                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Block:</span>
                      <span class="text-[#fafafa] ml-1">{{ destinationTransaction.result.block.height }}</span>
                    </span>
                    
                    <span v-if="destinationTransaction.cmd.meta.creationTime" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Time:</span>
                      <span class="text-[#fafafa] ml-1">{{ formatRelativeTime(destinationTransaction.cmd.meta.creationTime) }} ({{ new Date(destinationTransaction.cmd.meta.creationTime).toUTCString() }})</span>
                    </span>
                  </div>
                </div>
              </template>
            </LabelValue>
          </div>
        </DivideItem>

        <!-- Continuation Payload (only for destination transaction) -->
        <DivideItem v-if="destinationTransaction?.cmd?.payload?.pactId">
          <div class="flex flex-col gap-4">
            <LabelValue
              :row="isMobile"
              label="Pact ID:"
              description="Unique identifier linking the source and destination transactions"
              tooltipPos="right"
            >
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="text-[#fafafa] text-[15px] break-all">{{ destinationTransaction.cmd.payload.pactId }}</span>
                </div>
              </template>
            </LabelValue>

            <LabelValue
              :row="isMobile"
              label="Step:"
              description="Current step in the multi-step cross-chain process"
              tooltipPos="right"
            >
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Step:</span>
                    <span class="text-[#fafafa] ml-1">{{ destinationTransaction.cmd.payload.step }}</span>
                  </span>
                  <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Rollback:</span>
                    <span class="text-[#fafafa] ml-1">{{ destinationTransaction.cmd.payload.rollback ? 'Yes' : 'No' }}</span>
                  </span>
                </div>
              </template>
            </LabelValue>

            <!-- Continuation Data -->
            <div v-if="destinationTransaction.result?.continuation" class="flex flex-col md:flex-row items-start">
              <div class="flex gap-2 w-full min-w-[300px] max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    value="Continuation data from the cross-chain process"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px] font-normal">
                    Continuation Data:
                  </span>
                </div>
              </div>
              
              <div class="text-[#f5f5f5] text-[15px] fix flex gap-2 flex-1 overflow-hidden">
                <div class="w-full">
                  <textarea
                    readonly
                    :value="formatContinuationData(destinationTransaction.result.continuation)"
                    class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[150px]"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Proof Data -->
            <div v-if="destinationTransaction.cmd.payload.proof" class="flex flex-col md:flex-row items-start">
              <div class="flex gap-2 w-full min-w-[300px] max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    value="Cryptographic proof for the cross-chain transfer"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px] font-normal">
                    Proof:
                  </span>
                </div>
              </div>
              
              <div class="text-[#f5f5f5] text-[15px] fix flex gap-2 flex-1 overflow-hidden">
                <div class="w-full">
                  <textarea
                    readonly
                    :value="destinationTransaction.cmd.payload.proof"
                    class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[100px]"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Payload Data -->
            <div v-if="destinationTransaction.cmd.payload.data" class="flex flex-col md:flex-row items-start">
              <div class="flex gap-2 w-full min-w-[300px] max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    value="Payload data for the destination transaction"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px] font-normal">
                    Payload Data:
                  </span>
                </div>
              </div>
              
              <div class="text-[#f5f5f5] text-[15px] fix flex gap-2 flex-1 overflow-hidden">
                <div class="w-full">
                  <textarea
                    readonly
                    :value="formatJsonPretty(destinationTransaction.cmd.payload.data)"
                    class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[100px]"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </DivideItem>
      </Divide>
    </div>
    
    <div v-else-if="loadingRelated" class="text-center py-8 text-[#bbbbbb]">
      Loading related transaction data...
    </div>
    
    <div v-else class="text-center py-8 text-[#bbbbbb]">
      No cross-chain transfer data found for this transaction
    </div>
  </div>
</template>

<style>
.fix {
  overflow-wrap: anywhere
}
</style> 