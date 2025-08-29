<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Select from '~/components/Select.vue'
import Copy from '~/components/Copy.vue'
import Coins from '~/components/icon/Coins.vue'
import ContractTransactions from '~/components/contract/Transactions.vue'
import ContractEvents from '~/components/contract/Events.vue'
import ContractView from '~/components/contract/View.vue'
import { useContractPact } from '~/composables/useContractPact'

definePageMeta({
  layout: 'app',
})

const route = useRoute()

const contractSlug = computed(() => route.params.contract as string)
// Use the slug as-is; modules may legitimately contain hyphens. Decode URI components for safety.
const moduleName = computed(() => decodeURIComponent(contractSlug.value || ''))
const { availableChains, fetchAllChains, allChainsLoaded } = useContractPact(moduleName as any)
const isSettingChain = ref(false)
watch([contractSlug, moduleName, () => route.query.chain], () => {
}, { immediate: true })

const activeTab = ref<'transactions' | 'events' | 'contract'>('transactions')

const tabs = computed(() => [
  { id: 'transactions', label: 'Transactions' },
  { id: 'events', label: 'Events' },
  { id: 'contract', label: 'Contract' },
])

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'transactions':
      return ContractTransactions
    case 'events':
      return ContractEvents
    case 'contract':
      return ContractView
    default:
      return ContractTransactions
  }
})

const activeProps = computed(() => {
  return { modulename: moduleName.value, chain: route.query.chain as any }
})

// Flag: module not available on any chain (after loading completes)
const noChains = computed(() => {
  const loaded = allChainsLoaded.value
  const list = availableChains.value || []
  return loaded && list.length === 0
})

const overviewChainLabel = computed(() => {
  const q = route.query.chain as string | undefined
  const n = parseInt(q ?? '', 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  return isValid ? `Showing Chain ${n}` : 'Showing Chain 0'
})

const selectedChainSelect = computed({
  get() {
    const q = route.query.chain as string | undefined
    const n = q !== undefined ? parseInt(q, 10) : undefined
    const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
    const value = isValid ? `${n}` : (availableChains.value?.[0] ?? '0')
    return { label: `Chain ${value}`, value }
  },
  set(_val: any) {}
})

const chainSelectOptions = computed(() => {
  return (availableChains.value || []).map((c) => ({ label: `Chain ${c}`, value: c }))
})

const onChangeChainSelect = (option: any) => {
  const query = { ...route.query }
  ;(query as any).chain = option?.value ?? (availableChains.value?.[0] ?? '0')
  navigateTo({ query }, { replace: true })
}

useHead({
  title: `Contract ${moduleName.value} - Kadscan`
})

// Ensure chains are fetched and chain query defaults correctly
watch(moduleName, () => {
  fetchAllChains()
}, { immediate: true })

watch(availableChains, (chains) => {
  const list = chains || []
  if (!Array.isArray(list) || list.length === 0) return
  const q = route.query.chain as string | undefined
  const current = q ?? ''
  const first = list[0]
  const isValid = current !== '' && list.includes(String(current))
  if (!isValid) {
    if (current !== first && !isSettingChain.value) {
      isSettingChain.value = true
      const query = { ...route.query, chain: first }
      navigateTo({ query }, { replace: true }).finally(() => { isSettingChain.value = false })
    }
  }
}, { immediate: true })

// After chains load, if module doesn't exist on any chain, clean `chain` from URL
watch([allChainsLoaded, availableChains], ([loaded, chains]) => {
  if (!loaded) return
  const list = chains || []
  if (list.length === 0) {
    const q: any = { ...route.query }
    if (q.chain !== undefined) {
      delete q.chain
      navigateTo({ query: q }, { replace: true })
    }
  }
}, { immediate: true })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-[#222222] mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">Contract</h1>
        </div>
        <div class="flex flex-col md:flex-row md:items-center md:gap-3">
          <div class="text-[15px] text-[#f5f5f5] break-all">{{ moduleName }}</div>
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
    </div>

    <!-- Top Blocks -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <!-- Overview -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#fafafa] font-semibold mb-4">
          Overview <span class="text-[#bbbbbb] font-normal">— {{ overviewChainLabel }}</span>
        </h3>
        <div class="flex-1 flex items-center justify-center text-[#888888] text-[14px]">Coming soon...</div>
      </div>

      <!-- More Info -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#fafafa] font-semibold mb-4">More Info</h3>
        <div class="flex-1 flex items-center justify-center text-[#888888] text-[14px]">Coming soon...</div>
      </div>

      <!-- Multichain Info -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#fafafa] font-semibold mb-4">Multichain Info</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <template v-if="!noChains">
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
                  <Coins class="w-4 h-4 text-[#fafafa]" />
                  <span class="text-[#fafafa] text-[14px]">{{ selectedChainSelect.label }}</span>
                </div>
              </Select>
            </template>
            <template v-else>
              <div class="inline-flex items-center gap-2 rounded-lg bg-[#222222] border border-[#333333] px-3 py-2 select-none cursor-not-allowed">
                <Coins class="w-4 h-4 text-[#fafafa]" />
                <span class="text-[#fafafa] text-[14px]">Maybe in Kadena EVM?</span>
              </div>
            </template>
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
              ? 'bg-[#009367] text-[#fafafa]' 
              : 'bg-[#252525] text-[#fafafa] hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mb-6">
      <KeepAlive include="ContractTransactions,ContractEvents,ContractView">
        <component :is="activeComponent" v-bind="activeProps" />
      </KeepAlive>
    </div>
  </div>
</template>


