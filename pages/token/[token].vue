<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Select from '~/components/Select.vue'
import Copy from '~/components/Copy.vue'
import Coins from '~/components/icon/Coins.vue'
import TokenTransfers from '~/components/token/TokenTransfers.vue'
import TokenHolders from '~/components/token/TokenHolders.vue'
import ContractView from '~/components/module/ContractView.vue'
import { useContractPact } from '~/composables/useContractPact'
import UpperRightArrow from '~/components/icon/UpperRightArrow.vue'
import { staticTokens } from '~/constants/tokens'
import { useAssetUsdPrices } from '~/composables/useAssetUsdPrices'
import { useTokenTransfers } from '~/composables/useTokenTransfers'
import { useSharedData } from '~/composables/useSharedData'

definePageMeta({
  layout: 'app',
  middleware: ['sanitize-chain'],
})

const route = useRoute()
const { selectedNetwork } = useSharedData()

const tokenSlug = computed(() => route.params.token as string)
// Preserve hyphens and decode the slug.
const moduleName = computed(() => decodeURIComponent(tokenSlug.value || ''))

// Load module info across chains so we can derive a fallback chain when "All Chains" is selected
const pact = useContractPact(moduleName as any)
const { availableChains, moduleInfo, loading, error } = pact

const activeTab = ref<'transfers' | 'holders' | 'contract'>('transfers')

const tabs = computed(() => [
  { id: 'transfers', label: 'Transfers' },
  { id: 'holders', label: 'Holders' },
  { id: 'contract', label: 'Contract' },
])

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'transfers':
      return TokenTransfers
    case 'holders':
      return TokenHolders
    case 'contract':
      return ContractView
    default:
      return TokenTransfers
  }
})

// When chain is not specified (All Chains), use the first available chain for contract views
const effectiveChain = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
  if (isValid) return String(n)
  return availableChains.value?.[0]
})

const activeProps = computed(() => {
  return { 
    modulename: moduleName.value,
    chain: effectiveChain.value as any,
    moduleInfo: moduleInfo.value,
    loading: loading.value,
    error: error.value,
  }
})

const overviewChainLabel = computed(() => {
  const q = route.query.chain as string | undefined
  if (q === undefined) return 'Showing All Chains'
  const n = parseInt(q, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  return isValid ? `Showing Chain ${n}` : 'Showing All Chains'
})

const selectedChainSelect = computed({
  get() {
    const q = route.query.chain as string | undefined
    const n = q !== undefined ? parseInt(q, 10) : undefined
    const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
    if (!isValid) {
      return { label: `All Chains`, value: null }
    }
    return { label: `Chain ${n}`, value: `${n}` }
  },
  set(_val: any) {}
})

const chainSelectOptions = computed(() => {
  const opts: Array<{ label: string; value: any }> = []
  opts.push({ label: `All Chains`, value: null })
  for (let i = 0; i <= 19; i++) {
    opts.push({ label: `Chain ${i}`, value: `${i}` })
  }
  return opts
})

const onChangeChainSelect = (option: any) => {
  const query = { ...route.query }
  if (!option || option.value === null) {
    delete (query as any).chain
  } else {
    ;(query as any).chain = option.value
  }
  navigateTo({ query }, { replace: true })
}

useHead({
  title: 'Token'
})

// Static token icon (if available)
const tokenStaticMeta = computed(() => (staticTokens || []).find((t: any) => t.module === moduleName.value) || null)
const tokenIconSrc = computed(() => tokenStaticMeta.value?.icon || '')

// Price handling (USD per unit), 6 decimals
const { getUsdPerUnit, primeModules } = useAssetUsdPrices()
const unitUsd = computed(() => (moduleName.value ? getUsdPerUnit(moduleName.value) : 0))

// Format display for unit USD price
const formattedUnitUsd = computed(() => {
  const v = Number(unitUsd.value)
  if (!Number.isFinite(v)) return null
  if (v === 0) return '$0.0'
  if (v > 0 && v < 1e-6) return '<$0.000000'
  if (v > 0) return `$${v.toFixed(6)}`
  return null
})

watch(() => moduleName.value, (m) => { if (m) primeModules([m]) }, { immediate: true })

// Total transfers count (chain-aware)
const { totalCount: transfersTotalCount, loading: transfersLoading, fetchTokenTransfers, clearState: clearTransfersState } = useTokenTransfers()

function validChainParam(): string | undefined {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
  return isValid ? `${n}` : undefined
}

async function refreshTransfersCount() {
  const network = selectedNetwork.value
  const mod = moduleName.value
  if (!network || !mod) return
  const params: { networkId: string; fungibleName: string; chainId?: string } = {
    networkId: network.id,
    fungibleName: mod,
  }
  const chainId = validChainParam()
  if (chainId !== undefined) params.chainId = chainId
  await fetchTokenTransfers(params)
}

watch([selectedNetwork, () => route.query.chain, () => moduleName.value], async () => {
  clearTransfersState()
  await refreshTransfersCount()
}, { immediate: true })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-line-default mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <img v-if="tokenIconSrc" :src="tokenIconSrc" alt="Token icon" class="w-8 h-8 rounded-full" />
          <h1 class="text-[19px] font-semibold leading-[150%] text-font-primary">Token</h1>
          <div class="text-[15px] text-font-primary break-all">{{ moduleName }}</div>
        </div>
        <div class="flex items-center gap-3 pt-2 md:pt-0">
          <Copy 
            :value="moduleName" 
            tooltipText="Copy Module Name"
            iconSize="h-5 w-5"
            buttonClass="w-5 h-5"
            placement="bottom"
          />
        </div>
      </div>
    </div>

    <!-- Top Blocks -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <!-- Overview -->
      <div class="bg-surface-primary border border-line-default rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-font-primary font-semibold mb-4">
          Overview <span class="text-font-secondary font-normal">— {{ overviewChainLabel }}</span>
        </h3>
        <div class="flex-1 flex flex-col justify-between gap-4">
          <div>
            <div class="text-[13px] text-font-secondary font-medium mb-1">TOTAL SUPPLY</div>
            <div class="text-[14px] text-font-tertiary">Coming soon...</div>
          </div>
          <div>
            <div class="text-[13px] text-font-secondary font-medium mb-1">HOLDERS</div>
            <div class="text-[14px] text-font-tertiary">Coming soon...</div>
          </div>
          <div>
            <div class="text-[13px] text-font-secondary font-medium mb-1">PRICE</div>
            <div class="text-[14px] text-font-primary">
              <template v-if="formattedUnitUsd !== null">{{ formattedUnitUsd }}</template>
              <template v-else>N/A</template>
            </div>
          </div>
        </div>
      </div>

      <!-- More Info -->
      <div class="bg-surface-primary border border-line-default rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-font-primary font-semibold mb-4">More Info</h3>
        <div class="space-y-4">
          <div>
            <div class="text-[13px] text-font-secondary font-medium mb-1">TOKEN MODULE</div>
            <NuxtLink :to="`/module/${moduleName}`" class="inline-flex items-center gap-1 text-link hover:text-link-hover break-all text-[14px]">
              <span>{{ moduleName }}</span>
              <UpperRightArrow class="w-4 h-4" />
            </NuxtLink>
          </div>
          <div>
            <div class="text-[13px] text-font-secondary font-medium mb-1">TOTAL TRANSFERS</div>
            <div class="text-[14px] text-font-primary">
              <template v-if="transfersLoading"> <span class="text-font-tertiary animate-pulse">Loading...</span> </template>
              <template v-else>{{ new Intl.NumberFormat().format(transfersTotalCount || 0) }}</template>
            </div>
          </div>
        </div>
      </div>

      <!-- Multichain Info -->
      <div class="bg-surface-primary border border-line-default rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-font-primary font-semibold mb-4">Multichain Info</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <Select
              :modelValue="selectedChainSelect"
              @update:modelValue="onChangeChainSelect"
              :items="chainSelectOptions"
              position="bottom-left"
              size="default"
              variant="filled"
              :fullWidth="false"
            >
              <div class="inline-flex items-center gap-2">
                <Coins class="w-4 h-4 text-font-primary" />
                <span class="text-font-primary text-[14px]">
                  {{ selectedChainSelect.label }}
                </span>
              </div>
            </Select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center justify-between mb-4 overflow-x-auto">
      <div class="flex items-center gap-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id as any"
          :class="[
            'px-3 py-1 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id 
              ? 'bg-accent-strong text-font-primary' 
              : 'bg-surface-hover text-font-primary hover:bg-tab-bg-hover'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mb-6">
      <KeepAlive include="TokenTransfers,TokenHolders,ContractView">
        <component :is="activeComponent" v-bind="activeProps" />
      </KeepAlive>
    </div>
  </div>
</template>


