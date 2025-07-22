<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useFormat } from '~/composables/useFormat'
import { useScreenSize } from '~/composables/useScreenSize'
import Information from '~/components/icon/Information.vue'
import Tooltip from '~/components/Tooltip.vue'
import Hourglass from '~/components/icon/Hourglass.vue'
import Clock from '~/components/icon/Clock.vue'
import CheckmarkFill from '~/components/icon/CheckmarkFill.vue'

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Kadscan'
})

const { isMobile } = useScreenSize()

// Text content for tooltips and labels
const textContent = {
  transactionHash: { label: 'Transaction Hash:', description: 'Unique hash that identifies this transaction on the blockchain.' },
  status: { label: 'Status:', description: 'Indicates the current status of the transaction, such as pending, confirmed, or failed.' },
  block: { label: 'Block:', description: 'Block number where this transaction was recorded.' },
  timestamp: { label: 'Timestamp:', description: 'Date and time when the transaction was validated on the blockchain.' },
  from: { label: 'From:', description: 'Address or account from which the transaction originated.' },
  to: { label: 'To:', description: 'Address or account to which the transaction was sent.' },
  value: { label: 'Value:', description: 'Amount of cryptocurrency transferred in this transaction.' },
  transactionFee: { label: 'Transaction Fee:', description: 'Fee paid to process this transaction on the blockchain.' },
  moreDetails: { label: 'More Details:' },
  privateNote: { label: 'Private Note:' },
}

// Options for selects
const buyOptions = [
  { label: 'Buy', value: 'buy' },
  { label: 'Buy Option 1', value: 'buy1' },
  { label: 'Buy Option 2', value: 'buy2' },
]
const playOptions = [
  { label: 'Play', value: 'play' },
  { label: 'Play Option 1', value: 'play1' },
  { label: 'Play Option 2', value: 'play2' },
]
const gamingOptions = [
  { label: 'Gaming', value: 'gaming' },
  { label: 'Gaming Option 1', value: 'gaming1' },
  { label: 'Gaming Option 2', value: 'gaming2' },
]

const buySelected = ref(buyOptions[0])
const playSelected = ref(playOptions[0])
const gamingSelected = ref(gamingOptions[0])

// Transaction data
const transaction = {
  hash: 'xJHaykvaH0...ve6O9OI42Y',
  status: 'Success',
  block: 6000000,
  blockConfirmations: 55000,
  timestamp: '2025-07-22T11:09:23Z',
  age: '1 day ago',
  from: {
    name: 'xJHaykvaH0...ve6O9OI42Y',
    label: 'xJHaykvaH0...ve6O9OI42Y',
    address: 'xJHaykvaH0...ve6O9OI42Y',
  },
  to: {
    name: 'xJHaykvaH0...ve6O9OI42Y',
    address: 'xJHaykvaH0...ve6O9OI42Y',
  },
  value: '0.012',
  valueUsd: '41.26',
  txnFee: '0.00001',
  txnFeeUsd: '0.03',
  method: 'Transfer',
  sponsoredBanner: '/sponsored-banner.png',
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

</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center pb-5 border-b border-[#222222] mb-6 gap-2">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Transaction Details
      </h1>
    </div>

    <!-- Tabs -->
    <div class="flex items-center justify-between mb-6">
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
          {{ label }}
        </button>
      </div>

    </div>

    <!-- Transaction Action -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] px-5 py-5 flex items-center gap-4 min-h-[56px] mb-2">
      <img src="/favicon.ico" alt="Kadena" class="w-8 h-8 rounded-full bg-[#00EAC7] object-contain" />
      <div class="flex flex-col flex-1 min-w-0">
        <span class="text-xs text-[#f5f5f5] font-semibold tracking-wide">TRANSACTION ACTION</span>
        <div class="flex flex-wrap items-center gap-2 text-[15px] text-[#fafafa]">
          <span class="text-[#bbb]">Transfer</span>
          <span class="font-mono text-[#f5f5f5]">{{ transaction.value }} KDA</span>
          <span class="text-[#bbbbbb]">(${{ transaction.valueUsd }})</span>
          <span v-if="transaction.from.label" class="text-[#bbbbbb]">by</span>
          <ValueLink class="text-[#bb0a0a]" v-if="transaction.from.label" :label="transaction.from.label" :to="`/account/${transaction.from.address}`" />
          <span class="text-[#bbbbbb]">to</span>
          <ValueLink :label="transaction.to.name" :to="`/account/${transaction.to.address}`" />
        </div>
      </div>
    </div>

    <!-- Transaction Details -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
      <Divide>
        <!-- Section 1: Basic Information -->
        <DivideItem>
          <div class="flex flex-col gap-4">
            <LabelValue :row="isMobile" :label="textContent.transactionHash.label" :description="textContent.transactionHash.description" tooltipPos="right">
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#fafafa] break-all text-[15px]">{{ transaction.hash }}</span>
                  <Copy :value="transaction.hash" />
                </div>
              </template>
            </LabelValue>
            <LabelValue :row="isMobile" :label="textContent.status.label" :description="textContent.status.description" tooltipPos="right">
              <template #value>
                <div v-if="transaction.status === 'Success'" class="flex items-center px-2 py-1 rounded-lg border text-xs border-[#014d3a] bg-[#01372b] text-[#00c896] w-fit gap-2">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="7" fill="#00c896" fill-opacity="0.15" stroke="#00c896" stroke-width="2"/>
                    <path d="M5.5 8.5L7.25 10.25L10.5 7" stroke="#00c896" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Success
                </div>
                <Tag v-else :label="transaction.status" :variant="transaction.status === 'Success' ? 'success' : 'failed'" />
              </template>
            </LabelValue>
            <LabelValue :row="isMobile" :label="textContent.block.label" :description="textContent.block.description" tooltipPos="right">
              <template #value>
                <div class="flex items-center gap-2">
                  <Hourglass class="w-3 h-3 text-white" />
                  <ValueLink :label="transaction.block" :to="`/blocks/${transaction.block}`" class="text-blue-400 hover:underline" />
                  <span class="ml-2 px-2 py-0.5 rounded border border-[#444] bg-[#181818] text-xs text-[#fafafa] font-semibold flex items-center gap-1">
                    {{ transaction.blockConfirmations }} Block Confirmations
                  </span>
                </div>
              </template>
            </LabelValue>
            <LabelValue :row="isMobile" :label="textContent.timestamp.label" :description="textContent.timestamp.description" tooltipPos="right">
              <template #value>
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-[#bbbbbb]" />
                  <span class="text-[#fafafa] text-[15px]">{{ transaction.age }} ({{ new Date(transaction.timestamp).toUTCString() }})</span>
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
                  <ValueLink :label="transaction.from.name" :to="`/account/${transaction.from.address}`" class="text-blue-400 hover:underline" />
                  <span class="text-[#bbbbbb] text-xs">({{ transaction.from.label }})</span>
                  <Copy :value="transaction.from.address" />
                </div>
              </template>
            </LabelValue>
            <LabelValue :row="isMobile" :label="textContent.to.label" :description="textContent.to.description" tooltipPos="right">
              <template #value>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#bbbbbb]" fill="none" viewBox="0 0 16 16">
                    <path d="M3 2C3 1.44772 3.44772 1 4 1H10L13 4V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <path d="M10 1V4H13" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <path d="M5 7H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M5 9H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M5 11H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <ValueLink :label="transaction.to.address" :to="`/account/${transaction.to.address}`" class="text-blue-400 hover:underline" />
                  <span class="text-[#bbbbbb] text-xs">({{ transaction.to.name }})</span>
                  <Copy :value="transaction.to.address" />
                  <CheckmarkFill class="w-4 h-4 text-green-500" />
                </div>
              </template>
            </LabelValue>
          </div>
        </DivideItem>

        <!-- Section 3: Values -->
        <DivideItem>
          <div class="flex flex-col gap-4">
            <LabelValue :row="isMobile" :label="textContent.value.label" :description="textContent.value.description" tooltipPos="right">
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#fafafa]">Ξ {{ transaction.value }}</span>
                  <span class="text-[#bbbbbb]">(${{ transaction.valueUsd }})</span>
                </div>
              </template>
            </LabelValue>
            <LabelValue :row="isMobile" :label="textContent.transactionFee.label" :description="textContent.transactionFee.description" tooltipPos="right">
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#fafafa]">{{ transaction.txnFee }} KDA</span>
                  <span class="text-[#bbbbbb]">(${{ transaction.txnFeeUsd }})</span>
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
                      <span class="font-mono text-[#fafafa]">21,000</span>
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
                      <span class="font-mono text-[#fafafa]">21,000</span>
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
                      <span class="font-mono text-[#fafafa]">0.000000001 KDA</span>
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
                      <span class="font-mono text-[#fafafa]">42</span>
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
                      <span class="text-[#fafafa]">{{ transaction.method }}</span>
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
                      <span class="font-mono text-[#fafafa]">1</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  label="Transaction Type:" 
                  description="Category of this transaction"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#fafafa]">Legacy</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  label="Input Data:" 
                  description="Additional data sent with the transaction"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[#fafafa] text-xs">0x</span>
                      <Copy 
                        value="0x" 
                        tooltipText="Copy Input Data"
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
                  label="Max Fee Per Gas:" 
                  description="Maximum fee willing to pay per gas unit"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[#fafafa]">0.000000001 KDA</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  label="Max Priority Fee Per Gas:" 
                  description="Maximum priority fee for faster processing"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[#fafafa]">0 KDA</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  label="Access List:" 
                  description="List of addresses and storage keys accessed"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#fafafa]">None</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  label="Revert Reason:" 
                  description="Reason if transaction was reverted"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-[#fafafa]">-</span>
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
</template> 