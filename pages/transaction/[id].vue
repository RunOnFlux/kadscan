<script setup lang="ts">
import { IconArrowRight, IconReceive, IconArrow } from '#components'
import Select from '~/components/Select.vue'

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

const tabs = [
  { label: 'Overview', active: true },
  { label: 'Logs (1)', active: false },
  { label: 'State', active: false },
];

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
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h1 class="text-[#fafafa] font-semibold text-[20px]">
            Transaction Details
          </h1>
          <div class="flex items-center gap-1 ml-2">
            <div class="group flex items-center justify-center bg-[#1a1c1d] hover:bg-[#fafafa] rounded-md w-[26px] h-[24px] shrink-0 cursor-pointer transition-colors duration-200">
              <IconArrow class="w-6 h-6 text-[#fafafa] group-hover:text-[#1a1c1d] transition-colors duration-200" />
            </div>
            <div class="group flex items-center justify-center bg-[#1a1c1d] hover:bg-[#fafafa] rounded-md w-[26px] h-[24px] shrink-0 cursor-pointer transition-colors duration-200">
              <IconArrowRight class="w-6 h-6 text-[#fafafa] group-hover:text-[#1a1c1d] transition-colors duration-200" />
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Select v-model="buySelected" :items="buyOptions" />
          <Select v-model="playSelected" :items="playOptions" />
          <Select v-model="gamingSelected" :items="gamingOptions" />
        </div>
      </div>

      <!-- Sponsored -->
      <div class="bg-gray-900 rounded-lg p-3 flex items-center gap-2 text-xs text-font-500">
        <span class="font-semibold text-font-400">Sponsored:</span>
        <span>Stake: 200% Bonus, 75k Raffle, Best VIP Program, Instant Withdrawals - Provably Fair.</span>
        <a href="#" class="text-kadscan-500 font-semibold ml-1">Claim Bonus</a>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.label"
          :class="[
            'px-4 py-1 rounded font-semibold text-sm',
            tab.active ? 'bg-kadscan-500 text-white' : 'bg-gray-700 text-font-400'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Bloco de ação -->
      <div class="bg-gray-800 rounded-lg p-4 flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <img src="/favicon.ico" alt="ETH" class="w-8 h-8 rounded-full bg-gray-700" />
          <span class="text-font-500 text-xs font-semibold">TRANSACTION ACTION</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-base text-font-400">
          <span>Transfer</span>
          <span class="font-mono text-white">{{ transaction.value }} ETH</span>
          <span class="text-font-500">(${{ transaction.valueUsd }})</span>
          <span>by</span>
          <ValueLink :label="transaction.from.label" :to="`/account/${transaction.from.address}`" />
          <span>to</span>
          <ValueLink :label="transaction.to.name" :to="`/account/${transaction.to.address}`" />
        </div>
      </div>

      <!-- Bloco de detalhes -->
      <div class="bg-gray-800 rounded-lg p-4 flex flex-col gap-4">
        <div class="flex flex-col md:flex-row md:gap-8 gap-4">
          <div class="flex-1 flex flex-col gap-2">
            <LabelValue label="Transaction Hash">
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs text-font-400">{{ transaction.hash }}</span>
                  <Copy :value="transaction.hash" />
                </div>
              </template>
            </LabelValue>
            <LabelValue label="Status">
              <template #value>
                <Tag :label="transaction.status" :variant="transaction.status === 'Success' ? 'success' : 'failed'" />
              </template>
            </LabelValue>
            <LabelValue label="Block">
              <template #value>
                <div class="flex items-center gap-2">
                  <ValueLink :label="transaction.block" :to="`/blocks/${transaction.block}`" />
                  <span class="bg-gray-700 text-xs px-2 py-1 rounded">
                    {{ transaction.blockConfirmations }} Block Confirmations
                  </span>
                </div>
              </template>
            </LabelValue>
            <LabelValue label="Timestamp">
              <template #value>
                <div class="flex items-center gap-2">
                  <IconStatus status="success" class="w-4 h-4 text-font-500" />
                  <span class="text-font-400 text-xs">
                    {{ transaction.age }} ({{ new Date(transaction.timestamp).toUTCString() }})
                  </span>
                </div>
              </template>
            </LabelValue>
            <LabelValue label="Sponsored:">
              <template #value>
                <img :src="transaction.sponsoredBanner" alt="Sponsored" class="rounded w-full max-w-[400px]" />
              </template>
            </LabelValue>
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <LabelValue label="From:">
              <template #value>
                <div class="flex items-center gap-2">
                  <ValueLink :label="transaction.from.name" :to="`/account/${transaction.from.address}`" />
                  <span class="text-font-500 text-xs">({{ transaction.from.label }})</span>
                  <Copy :value="transaction.from.address" />
                </div>
              </template>
            </LabelValue>
            <LabelValue label="To:">
              <template #value>
                <div class="flex items-center gap-2">
                  <ValueLink :label="transaction.to.address" :to="`/account/${transaction.to.address}`" />
                  <span class="text-font-500 text-xs">({{ transaction.to.name }})</span>
                  <Copy :value="transaction.to.address" />
                </div>
              </template>
            </LabelValue>
            <LabelValue label="Value:">
              <template #value>
                <span class="font-mono">
                  Ξ {{ transaction.value }}
                  <span class="text-font-500">(${{ transaction.valueUsd }})</span>
                </span>
              </template>
            </LabelValue>
            <LabelValue label="Transaction Fee:">
              <template #value>
                <span class="font-mono">
                  {{ transaction.txnFee }} ETH
                  <span class="text-font-500">(${{ transaction.txnFeeUsd }})</span>
                </span>
              </template>
            </LabelValue>
          </div>
        </div>
      </div>
    </div>
  </PageRoot>
</template> 