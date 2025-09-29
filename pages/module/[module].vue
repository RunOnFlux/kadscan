<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Select from '~/components/Select.vue'
import Copy from '~/components/Copy.vue'
import Coins from '~/components/icon/Coins.vue'
import ContractTransactions from '~/components/module/ContractTransactions.vue'
import ContractEvents from '~/components/module/ContractEvents.vue'
import ContractView from '~/components/module/ContractView.vue'
import { useContractPact } from '~/composables/useContractPact'
import UpperRightArrow from '~/components/icon/UpperRightArrow.vue'
import { staticTokens } from '~/constants/tokens'
import { useSharedData } from '~/composables/useSharedData'
import { useScreenSize } from '~/composables/useScreenSize'

definePageMeta({
  layout: 'app',
})

const route = useRoute()
const { selectedNetwork } = useSharedData()
const { isMobile } = useScreenSize()

const contractSlug = computed(() => route.params.module as string)
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
  title: 'Contract'
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

// Token link support (show only if this module has token transfers)
const hasToken = ref(false)
const tokenStaticMeta = computed(() => (staticTokens || []).find((t: any) => t.module === moduleName.value) || null)
const tokenIconSrc = computed(() => tokenStaticMeta.value?.icon || '')

const TRANSFER_CHECK_GQL = `
  query Transfers($fungibleName: String, $first: Int) {
    transfers(fungibleName: $fungibleName, first: $first) {
      edges { node { amount } }
    }
  }
`

async function checkHasToken() {
  try {
    const net = selectedNetwork.value?.id
    const mod = moduleName.value
    if (!net || !mod) { hasToken.value = false; return }
    const res: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: TRANSFER_CHECK_GQL,
        variables: { fungibleName: mod, first: 1 },
        networkId: net,
      },
    })
    const edges = res?.data?.transfers?.edges || []
    hasToken.value = Array.isArray(edges) && edges.length > 0
  } catch {
    hasToken.value = false
  }
}

watch([moduleName, () => selectedNetwork.value?.id], () => { checkHasToken() }, { immediate: true })

</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-line-default mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <h1 class="text-[19px] font-semibold leading-[150%] text-font-primary">Module</h1>
        </div>
        <div class="flex flex-col md:flex-row md:items-center md:gap-3">
          <div class="text-[15px] text-font-primary break-all">{{ moduleName }}</div>
          <div class="flex items-center gap-3 pt-2 md:pt-0">
            <Copy 
              v-if="!isMobile"
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
      <div class="bg-surface-primary border border-line-default rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-font-primary font-semibold mb-4">
          Overview <span class="text-font-secondary font-normal">— {{ overviewChainLabel }}</span>
        </h3>
        <div class="flex-1 flex flex-col gap-4">
          <!-- Row 1: Namespace + Module Name -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-[13px] text-font-secondary font-medium mb-1">NAMESPACE</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-font-tertiary animate-pulse">Loading...</span>
                <span v-else class="text-font-primary">{{ namespaceLabel }}</span>
              </div>
            </div>
            <div>
              <div class="text-[13px] text-font-secondary font-medium mb-1">MODULE NAME</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-font-tertiary animate-pulse">Loading...</span>
                <span v-else class="text-font-primary">{{ declarationInfo?.name || moduleInfo?.name || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 2: Full Hash + Copy -->
          <div>
            <div class="text-[13px] text-font-secondary font-medium mb-1">HASH</div>
            <div class="text-[14px]">
              <span v-if="showOverviewLoading" class="text-font-tertiary animate-pulse">Loading...</span>
              <template v-else>
                <template v-if="moduleInfo?.hash">
                  <div class="inline-flex items-center gap-2">
                    <span class="text-font-primary">{{ moduleInfo.hash }}</span>
                    <Copy 
                      v-if="!isMobile"
                      :value="moduleInfo.hash" 
                      tooltipText="Copy Hash"
                      iconSize="h-4 w-4"
                      buttonClass="w-4 h-4"
                      placement="bottom"
                    />
                  </div>
                </template>
                <span v-else class="text-font-primary">N/A</span>
              </template>
            </div>
            <!-- Token backlink (only if module is a token) -->
            <div v-if="hasToken" class="mt-3">
              <div class="text-[13px] text-font-secondary font-medium mb-1">TOKEN</div>
              <NuxtLink :to="`/token/${moduleName}`" class="inline-flex items-center gap-2 text-link hover:text-link-hover">
                <img v-if="tokenIconSrc" :src="tokenIconSrc" alt="Token icon" class="w-7 h-7 rounded-full" />
                <span class="text-[14px]">{{ moduleName }}</span>
                <UpperRightArrow class="w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Extra Info -->
      <div class="bg-surface-primary border border-line-default rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-font-primary font-semibold mb-4">Extra Info</h3>
        <div class="space-y-4">
          <!-- Row: Type + Capability -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-[13px] text-font-secondary font-medium mb-1">TYPE</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-font-tertiary animate-pulse">Loading...</span>
                <span v-else class="text-font-primary">{{ declarationInfo?.type || 'N/A' }}</span>
              </div>
            </div>
            <div>
              <div class="text-[13px] text-font-secondary font-medium mb-1">CAPABILITY</div>
              <div class="text-[14px]">
                <span v-if="showOverviewLoading" class="text-font-tertiary animate-pulse">Loading...</span>
                <span v-else class="text-font-primary">{{ declarationInfo?.capability || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Interfaces block (like guards UI) -->
          <div v-if="declarationInfo?.type !== 'Interface' && !showOverviewLoading">
            <div class="text-[13px] text-font-secondary font-medium mb-2">INTERFACES</div>
            <div class="bg-surface-secondary border border-line-strong rounded-lg p-3">
              <div v-if="showOverviewLoading" class="text-[14px] text-font-tertiary animate-pulse">Loading...</div>
              <div v-else-if="moduleInfo?.interfaces && moduleInfo.interfaces.length > 0" class="space-y-1">
                <div 
                  v-for="(iface, index) in moduleInfo.interfaces" 
                  :key="index" 
                  class="text-[14px] text-font-primary font-mono break-all"
                >
                  {{ iface }}
                </div>
              </div>
              <div v-else class="text-[14px] text-font-secondary">N/A</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cross Chain Info -->
      <div class="bg-surface-primary border border-line-default rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-font-primary font-semibold mb-4">Cross Chain Info</h3>
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
                  <Coins class="w-4 h-4 text-font-primary" />
                  <span class="text-font-primary text-[14px]">{{ selectedChainSelect.label }}</span>
                </div>
              </Select>
            </template>
            <template v-else>
              <div class="inline-flex items-center gap-2 rounded-lg bg-surface-secondary border border-line-strong px-3 py-2 select-none cursor-not-allowed">
                <Coins class="w-4 h-4 text-font-primary" />
                <span class="text-font-primary text-[14px]">Maybe in Kadena EVM?</span>
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
              ? 'bg-accent-strong text-btn-text' 
              : 'bg-surface-hover text-font-primary hover:bg-tab-bg-hover'
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


