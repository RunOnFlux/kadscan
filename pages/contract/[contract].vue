<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Select from '~/components/Select.vue'
import Copy from '~/components/Copy.vue'
import Coins from '~/components/icon/Coins.vue'
import ContractTransactions from '~/components/contract/ContractTransactions.vue'
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
const pact = useContractPact(moduleName as any)
const { availableChains, fetchAllChains, allChainsLoaded, moduleInfo, loading, error } = pact
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
  return {
    modulename: moduleName.value,
    chain: route.query.chain as any,
    moduleInfo: moduleInfo.value,
    loading: loading.value,
    error: error.value,
  }
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

// Namespace label: if module has no explicit namespace (no dot), show "System"
const namespaceLabel = computed(() => {
  const name = moduleName.value || ''
  if (!name) return 'N/A'
  const hasDot = name.includes('.')
  return hasDot ? (name.split('.')[0] || 'N/A') : '-'
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
// Overview parsing from code
type DeclarationInfo = {
  type: 'Module' | 'Interface'
  name: string
  capability?: string
}

const codeContent = computed(() => (moduleInfo.value?.code || '').trim())

const declarationInfo = computed<DeclarationInfo | null>(() => {
  const code = codeContent.value
  if (!code) return null
  const match = code.match(/\(\s*(module|interface)\s+([^\s()]+)(?:\s+([^\s()]+))?/i)
  if (!match) return null
  const type = match[1].toLowerCase() === 'interface' ? 'Interface' : 'Module'
  const name = match[2]
  const capability = match[3]
  return { type, name, capability }
})

// SSR-friendly Loading gate like address page
const isHydrated = ref(false)
onMounted(() => { isHydrated.value = true })
const showOverviewLoading = computed(() => !isHydrated.value || loading.value)

</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-[#222222] mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <h1 class="text-[19px] font-semibold leading-[150%] text-[#f5f5f5]">Contract</h1>
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
        <h3 class="text-[#f5f5f5] font-semibold mb-4">
          Overview <span class="text-[#bbbbbb] font-normal">— {{ overviewChainLabel }}</span>
        </h3>
        <div class="flex-1 flex flex-col gap-4">
          <!-- Row 1: Namespace + Module Name -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">NAMESPACE</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-[#888888] animate-pulse">Loading...</span>
                <span v-else class="text-[#f5f5f5]">{{ namespaceLabel }}</span>
              </div>
            </div>
            <div>
              <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">MODULE NAME</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-[#888888] animate-pulse">Loading...</span>
                <span v-else class="text-[#f5f5f5]">{{ declarationInfo?.name || moduleInfo?.name || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 2: Full Hash + Copy -->
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">HASH</div>
            <div class="text-[14px]">
              <span v-if="showOverviewLoading" class="text-[#888888] animate-pulse">Loading...</span>
              <template v-else>
                <template v-if="moduleInfo?.hash">
                  <div class="inline-flex items-center gap-2">
                    <span class="text-[#f5f5f5]">{{ moduleInfo.hash }}</span>
                    <Copy 
                      :value="moduleInfo.hash" 
                      tooltipText="Copy Hash"
                      iconSize="h-4 w-4"
                      buttonClass="w-4 h-4"
                      placement="bottom"
                    />
                  </div>
                </template>
                <span v-else class="text-[#f5f5f5]">N/A</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- More Info -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#f5f5f5] font-semibold mb-4">More Info</h3>
        <div class="space-y-4">
          <!-- Row: Type + Capability -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">TYPE</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-[#888888] animate-pulse">Loading...</span>
                <span v-else class="text-[#f5f5f5]">{{ declarationInfo?.type || 'N/A' }}</span>
              </div>
            </div>
            <div>
              <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">CAPABILITY</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-[#888888] animate-pulse">Loading...</span>
                <span v-else class="text-[#f5f5f5]">{{ declarationInfo?.capability || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Interfaces block (like guards UI) -->
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-2">INTERFACES</div>
            <div class="bg-[#222222] border border-[#333333] rounded-lg p-3">
              <div v-if="showOverviewLoading" class="text-[14px] text-[#888888] animate-pulse">Loading...</div>
              <div v-else-if="moduleInfo?.interfaces && moduleInfo.interfaces.length > 0" class="space-y-1">
                <div 
                  v-for="(iface, index) in moduleInfo.interfaces" 
                  :key="index" 
                  class="text-[14px] text-[#f5f5f5] font-mono break-all"
                >
                  {{ iface }}
                </div>
              </div>
              <div v-else class="text-[14px] text-[#bbbbbb]">N/A</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Multichain Info -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#f5f5f5] font-semibold mb-4">Multichain Info</h3>
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
                  <Coins class="w-4 h-4 text-[#f5f5f5]" />
                  <span class="text-[#f5f5f5] text-[14px]">{{ selectedChainSelect.label }}</span>
                </div>
              </Select>
            </template>
            <template v-else>
              <div class="inline-flex items-center gap-2 rounded-lg bg-[#222222] border border-[#333333] px-3 py-2 select-none cursor-not-allowed">
                <Coins class="w-4 h-4 text-[#f5f5f5]" />
                <span class="text-[#f5f5f5] text-[14px]">Maybe in Kadena EVM?</span>
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
            'px-3 py-1 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id 
              ? 'bg-[#009367] text-[#f5f5f5]' 
              : 'bg-[#252525] text-[#f5f5f5] hover:bg-[#333333]'
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


