<script setup lang="ts">
import { IconArrowRight, IconReceive, IconArrow } from '#components'
import Select from '~/components/Select.vue'
import IconMenu from '~/components/icon/Menu.vue'
import IconCode from '~/components/icon/IconCode.vue'
import Information from '~/components/icon/Information.vue'
import Tooltip from '~/components/Tooltip.vue'
import Hourglass from '~/components/icon/Hourglass.vue'
import Clock from '~/components/icon/Clock.vue'
import CheckmarkFill from '~/components/icon/CheckmarkFill.vue'

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


const transaction = {
  hash: '0x853b57d57fcad823b4fcdaf69e403a0ed549f884399ce3af730aa03c8ffcde12',
  status: 'Success',
  block: 22906283,
  blockConfirmations: 297,
  timestamp: '2025-07-12T11:09:23Z',
  age: '1 hr ago',
  from: {
    name: 'titanbuilder.eth',
    label: 'Titan Builder',
    address: '0x060b915c...F76CaD212',
  },
  to: {
    name: 'Lido: Execution Layer Rewards Vault',
    address: '0x388C818C8AB89251b393131C08a736A67ccB19297',
  },
  value: '0.014035670192000462',
  valueUsd: '41.26',
  txnFee: '0.0000117743434910812',
  txnFeeUsd: '0.03',
  method: 'Transfer',
  sponsoredBanner: '/sponsored-banner.png',
};

const tabLabels = ['Overview', 'Logs (1)', 'State']
const activeTab = ref(tabLabels[0])

const apiOptions = [
  { label: 'API', value: 'api' },
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
]
const apiSelected = ref(apiOptions[0])

const menuOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
]
const menuSelected = ref(menuOptions[0])

const showMoreDetails = ref(false)
const contentHeight = ref(0)
const contentRef = ref<HTMLElement | null>(null)

const toggleMoreDetails = () => {
  if (!showMoreDetails.value) {
    // Abrindo - calcular altura real
    showMoreDetails.value = true
    nextTick(() => {
      if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight
      }
    })
  } else {
    // Fechando - animar para 0
    contentHeight.value = 0
    setTimeout(() => {
      showMoreDetails.value = false
    }, 300)
  }
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Kadscan'
})
</script>

<template>
  <PageRoot>
    <div class="flex flex-col gap-6">
      <!-- Título e navegação -->
      <div class="flex items-center justify-between gap-2 border-b border-[#222222] pb-4">
        <div class="flex items-center gap-2">
          <h1 class="text-[#fafafa] font-semibold text-[20px]">
            Transaction Details
          </h1>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <button
            v-for="label in tabLabels"
            :key="label"
            :class="[
              'px-2 py-1 rounded-lg text-sm transition-colors',
              activeTab === label
                ? 'bg-kadscan-500 text-[#fafafa]'
                : 'bg-[#222] text-[#fafafa]'
            ]"
            @click="activeTab = label"
          >
            {{ label }}
          </button>
        </div>
        <div class="flex gap-2 items-center">
          <button class="flex items-center gap-2 bg-[#151515] text-[#fafafa] px-2 py-1 rounded text-sm border border-[#333] hover:bg-[#222] transition-colors">
            <IconCode class="w-4 h-4" />
            API
          </button>
          <div class="bg-[#151515] rounded border border-[#333] px-1 flex items-center justify-center">
            <Select v-model="menuSelected" :items="menuOptions" size="small">
              <template #default>
                <IconMenu class="w-4 h-4 text-[#fafafa]" />
              </template>
            </Select>
          </div>
        </div>
      </div>

      <!-- Bloco de ação estilizado -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] px-5 py-5 flex items-center gap-4 min-h-[56px]">
        <!-- Logo Kadena -->
        <img src="/favicon.ico" alt="Kadena" class="w-8 h-8 rounded-full bg-[#00EAC7] object-contain" />
        <div class="flex flex-col flex-1 min-w-0">
          <span class="text-xs text-[#f5f5f5] font-semibold tracking-wide">TRANSACTION ACTION</span>
          <div class="flex flex-wrap items-center gap-2 text-sm text-[#fafafa]">
            <span class="text-[#bbb]">Transfer</span>
            <span class="font-mono text-[#f5f5f5]">{{ transaction.value }} ETH</span>
            <span class="text-[#bbbbbb]">(${{ transaction.valueUsd }})</span>
            <span v-if="transaction.from.label" class="text-[#bbbbbb]">by</span>
            <ValueLink class="text-[#bb0a0a]" v-if="transaction.from.label" :label="transaction.from.label" :to="`/account/${transaction.from.address}`" />
            <span class="text-[#bbbbbb]">to</span>
            <ValueLink :label="transaction.to.name" :to="`/account/${transaction.to.address}`" />
          </div>
        </div>
      </div>

      <!-- Bloco de detalhes -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 flex flex-col gap-2 text-base">
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Unique hash that identifies this transaction on the blockchain.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Transaction Hash:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-mono text-[#fafafa] break-all text-sm">{{ transaction.hash }}</span>
            <Copy :value="transaction.hash" />
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Indicates the current status of the transaction, such as pending, confirmed, or failed.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Status:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div v-if="transaction.status === 'Success'" class="flex items-center px-2 py-1 rounded-lg border text-xs border-[#014d3a] bg-[#01372b] text-[#00c896] w-fit gap-2">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" fill="#00c896" fill-opacity="0.15" stroke="#00c896" stroke-width="2"/>
                <path d="M5.5 8.5L7.25 10.25L10.5 7" stroke="#00c896" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Success
            </div>
            <Tag v-else :label="transaction.status" :variant="transaction.status === 'Success' ? 'success' : 'failed'" />
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Block number where this transaction was recorded.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Block:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <Hourglass class="w-3 h-3 text-white" />
            <ValueLink :label="transaction.block" :to="`/blocks/${transaction.block}`" class="text-blue-400 hover:underline" />
            
            <span class="ml-2 px-2 py-0.5 rounded border border-[#444] bg-[#181818] text-xs text-[#fafafa] font-semibold flex items-center gap-1">
              
              {{ transaction.blockConfirmations }} Block Confirmations
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Date and time when the transaction was validated on the blockchain.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Timestamp:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <Clock class="w-4 h-4 text-[#bbbbbb]" />
            <span class="text-[#fafafa] text-sm">{{ transaction.age }} ({{ new Date(transaction.timestamp).toUTCString() }})</span>
          </div>
        </div>  
        <hr class="border-[#222222e8]"/>
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Address or account from which the transaction originated.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">From:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            
            <ValueLink :label="transaction.from.name" :to="`/account/${transaction.from.address}`" class="text-blue-400 hover:underline" />
            <span class="text-[#bbbbbb] text-xs">({{ transaction.from.label }})</span>
            <Copy :value="transaction.from.address" />
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Address or account to which the transaction was sent.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">To:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <!-- Ícone de contrato -->
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
        </div>
        <hr class="border-[#222222e8]"/>
        <div class="flex items-center gap-2 mb-2 mt-2">
          <Tooltip value="Amount of cryptocurrency transferred in this transaction.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Value:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-mono text-[#fafafa]">Ξ {{ transaction.value }}</span>
            <span class="text-[#bbbbbb]">(${{ transaction.valueUsd }})</span>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <Tooltip value="Fee paid to process this transaction on the blockchain.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Transaction Fee:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-mono text-[#fafafa]">{{ transaction.txnFee }} ETH</span>
            <span class="text-[#bbbbbb]">(${{ transaction.txnFeeUsd }})</span>
          </div>
        </div>
      </div>

      <!-- More Details Section -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4">
        <!-- Conteúdo detalhado que aparece/desaparece -->
        <div 
          ref="contentRef"
          class="overflow-hidden transition-all duration-300 ease-out"
          :style="{ height: showMoreDetails ? contentHeight + 'px' : '0px' }"
        >
          <div class="mb-4 pb-4 border-b border-[#333]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-[#bbbbbb] w-32 flex-shrink-0">Gas Used:</span>
                <span class="font-mono text-[#fafafa]">21,000</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#bbbbbb] w-32 flex-shrink-0">Gas Limit:</span>
                <span class="font-mono text-[#fafafa]">21,000</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#bbbbbb] w-32 flex-shrink-0">Gas Price:</span>
                <span class="font-mono text-[#fafafa]">0.000000001 ETH</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#bbbbbb] w-32 flex-shrink-0">Nonce:</span>
                <span class="font-mono text-[#fafafa]">42</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#bbbbbb] w-32 flex-shrink-0">Method:</span>
                <span class="text-[#fafafa]">Transfer</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#bbbbbb] w-32 flex-shrink-0">Chain ID:</span>
                <span class="font-mono text-[#fafafa]">1</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botão e label -->
        <div class="flex items-center gap-4">
          <div class="text-[#fafafa] w-44 flex-shrink-0">More Details:</div>
          <div class="flex items-center gap-2 flex-1 mx-4 min-w-0">
            <button 
              @click="toggleMoreDetails"
              class="flex items-center gap-1 transition-colors text-sm hover:text-[#9ccee7] text-[#6AB5DB]"
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
          </div>
        </div>
      </div>

      <!-- Private Note Section -->
      <div class="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-[#fafafa]" fill="none" viewBox="0 0 16 16">
            <path d="M12 6V4C12 2.89543 11.1046 2 10 2H6C4.89543 2 4 2.89543 4 4V6M12 6H4M12 6V10C12 11.1046 11.1046 12 10 12H6C4.89543 12 4 11.1046 4 10V6M8 8V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8" cy="9" r="0.5" fill="currentColor"/>
          </svg>
          <span class="text-[#fafafa]">Private Note:</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[#fafafa]">To access the Private Note feature, you must be</span>
          <span class="text-blue-400">Logged In</span>
        </div>
      </div>

      <!-- Informational Text Block -->
      <div class="flex items-start gap-2 text-sm text-[#bbbbbb]">
        <svg class="w-4 h-4 text-[#fafafa] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
          <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 11V8M8 6H8.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>
          A transaction is a cryptographically signed instruction that changes the blockchain state. Block explorers track the details of all transactions in the network. Learn more about transactions in our
          <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">Knowledge Base.</a>
        </span>
      </div>
    </div>
  </PageRoot>
</template> 