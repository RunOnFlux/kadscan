<script setup lang="ts">
import { computed } from 'vue'
import { formatJsonPretty } from '~/composables/useString'
import { useScreenSize } from '~/composables/useScreenSize'
import { useFormat } from '~/composables/useFormat'
import Informational from '~/components/icon/Informational.vue'
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue'
import IconCancel from '~/components/icon/Cancel.vue'
import IconHourglass from '~/components/icon/Hourglass.vue'

const props = defineProps<{
  transaction: any
  crossChainTransaction: any
  crossChainTransfers: any[]
  isSourceTransaction: boolean
  loadingCrossChain: boolean
  isCrossChain?: boolean
}>()

const { isMobile } = useScreenSize()
const { formatRelativeTime } = useFormat()

// Locate a likely pending cross-chain transfer edge from the current transaction
const pendingTransferEdge = computed(() => {
  const edges = props.transaction?.result?.transfers?.edges || []
  // Prefer coin transfer with a missing sender or receiver
  const edge = edges.find((e: any) => {
    const n = e?.node
    if (!n) return false
    const hasBlank = !n.senderAccount || n.senderAccount === '' || !n.receiverAccount || n.receiverAccount === ''
    return hasBlank
  })
  return edge?.node || null
})

// Extract source/destination chain ids and amount with fallbacks for pending state
const sourceChainId = computed(() => {
  if (props.crossChainTransfers.length > 0) {
    return props.crossChainTransfers[0].sourceChainId
  }
  return props.transaction?.cmd?.meta?.chainId ?? '-'
})

const destinationChainId = computed(() => {
  if (props.crossChainTransfers.length > 0) {
    return props.crossChainTransfers[0].destinationChainId
  }
  return null
})

const transferAmount = computed(() => {
  if (props.crossChainTransfers.length > 0) {
    return props.crossChainTransfers[0].amount
  }
  return pendingTransferEdge.value?.amount || null
})

// Add computed properties to correctly extract sender and receiver accounts with pending fallbacks
const actualSender = computed(() => {
  if (props.crossChainTransfers.length === 0) {
    return pendingTransferEdge.value?.senderAccount || ''
  }
  
  const transfer = props.crossChainTransfers[0]
  if (props.isSourceTransaction) {
    return transfer.senderAccount || transfer.crossChainTransfer?.senderAccount || ''
  } else {
    return transfer.crossChainTransfer?.senderAccount || transfer.senderAccount || ''
  }
})

const actualReceiver = computed(() => {
  if (props.crossChainTransfers.length === 0) {
    return pendingTransferEdge.value?.receiverAccount || ''
  }
  const transfer = props.crossChainTransfers[0]
  if (props.isSourceTransaction) {
    return transfer.crossChainTransfer?.receiverAccount || transfer.receiverAccount || ''
  } else {
    return transfer.receiverAccount || transfer.crossChainTransfer?.receiverAccount || ''
  }
})

const getTransactionStatus = (transaction: any) => {
  if (!transaction?.result) {
    return {
      text: 'Pending',
      icon: IconHourglass,
      classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]'
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
    classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]'
  }
}

const sourceTransaction = computed(() => props.isSourceTransaction ? props.transaction : props.crossChainTransaction)
const destinationTransaction = computed(() => props.isSourceTransaction ? props.crossChainTransaction : props.transaction)

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
      classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]'
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
    classes: 'bg-[#17150d] border-[#444648] text-[#bbbbbb]'
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

// Status-based indicator colors
const sourceIndicatorColor = computed(() => {
  const status = getTransactionStatus(sourceTransaction.value).text
  if (status === 'Success') return '#00a186'  // Green for success
  if (status === 'Failed') return '#f87171'   // Red for failed  
  return '#fbbf24' // Yellow/amber for pending
})

const destinationIndicatorColor = computed(() => {
  const status = getTransactionStatus(destinationTransaction.value).text
  if (status === 'Success') return '#00a186'  // Green for success
  if (status === 'Failed') return '#f87171'   // Red for failed
  return '#bbbbbb' // Gray for pending (destination not reached yet)
})

// Flow dots color: red if any leg failed, green if both succeeded, else yellow
const flowDotsColor = computed(() => {
  const sourceStatus = getTransactionStatus(sourceTransaction.value).text
  const destStatus = getTransactionStatus(destinationTransaction.value).text
  if (sourceStatus === 'Failed' || destStatus === 'Failed') return '#f87171'
  if (sourceStatus === 'Success' && destStatus === 'Success') return '#00a186'
  return '#fbbf24'
})

// Metadata source should reflect the side we are currently viewing
// - If current page is the source tx: use source transaction data
// - If current page is the destination tx: prefer destination (related) tx, fallback to current
const metadataSource = computed(() => {
  if (props.isSourceTransaction) {
    return sourceTransaction.value
  }
  return destinationTransaction.value || props.transaction
})

const metadataPactId = computed(() => {
  const payloadPactId = metadataSource.value?.cmd?.payload?.pactId
  if (payloadPactId) return payloadPactId
  // Try parse from continuation JSON
  const cont = metadataSource.value?.result?.continuation
  if (!cont) return null
  try {
    const parsed = JSON.parse(cont)
    return parsed?.pactId || null
  } catch {
    return null
  }
})

const metadataStep = computed(() => {
  const payloadStep = metadataSource.value?.cmd?.payload?.step
  if (payloadStep !== undefined && payloadStep !== null) return payloadStep
  const cont = metadataSource.value?.result?.continuation
  if (!cont) return null
  try {
    const parsed = JSON.parse(cont)
    return parsed?.step ?? null
  } catch {
    return null
  }
})

const metadataRollback = computed(() => {
  const payloadRollback = metadataSource.value?.cmd?.payload?.rollback
  if (payloadRollback !== undefined && payloadRollback !== null) return payloadRollback
  const cont = metadataSource.value?.result?.continuation
  if (!cont) return null
  try {
    const parsed = JSON.parse(cont)
    return parsed?.stepHasRollback ?? null
  } catch {
    return null
  }
})


</script>

<template>
  <div class="bg-surface-primary border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
    <div v-if="props.crossChainTransfers.length > 0 || props.isCrossChain">
      <Divide>
        <!-- Cross Chain Transfer Overview -->
        <DivideItem>
          <div class="flex flex-col lg:gap-4">
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
              <div class="lg:block hidden flex gap-2 w-full min-w-[300px] max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    value="Visual representation of the cross-chain transfer process"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4 text-[#6366f1]" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px]">
                    Transfer Flow:
                  </span>
                </div>
              </div>
              
              <div class="lg:block hidden text-[#f5f5f5] text-[15px] flex gap-2 flex-1 overflow-hidden">
                <div class="w-full">
                  <!-- Modern Cross-Chain Flow Container -->
                  <div class="relative p-6 bg-gradient-to-br from-surface-primary via-[#222222] to-surface-primary border border-[#333333] rounded-2xl shadow-2xl backdrop-blur-sm">
                    <!-- Animated Background Elements -->
                    <div class="absolute inset-0 bg-gradient-to-r from-[#00a186]/5 via-transparent to-[#00a186]/5 rounded-2xl"></div>
                    
                    <div class="relative flex items-center justify-between gap-8">
                      <!-- Source Chain Card -->
                      <div class="flex-1 group">
                        <div class="relative">
                          <!-- Glow Effect -->
                          <div class="absolute -inset-1 bg-gradient-to-r from-[#00a186]/20 to-[#00a186]/10 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                          
                          <!-- Main Card -->
                          <div class="relative bg-gradient-to-br from-[#222222] to-surface-primary border border-[#333333] rounded-xl p-4 backdrop-blur-sm transform group-hover:scale-[1.02] transition-all duration-300">
                            <!-- Chain Badge -->
                            <div class="flex items-center justify-center mb-3">
                              <div class="px-4 py-2 bg-gradient-to-r from-[#333333] to-[#222222] border border-[#444648] rounded-lg shadow-lg">
                                <div class="flex items-center gap-2">
                                  <div class="w-2 h-2 rounded-full animate-pulse" :style="{ backgroundColor: sourceIndicatorColor }"></div>
                                  <span class="text-[#f5f5f5] text-sm font-bold tracking-wide">Chain {{ sourceChainId }}</span>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Source Label -->
                            <div class="text-center mb-2">
                              <span class="text-[#888888] text-xs font-medium uppercase tracking-wider">Source Chain</span>
                            </div>
                            
                            <!-- Address -->
                            <div class="flex items-center justify-center gap-2 p-3 bg-surface-primary/50 rounded-lg border border-[#333333]">
                              <div class="flex items-center justify-center min-w-0">
                                <span class="text-[#bbbbbb] text-xs font-mono">
                                  {{ actualSender.length > 14 ? actualSender.substring(0, 8) + '...' + actualSender.substring(actualSender.length - 6) : actualSender }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Enhanced Flow Arrow -->
                      <div class="flex flex-col items-center gap-2 px-4">
                        <!-- Animated Flow Arrow -->
                        <div class="relative flex flex-col items-center">
                          <!-- Success checkmark replaces blinking dots to avoid implying pending state -->
                          <div v-if="crossChainStatus.text === 'Success'" class="flex items-center justify-center mb-1">
                            <IconCheckmarkFill class="w-4 h-4" :style="{ color: sourceIndicatorColor }" />
                          </div>
                          <!-- Flow dots animation (for Pending/Failed states) -->
                          <div v-else class="flex items-center justify-center gap-1 mb-1">
                            <div class="w-1 h-1 rounded-full animate-ping" :style="{ backgroundColor: flowDotsColor }" style="animation-delay: 0ms"></div>
                            <div class="w-1 h-1 rounded-full animate-ping" :style="{ backgroundColor: flowDotsColor }" style="animation-delay: 200ms"></div>
                            <div class="w-1 h-1 rounded-full animate-ping" :style="{ backgroundColor: flowDotsColor }" style="animation-delay: 400ms"></div>
                          </div>
                        </div>
                        
                        <!-- Glassmorphism Amount -->
                        <div class="relative group">
                          <!-- Glow Effect (same as chain cards) -->
                          <div class="absolute -inset-1 bg-gradient-to-r from-[#00a186]/20 to-[#00a186]/10 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                          
                          <!-- Subtle glass container matching site theme -->
                          <div class="relative px-4 py-2 bg-gradient-to-br from-[#222222]/80 via-surface-primary/60 to-surface-primary/80 backdrop-blur-sm border border-[#333333]/50 rounded-xl shadow-lg transform group-hover:scale-[1.05] transition-all duration-300">
                            <div class="flex items-center gap-2">
                                <!-- Amount text -->
                                <span class="text-white text-sm font-bold tracking-wide" v-if="transferAmount">
                                  {{ transferAmount }} KDA
                                </span>
                                <span class="text-[#bbbbbb] text-sm" v-else>-</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Destination Chain Card -->
                      <div class="flex-1 group">
                        <div class="relative">
                          <!-- Glow Effect -->
                          <div class="absolute -inset-1 bg-gradient-to-r from-[#555555]/20 to-[#444648]/10 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                          
                          <!-- Main Card -->
                          <div class="relative bg-gradient-to-br from-[#222222] to-surface-primary border border-[#333333] rounded-xl p-4 backdrop-blur-sm transform group-hover:scale-[1.02] transition-all duration-300">
                            <!-- Chain Badge -->
                            <div class="flex items-center justify-center mb-3">
                              <div class="px-4 py-2 bg-gradient-to-r from-[#333333] to-[#222222] border border-[#444648] rounded-lg shadow-lg">
                                <div class="flex items-center gap-2">
                                  <div class="w-2 h-2 rounded-full animate-pulse" :style="{ backgroundColor: destinationIndicatorColor }"></div>
                                  <span class="text-[#f5f5f5] text-sm font-bold tracking-wide" v-if="destinationChainId !== null">Chain {{ destinationChainId }}</span>
                                  <span class="text-[#f5f5f5] text-sm font-bold tracking-wide" v-else>Chain —</span>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Destination Label -->
                            <div class="text-center mb-2">
                              <span class="text-[#888888] text-xs font-medium uppercase tracking-wider">Destination Chain</span>
                            </div>
                            
                            <!-- Address: finalized vs pending skeleton -->
                            <div v-if="actualReceiver" class="flex items-center justify-center gap-2 p-3 bg-surface-primary/50 rounded-lg border border-[#333333]">
                              <div class="flex items-center justify-center min-w-0">
                                <span class="text-[#bbbbbb] text-xs font-mono">
                                  {{ actualReceiver.length > 14 ? actualReceiver.substring(0, 8) + '...' + actualReceiver.substring(actualReceiver.length - 6) : actualReceiver }}
                                </span>
                              </div>
                            </div>
                            <div v-else class="p-3">
                              <div class="animate-pulse">
                                <div class="h-8 w-full bg-[#222222] rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
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
              label="Source Transaction:"
              description="The initial transaction that initiated the cross-chain transfer"
              tooltipPos="right"
              :topAlign="true"
            >
              <template #value>
                <div class="flex flex-col gap-3">
                  <div class="flex flex-col gap-1 lg:flex-row lg:gap-2">
                    <span class="text-[#bbbbbb]">Request Key:</span>
                    <div class="flex items-center gap-2">
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
                        buttonClass="lg:block hidden w-5 h-5"
                      />
                    </div>
                  </div>
                  
                  <div class="flex flex-col gap-1 lg:flex-row lg:gap-2">
                    <span class="text-[#bbbbbb]">From:</span>
                    <div class="flex items-center gap-2">
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
                        buttonClass="lg:block hidden w-5 h-5"
                      />
                    </div>
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Chain:</span>
                      <span class="text-[#f5f5f5] ml-1">{{ sourceTransaction.cmd.meta.chainId }}</span>
                    </span>

                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Block:</span>
                      <span class="text-[#f5f5f5] ml-1">{{ sourceTransaction.result.block.height }}</span>
                    </span>

                    <span v-if="sourceTransaction.cmd.meta.creationTime" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Time:</span>
                      <span class="text-[#f5f5f5] ml-1">{{ formatRelativeTime(sourceTransaction.cmd.meta.creationTime) }} ({{ new Date(sourceTransaction.cmd.meta.creationTime).toUTCString() }})</span>
                    </span>               
                  </div>
                </div>
              </template>
            </LabelValue>
          </div>
        </DivideItem>

        <!-- Destination Transaction Details (finalized or skeleton) -->
        <DivideItem>
          <div class="flex flex-col gap-4">
            <LabelValue
              v-if="destinationTransaction"
              label="Destination Transaction:"
              description="The completion transaction on the destination chain"
              tooltipPos="right"
              :topAlign="true"
            >
              <template #value>
                <div class="flex flex-col gap-3">
                  <div class="flex flex-col gap-1 lg:flex-row lg:gap-2">
                    <span class="text-[#bbbbbb]">Request Key:</span>
                    <div class="flex items-center gap-2">
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
                        buttonClass="lg:block hidden w-5 h-5"
                      />
                    </div>
                  </div>
                  
                  <div class="flex flex-col gap-1 lg:flex-row lg:gap-2">
                    <span class="text-[#bbbbbb]">To:</span>
                    <div class="flex items-center gap-2">
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
                        buttonClass="lg:block hidden w-5 h-5"
                      />
                    </div>
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Chain:</span>
                      <span class="text-[#f5f5f5] ml-1">{{ destinationTransaction.cmd.meta.chainId }}</span>
                    </span>

                    <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Block:</span>
                      <span class="text-[#f5f5f5] ml-1">{{ destinationTransaction.result.block.height }}</span>
                    </span>
                    
                    <span v-if="destinationTransaction.cmd.meta.creationTime" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                      <span class="text-[#bbbbbb]">Time:</span>
                      <span class="text-[#f5f5f5] ml-1">{{ formatRelativeTime(destinationTransaction.cmd.meta.creationTime) }} ({{ new Date(destinationTransaction.cmd.meta.creationTime).toUTCString() }})</span>
                    </span>
                  </div>
                </div>
              </template>
            </LabelValue>
            <!-- Section 3: Token Transfers -->
            <div v-else class="flex flex-col gap-1 md:gap-0 md:flex-row animate-pulse">
              <div class="w-[300px] flex-shrink-0">
                <div class="h-5 w-36 bg-[#292B2C] rounded"></div>
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <div class="h-5 w-96 bg-[#343636] rounded"></div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-5 w-[540px] bg-[#343636] rounded"></div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-5 w-36 bg-[#292B2C] rounded"></div>
                  <div class="h-5 w-36 bg-[#292B2C] rounded"></div>
                  <div class="h-5 w-36 bg-[#292B2C] rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </DivideItem>

        <!-- Cross-chain metadata shown for both finalized and pending -->
        <DivideItem v-if="metadataPactId">
          <div class="flex flex-col gap-4">
            <LabelValue
              label="Pact ID:"
              description="Unique identifier linking the source and destination transactions"
              tooltipPos="right"
              topAlign="true"
            >
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="text-[#f5f5f5] text-[15px] break-all">{{ metadataPactId }}</span>
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
                  <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Step:</span>
                    <span class="text-[#f5f5f5] ml-1">{{ metadataStep ?? '-' }}</span>
                  </span>
                  <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Rollback:</span>
                    <span class="text-[#f5f5f5] ml-1">{{ metadataRollback ? 'Yes' : 'No' }}</span>
                  </span>
                </div>
              </template>
            </LabelValue>

            <!-- Continuation Data -->
            <div v-if="metadataSource.result?.continuation" class="flex flex-col md:flex-row items-start gap-1 md:gap-0">
              <div class="flex gap-2 w-full md:min-w-[300px] md:max-w-[300px]">
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
              
              <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
                <div class="w-full">
                  <textarea
                    readonly
                    :value="formatContinuationData(metadataSource.result.continuation)"
                    class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[150px]"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Proof Data (show whenever destination exists with proof) -->
            <div v-if="destinationTransaction && destinationTransaction.cmd?.payload?.proof" class="flex flex-col md:flex-row items-start gap-1 md:gap-0">
              <div class="flex gap-2 w-full md:min-w-[300px] md:max-w-[300px]">
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
              
              <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
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
            <div v-if="metadataSource.cmd?.payload?.data" class="flex flex-col md:flex-row items-start gap-1 md:gap-0">
              <div class="flex gap-2 w-full md:min-w-[300px] md:max-w-[300px]">
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
              
              <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
                <div class="w-full">
                  <textarea
                    readonly
                    :value="formatJsonPretty(metadataSource.cmd.payload.data)"
                    class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[100px]"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </DivideItem>
      </Divide>
    </div>
    
    <div v-else-if="props.loadingCrossChain" class="text-center py-8 text-[#bbbbbb]">
      Loading related transaction data...
    </div>

    <!-- Pending skeleton when we know it's cross-chain but no transfer data yet -->
    <div v-else-if="props.isCrossChain" class="py-5">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 w-fit px-2 py-1 rounded-lg border text-xs bg-[#17150d] border-[#444648] text-[#fbbf24]">
          <IconHourglass class="w-3 h-3" />
          Pending cross-chain transfer
        </div>

        <div class="bg-surface-primary border border-[#222222] rounded-xl p-4">
          <div class="animate-pulse">
            <div class="flex items-center justify-between gap-8">
              <div class="flex-1">
                <div class="h-5 w-40 bg-[#222222] rounded mb-3"></div>
                <div class="h-8 w-full bg-[#222222] rounded"></div>
              </div>
              <div class="w-24 h-6 bg-[#222222] rounded"></div>
              <div class="flex-1">
                <div class="h-5 w-48 bg-[#222222] rounded mb-3"></div>
                <div class="h-8 w-full bg-[#222222] rounded"></div>
              </div>
            </div>
          </div>
          <div class="mt-3 text-[#bbbbbb] text-sm">
            Destination transaction not processed yet. This view will update once it is mined.
          </div>
        </div>
      </div>
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