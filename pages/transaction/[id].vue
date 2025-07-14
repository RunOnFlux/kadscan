<script setup lang="ts">
import { IconArrowRight, IconReceive, IconArrow } from '#components'
import Select from '~/components/Select.vue'
import IconMenu from '~/components/icon/Menu.vue'
import IconCode from '~/components/icon/IconCode.vue'
import Information from '~/components/icon/Information.vue'
import Tooltip from '~/components/Tooltip.vue'

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
        <div class="flex items-center gap-2">
          <Tooltip value="Hash único que identifica esta transação na blockchain.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Transaction Hash:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-mono text-[#fafafa] break-all text-sm">{{ transaction.hash }}</span>
            <Copy :value="transaction.hash" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Indica o status atual da transação, como pendente, confirmada ou falha.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Status:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <Tag :label="transaction.status" :variant="transaction.status === 'Success' ? 'success' : 'failed'" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Número do bloco onde esta transação foi registrada.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Block:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <ValueLink :label="transaction.block" :to="`/blocks/${transaction.block}`" class="text-blue-400 hover:underline" />
            <span class="bg-[#222] text-xs px-2 py-1 rounded">{{ transaction.blockConfirmations }} Block Confirmations</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Data e hora em que a transação foi validada na blockchain.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Timestamp:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="text-[#fafafa] text-sm">{{ transaction.age }} ({{ new Date(transaction.timestamp).toUTCString() }})</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Indica se a transação foi patrocinada por terceiros.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Sponsored:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span v-if="transaction.sponsoredBanner" class="flex items-center gap-1">
              <img :src="transaction.sponsoredBanner" alt="Sponsored" class="rounded w-20 h-5 object-contain" />
              <span class="text-[#fafafa] text-sm">Sponsored</span>
            </span>
            <span v-else class="text-[#bbbbbb] text-sm">-</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Endereço ou conta de origem da transação.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">From:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <ValueLink :label="transaction.from.name" :to="`/account/${transaction.from.address}`" class="text-blue-400 hover:underline" />
            <span class="text-[#bbbbbb] text-xs">({{ transaction.from.label }})</span>
            <Copy :value="transaction.from.address" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Endereço ou conta de destino da transação.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">To:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <ValueLink :label="transaction.to.address" :to="`/account/${transaction.to.address}`" class="text-blue-400 hover:underline" />
            <span class="text-[#bbbbbb] text-xs">({{ transaction.to.name }})</span>
            <Copy :value="transaction.to.address" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Quantidade de criptomoeda transferida nesta transação.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Value:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-mono text-[#fafafa]">Ξ {{ transaction.value }}</span>
            <span class="text-[#bbbbbb]">(${{ transaction.valueUsd }})</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Tooltip value="Taxa paga para processar esta transação na blockchain.">
            <Information class="w-4 h-4 text-[#bbbbbb] cursor-pointer" />
          </Tooltip>
          <span class="text-[#bbbbbb] text-sm w-44 flex-shrink-0">Transaction Fee:</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-mono text-[#fafafa]">{{ transaction.txnFee }} ETH</span>
            <span class="text-[#bbbbbb]">(${{ transaction.txnFeeUsd }})</span>
          </div>
        </div>
      </div>
    </div>
  </PageRoot>
</template> 