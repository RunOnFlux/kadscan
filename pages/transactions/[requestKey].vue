<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTransaction } from '~/composables/useTransaction'
import { useFormat } from '~/composables/useFormat'
import { useScreenSize } from '~/composables/useScreenSize'
import { useSharedData } from '~/composables/useSharedData'
import Information from '~/components/icon/Information.vue'
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
  totalValue,
  totalValueUsd,
  transactionFee,
  transactionFeeUsd,
  blockConfirmations,
} = useTransaction(transactionId, networkId)

// Text content for tooltips and labels
const textContent = {
  transactionHash: { label: 'Transaction Hash:', description: 'Unique hash that identifies this transaction on the blockchain.' },
  status: { label: 'Status:', description: 'Indicates the current status of the transaction, such as pending, confirmed, or failed.' },
  block: { label: 'Block:', description: 'Block number where this transaction was recorded.' },
  chainId: { label: 'Chain ID:', description: 'The specific chain (0-19) on which this block was mined' },
  timestamp: { label: 'Timestamp:', description: 'Date and time when the transaction was validated on the blockchain.' },
  from: { label: 'From:', description: 'Address or account from which the transaction originated.' },
  to: { label: 'To:', description: 'Address or account to which the transaction was sent.' },
  value: { label: 'Value:', description: 'Amount of cryptocurrency transferred in this transaction.' },
  transactionFee: { label: 'Transaction Fee:', description: 'Fee paid to process this transaction on the blockchain.' },
  moreDetails: { label: 'More Details:' },
}

// Tab management
const tabLabels = ['Overview', 'Logs (1)', 'State']
const activeTab = ref(tabLabels[0])

// More details functionality
const showMoreDetails = ref(false)
const contentHeight = ref(0)
const contentRef = ref<HTMLElement | null>(null)

const toggleMoreDetails = () => {
  if (!showMoreDetails.value) {
    showMoreDetails.value = true
    nextTick(() => {
      if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight
      }
    })
  } else {
    contentHeight.value = 0
    setTimeout(() => {
      showMoreDetails.value = false
    }, 300)
  }
}

const transactionStatus = computed(() => {
  if(lastBlockHeight.value - 10 >= transaction.value?.result?.block?.height && !transaction.value?.result?.block?.canonical) {
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

const fromAddress = computed(() => {
  return transaction.value?.cmd?.meta?.sender || ''
})

const toAddress = computed(() => {
  if (!primaryTransfer.value) return ''
  return primaryTransfer.value.receiverAccount || ''
})

const displayFromAddress = computed(() => {
  return fromAddress.value ? fromAddress.value : ''
})

const displayToAddress = computed(() => {
  return toAddress.value ? toAddress.value : ''
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
      <div class="flex items-center pb-5 border-b border-[#222222] pb-4 gap-2">
        <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
          Transaction Details
        </h1>
      </div>

      <!-- Tabs -->
      <div class="flex items-center justify-between py-3">
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
                              <span class="text-[#fafafa] font-mono">{{ eventEdge.node.moduleName }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-[#bbbbbb]">Event:</span>
                              <span class="text-[#fafafa] font-mono">{{ eventEdge.node.name }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-[#bbbbbb]">Order:</span>
                              <span class="text-[#fafafa]">{{ eventEdge.node.orderIndex }}</span>
                            </div>
                          </div>
                          
                          <div>
                            <span class="text-[#bbbbbb] text-sm">Parameters:</span>
                            <div class="mt-1 p-3 bg-[#1a1a1a] rounded border border-[#333] font-mono text-xs text-[#fafafa] break-all">
                              {{ eventEdge.node.parameterText }}
                            </div>
                          </div>
                        </div>
                      </template>
                    </LabelValue>
                    
                    <!-- Divider between events (except last one) -->
                    <div v-if="index < transaction.result.events.edges.length - 1" class="border-b border-[#333]"></div>
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
              <LabelValue :row="isMobile" :label="textContent.status.label" :description="transactionStatus.description" tooltipPos="right">
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
                   <ValueLink v-if="transaction?.result?.block?.height" :label="transaction.result.block.height" :to="`/blocks/${transaction.result.block.height}/chain/${transaction.result.block.chainId}`" class="text-blue-400 hover:underline" />
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
                   <Clock class="w-4 h-4 text-[#bbbbbb]" />
                   <span v-if="age && transaction?.cmd?.meta?.creationTime" class="text-[#fafafa] text-[15px]">{{ age }} ({{ new Date(transaction.cmd.meta.creationTime).toUTCString() }})</span>
                   <span v-else class="text-[#fafafa] text-[15px]">-</span>
                 </div>
               </template>
             </LabelValue>
            </div>
          </DivideItem>

          <!-- Section 2: Addresses -->
          <DivideItem>
            <div class="flex flex-col gap-4">
              <LabelValue :row="isMobile" :label="textContent.from.label" :description="textContent.from.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <ValueLink :label="displayFromAddress" :to="`/account/${fromAddress}`" class="text-blue-400 hover:underline" />
                    <Copy 
                      :value="fromAddress" 
                      tooltipText="Copy Transaction Hash"
                      iconSize="h-5 w-5"
                      buttonClass="w-5 h-5"
                    />
                  </div>
                </template>
              </LabelValue>
              <LabelValue v-if="displayToAddress" :row="isMobile" :label="textContent.to.label" :description="textContent.to.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <ValueLink :label="displayToAddress" :to="`/account/${toAddress}`" class="text-blue-400 hover:underline" />
                    <Copy 
                      :value="toAddress" 
                      tooltipText="Copy Transaction Hash"
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
              label="Token Transfers:"
              description="Individual token transfers within this transaction"
              tooltipPos="right"
            >
              <template #value>
                <div class="flex flex-col gap-4">
                  <div 
                    v-for="(transferEdge, index) in transaction.result.transfers.edges" 
                    :key="transferEdge.node.id"
                    class="flex flex-col gap-2"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-xs bg-[#333] text-[#fafafa] px-2 py-1 rounded font-mono">
                          {{ transferEdge.node.moduleName }}
                        </span>
                        <span class="text-xs text-[#bbbbbb]">#{{ index }}</span>
                      </div>
                      <div class="text-[#fafafa] font-mono text-[15px]">
                        {{ transferEdge.node.amount }} {{ transferEdge.node.moduleName === 'coin' ? 'KDA' : 'CRANKK' }}
                      </div>
                    </div>
                    
                    <div class="ml-4 flex items-center gap-2 text-[15px]">
                      <span class="text-[#bbbbbb]">From</span>
                      <ValueLink 
                        :label="truncateAddress(transferEdge.node.senderAccount)" 
                        :to="`/account/${transferEdge.node.senderAccount}`" 
                        class="text-blue-400 hover:underline"
                      />
                      <Copy :value="transferEdge.node.senderAccount" />
                      <span class="text-[#bbbbbb] mx-2">to</span>
                      <ValueLink 
                        :label="truncateAddress(transferEdge.node.receiverAccount)" 
                        :to="`/account/${transferEdge.node.receiverAccount}`" 
                        class="text-blue-400 hover:underline"
                      />
                      <Copy :value="transferEdge.node.receiverAccount" />
                    </div>
                    
                    <!-- Divider between transfers (except last one) -->
                    <div v-if="index < transaction.result.transfers.edges.length - 1" class="border-b border-[#333] mt-2"></div>
                  </div>
                </div>
              </template>
            </LabelValue>
          </DivideItem>

          <!-- Section 4: Values -->
          <DivideItem>
            <div class="flex flex-col gap-4">
              <LabelValue v-if="totalValue !== '0'" :row="isMobile" :label="textContent.value.label" :description="textContent.value.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[#fafafa]">{{ totalValue }} KDA</span>
                    <span v-if="totalValueUsd !== '0'" class="text-[#bbbbbb]">(${{ totalValueUsd }})</span>
                  </div>
                </template>
              </LabelValue>
              <LabelValue :row="isMobile" :label="textContent.transactionFee.label" :description="textContent.transactionFee.description" tooltipPos="right">
                <template #value>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[#fafafa]">{{ transactionFee }} KDA</span>
                    <span v-if="transactionFeeUsd !== '0'" class="text-[#bbbbbb]">(${{ transactionFeeUsd }})</span>
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
          :style="{ height: showMoreDetails ? contentHeight + 'px' : '0px' }"
        >
          <div class="mb-4 pb-4 border-b border-[#333]">
            <Divide>
              <!-- Gas Information -->
              <DivideItem>
                <div class="flex flex-col gap-4">
                                     <LabelValue
                     label="Gas Used:"
                     description="Total gas consumed by this transaction"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="font-mono text-[#fafafa]">{{ transaction?.result?.gas || '-' }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Gas Limit:" 
                     description="Maximum gas allowed for this transaction"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="font-mono text-[#fafafa]">{{ transaction?.cmd?.meta?.gasLimit || '-' }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Gas Price:" 
                     description="Price per unit of gas for this transaction"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="font-mono text-[#fafafa]">{{ transaction?.cmd?.meta?.gasPrice || '-' }} KDA</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Nonce:" 
                     description="Sequential number for this transaction"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="font-mono text-[#fafafa]">{{ transaction?.cmd?.nonce || '-' }}</span>
                       </div>
                     </template>
                   </LabelValue>
                </div>
              </DivideItem>

              <!-- Transaction Details -->
              <DivideItem>
                <div class="flex flex-col gap-4">
                  <LabelValue 
                    label="Method:" 
                    description="Type of transaction executed"
                    tooltipPos="right"
                  >
                    <template #value>
                      <div class="flex items-center gap-2">
                        <span class="text-[#fafafa]">{{ method }}</span>
                      </div>
                    </template>
                  </LabelValue>
                  <LabelValue 
                    label="Chain ID:" 
                    description="Blockchain network identifier"
                    tooltipPos="right"
                  >
                                         <template #value>
                       <div class="flex items-center gap-2">
                         <span class="font-mono text-[#fafafa]">{{ transaction?.cmd?.meta?.chainId || '-' }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Network ID:" 
                     description="Network identifier"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="text-[#fafafa]">{{ transaction?.cmd?.networkId || '-' }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Code:" 
                     description="Smart contract code executed"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span v-if="transaction?.cmd?.payload?.code" class="font-mono text-[#fafafa] text-xs break-all">{{ transaction.cmd.payload.code.slice(0, 50) }}...</span>
                         <span v-else class="font-mono text-[#fafafa] text-xs">-</span>
                         <Copy 
                           v-if="transaction?.cmd?.payload?.code"
                           :value="transaction.cmd.payload.code" 
                           tooltipText="Copy Code"
                           iconSize="h-5 w-5"
                           buttonClass="w-5 h-5"
                         />
                       </div>
                     </template>
                   </LabelValue>
                </div>
              </DivideItem>

              <!-- Advanced Details -->
              <DivideItem>
                <div class="flex flex-col gap-4">
                  <LabelValue 
                    label="TTL:" 
                    description="Time to live for this transaction"
                    tooltipPos="right"
                  >
                                         <template #value>
                       <div class="flex items-center gap-2">
                         <span class="font-mono text-[#fafafa]">{{ transaction?.cmd?.meta?.ttl || '-' }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Transfers:" 
                     description="Number of token transfers in this transaction"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="text-[#fafafa]">{{ transfersCount }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Events:" 
                     description="Number of events emitted by this transaction"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="text-[#fafafa]">{{ eventsCount }}</span>
                       </div>
                     </template>
                   </LabelValue>
                   <LabelValue 
                     label="Result:" 
                     description="Transaction execution result"
                     tooltipPos="right"
                   >
                     <template #value>
                       <div class="flex items-center gap-2">
                         <span class="text-[#fafafa]">{{ transaction?.result?.goodResult || 'Success' }}</span>
                       </div>
                     </template>
                   </LabelValue>
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
