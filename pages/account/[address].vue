<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { formatDistanceToNowStrict } from 'date-fns'
import { useScreenSize } from '~/composables/useScreenSize'
import { useAccount } from '~/composables/useAccount'
import { useBinance } from '~/composables/useBinance'
import { useSharedData } from '~/composables/useSharedData'
import KadenaIcon from '~/components/icon/Kadena.vue'
import UpperRightArrow from '~/components/icon/UpperRightArrow.vue'
import Coins from '~/components/icon/Coins.vue'
import Copy from '~/components/Copy.vue'
// Removed inline chain navigation controls
import AccountTransactions from '~/components/account/AccountTransactions.vue'
import AccountTokenTransfers from '~/components/account/AccountTokenTransfers.vue'
import AccountNFTTransfers from '~/components/account/AccountNFTTransfers.vue'
import AccountAssets from '~/components/account/AccountAssets.vue'
import TokenHoldings from '~/components/account/TokenHoldings.vue'
import { useAccountBalances } from '~/composables/useAccountBalances'
import { transformRawBalances } from '~/composables/balances'
import { useFormat } from '~/composables/useFormat'
import QrIcon from '~/components/icon/Qr.vue'
import Tooltip from '~/components/Tooltip.vue'
import QrModal from '~/components/qr/Modal.vue'
import Select from '~/components/Select.vue'
import AddressIdenticon from '~/components/avatar/AddressIdenticon.vue'

definePageMeta({
  layout: 'app',
  middleware: ['sanitize-chain'],
})

const { isMobile } = useScreenSize()
const route = useRoute()

// Get address from route params
const address = computed(() => route.params.address as string)

// Use composables
const { 
  accountData, 
  accountLoading, 
  transfersLoading,
  firstTransaction,
  lastTransaction,
  fetchAccount,
  fetchFirstAndLastTransfers,
  clearState: clearAccountState,
} = useAccount()
const { fetchKadenaPrice } = useBinance()
const { selectedNetwork } = useSharedData()
const { truncateAddress, formatKda } = useFormat()
const { fetchAccountNFTs, startMetadataQueue } = useAccountNFTs()

// Reactive state for KDA price and time updates
const kdaPrice = ref<number>(0)
const isHydrated = ref(false)

// Computed properties for time formatting
const firstTransactionTimeAgo = computed(() => {
  if (!firstTransaction.value?.creationTime) return 'N/A'
  const time = new Date().value
  const distance = formatDistanceToNowStrict(new Date(firstTransaction.value.creationTime), { addSuffix: true })
  return distance.replace(' seconds', ' secs').replace(' second', ' sec')
})

const lastTransactionTimeAgo = computed(() => {
  if (!lastTransaction.value?.creationTime) return 'N/A'
  const time = new Date().value 
  const distance = formatDistanceToNowStrict(new Date(lastTransaction.value.creationTime), { addSuffix: true })
  return distance.replace(' seconds', ' secs').replace(' second', ' sec')
})

// Computed values based on real data
const account = computed(() => {
  if (!accountData.value) {
    return {
      address: address.value,
      kdaBalance: '0',
      kdaValue: '0',
      kdaPrice: kdaPrice.value.toFixed(2),
      tokenHoldings: '0',
      tokenCount: '0',
      lastTransactionCreationTime: null,
      firstTransactionCreationTime: null,
      fundedBy: null,
      height: null,
      chainId: null,
      multichainPortfolio: '0',
      guards: []
    }
  }

  const data = accountData.value
  const totalBalance = data.totalBalance || 0
  // Validate chain from URL param
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  const isValidChain = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19

  // Build guards from chainAccounts
  const allGuards = (data.chainAccounts?.map((chainAccount: any) => ({
    chainId: chainAccount.chainId,
    predicate: chainAccount.guard?.predicate || 'N/A',
    keys: (Array.isArray(chainAccount.guard?.keys) && chainAccount.guard?.keys.length > 0)
      ? chainAccount.guard.keys
      : ["N/A"]
  })) || []) as Array<{ chainId: number | string; predicate: string; keys: string[] }>

  // Select chain-specific balance and guard if a valid chain is present
  let displayBalance = totalBalance
  // Only show guards when a specific valid chain is selected
  let guardsForView: typeof allGuards = []
  let displayChainId: string | null = null

  if (isValidChain) {
    const chainAccount = (data.chainAccounts || []).find((c: any) => `${c.chainId}` === `${n}`)
    if (chainAccount) {
      displayBalance = Number(chainAccount.balance || 0)
      guardsForView = [{
        chainId: chainAccount.chainId,
        predicate: chainAccount.guard?.predicate || 'N/A',
        keys: (Array.isArray(chainAccount.guard?.keys) && chainAccount.guard?.keys.length > 0)
          ? chainAccount.guard.keys
          : ["N/A"]
      }]
      displayChainId = `${chainAccount.chainId}`
    } else {
      // No data for that chain: show 0 balance and no guards
      displayBalance = 0
      guardsForView = []
      displayChainId = `${n}`
    }
  }

  const kdaValue = displayBalance * kdaPrice.value

      
  return {
    address: data.accountName || address.value,
    kdaBalance: formatKda(displayBalance, 12),
    kdaValue: kdaValue.toFixed(2),
    kdaPrice: kdaPrice.value.toFixed(2),
    tokenHoldings: '0', // Will be implemented later
    tokenCount: '0', // Will be implemented later
    lastTransactionCreationTime: lastTransactionTimeAgo.value || null,
    firstTransactionCreationTime: firstTransactionTimeAgo.value || null,
    fundedBy: firstTransaction.value?.fundedBy || null,
    height: firstTransaction.value?.height === 0 ? '0' : firstTransaction.value?.height || null,
    chainId: displayChainId ?? (firstTransaction.value?.chainId === 0 ? '0' : firstTransaction.value?.chainId || null),
    multichainPortfolio: kdaValue.toFixed(2),
    guards: guardsForView
  }
})

// Fetch KDA price on mount
onMounted(async () => {
  isHydrated.value = true
  try {
    const priceData = await fetchKadenaPrice()
    if (priceData?.data?.price) {
      kdaPrice.value = parseFloat(priceData.data.price)
    }
  } catch (error) {
    console.error('Failed to fetch KDA price:', error)
  }
})

// Reset cached state when switching to a different account or leaving the page
watch(
  () => address.value,
  (newAddr, oldAddr) => {
    if (newAddr && oldAddr && newAddr !== oldAddr) {
      clearAccountState()
      clearBalancesState()
    }
  }
)

onUnmounted(() => {
  clearAccountState()
  clearBalancesState()
})

// Watch for network changes and address changes to fetch account data
watch(
  [selectedNetwork, address],
  async ([network, addr]) => {
    if (network && addr) {
      await fetchAccount({
        networkId: network.id,
        accountName: addr
      })
      // Prefetch NFTs and start metadata processing in the background
      await fetchAccountNFTs({
        networkId: network.id,
        accountName: addr
      })
      startMetadataQueue(addr)
    }
  },
  { immediate: true }
)

// Watch for chainId in URL to fetch chain-specific transfers (first/last/funded by)
watch(
  [selectedNetwork, address, () => route.query.chain, accountData],
  async ([network, addr, chainId]) => {
    if (!network || !addr || !accountData.value) return;
    const q = typeof chainId === 'string' ? chainId : undefined
    const n = q !== undefined ? parseInt(q, 10) : undefined
    const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
    const chainParam = isValid ? q : undefined
    await fetchFirstAndLastTransfers({ networkId: network.id, accountName: addr, chainId: chainParam })
  }
)

// Tab management - similar to pages/transactions/[requestKey].vue
const activeTab = ref('assets')

const tabLabels = computed(() => [
  'Transactions',
  'Token Transfers', 
  'NFT Transfers'
])

const tabs = computed(() => [
  { id: 'assets', label: 'Assets' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'token-transfers', label: 'Token Transfers' },
  { id: 'nft-transfers', label: 'NFT Transfers' },
])

// Current guard for selected chain (if any)
const currentGuard = computed(() => {
  const guards = account.value.guards || []
  return guards.length > 0 ? guards[0] : null
})

useHead({
  title: 'Account'
})

// QR modal state
const isQrOpen = ref(false)
const openQr = () => { isQrOpen.value = true }
const closeQr = () => { isQrOpen.value = false }

// Loading helpers
const isOverviewLoading = computed(() => accountLoading.value)
const isPriceLoading = computed(() => {
  const balanceNumeric = parseFloat(account.value.kdaBalance)
  const hasPositiveBalance = !Number.isNaN(balanceNumeric) && balanceNumeric > 0
  return accountLoading.value || (kdaPrice.value === 0 && hasPositiveBalance)
})
const isTransfersLoading = computed(() => accountLoading.value || transfersLoading.value)

// SSR-friendly gates to avoid N/A flash before hydration
const showOverviewLoading = computed(() => !isHydrated.value || isOverviewLoading.value)
const showPriceLoading = computed(() => !isHydrated.value || isPriceLoading.value)
const showTransfersLoading = computed(() => !isHydrated.value || isTransfersLoading.value)

// Display helpers
const displayKdaBalance = computed(() => {
  const numeric = parseFloat(account.value.kdaBalance)
  if (Number.isNaN(numeric)) return account.value.kdaBalance
  return numeric === 0 ? '0.0' : account.value.kdaBalance
})

// Show per-KDA price only when total KDA value is greater than 0
const shouldShowPerKda = computed(() => {
  const value = parseFloat(account.value.kdaValue)
  return !Number.isNaN(value) && value > 0
})

// Dynamic component + KeepAlive to persist table state across tab switches
const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'transactions':
      return AccountTransactions
    case 'token-transfers':
      return AccountTokenTransfers
    case 'nft-transfers':
      return AccountNFTTransfers
    case 'assets':
      return AccountAssets
    default:
      return AccountTransactions
  }
})

const activeProps = computed(() => {
  if (activeTab.value === 'transactions') {
    return { accountName: address.value }
  }
  return { address: address.value }
})

  // Overview chain label: "All" when no chain selected, otherwise the chain id
  const overviewChainLabel = computed(() => {
    const q = route.query.chain as string | undefined
    if (q === undefined) return 'Showing All Chains'
    const n = parseInt(q, 10)
    const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
    return isValid ? `Showing Chain ${n}` : 'Showing All Chains'
  })

// Multichain Select helpers
const multichainLabel = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
  return isValid ? `Chain ${n}` : 'All Chains'
})

const selectedChainSelect = computed({
  get() {
    const q = route.query.chain as string | undefined
    const n = q !== undefined ? parseInt(q, 10) : undefined
    const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
    // Compute dollar value for the selected chain or total
    const allChains = accountData.value?.chainAccounts || []
    if (!isValid) {
      const totalBalance = allChains.reduce((acc: number, c: any) => acc + Number(c.balance || 0), 0)
      const totalValue = (totalBalance * kdaPrice.value).toFixed(2)
      return { label: `$${totalValue} (All Chains)`, value: null }
    }
    const chainAccount = allChains.find((c: any) => `${c.chainId}` === `${n}`)
    const balance = Number(chainAccount?.balance || 0)
    const value = (balance * kdaPrice.value).toFixed(2)
    return { label: `$${value} (Chain ${n})`, value: `${n}` }
  },
  set(val: any) {}
})

const chainSelectOptions = computed(() => {
  const opts: Array<{ label: string; value: any }> = []
  const set = new Set<string>()
  const arr = accountData.value?.chainAccounts || []
  const totalBalance = arr.reduce((acc: number, c: any) => acc + Number(c.balance || 0), 0)
  const totalValue = (totalBalance * kdaPrice.value).toFixed(2)
  opts.push({ label: `$${totalValue} (All Chains)`, value: null })
  for (const c of arr) {
    const id = `${c.chainId}`
    if (!set.has(id)) {
      set.add(id)
      const balance = Number(c.balance || 0)
      const value = (balance * kdaPrice.value).toFixed(2)
      opts.push({ label: `$${value} (Chain ${id})`, value: id })
    }
  }
  return opts
})

const onChangeChainSelect = (option: any) => {
  const query = { ...route.query }
  delete (query as any).chainId
  if (!option || option.value === null) {
    delete query.chain
  } else {
    ;(query as any).chain = option.value
  }
  navigateTo({ query }, { replace: true })
}

// Balances fetching and computed views
const {
  balances: rawBalances,
  loading: balancesLoading,
  fetchAccountBalances,
  clearState: clearBalancesState,
} = useAccountBalances()

const aggregatedBalances = computed(() => {
  // transformRawBalances expects an object with allBalances.nodes like in legacy
  // We adapt our shape to match it
  const nodes = (rawBalances.value || []).map((n: any) => ({
    balance: n.balance,
    chainId: n.chainId,
    module: n.module,
  }))
  return transformRawBalances({ prices: null, allBalances: { nodes } })
})

const overviewAssetsList = computed(() => {
  // Flat list for dropdown: show module, chainId and amount (no $)
  return (rawBalances.value || []).map((n: any) => ({
    module: n.module,
    chainId: n.chainId,
    amount: n.balance,
  }))
})

const showAssetsMenu = ref(false)

// Fetch balances once for all chains; do not refetch on chain filter changes
watch(
  [selectedNetwork, address],
  async ([network, addr]) => {
    if (!network || !addr) return
    await fetchAccountBalances({ networkId: network.id, accountName: addr })
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-[#222222] mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <AddressIdenticon :address="address" class="w-6 h-6 rounded-full" />
          <h1 class="text-[19px] font-semibold leading-[150%] text-[#f5f5f5]">Account</h1>
        </div>
        <div class="flex flex-col md:flex-row md:items-center md:gap-3">
          <div class="text-[15px] text-[#f5f5f5] break-all">{{ address }}</div>
          <div class="flex items-center gap-3 pt-2 md:pt-0">
            <Copy 
              :value="address" 
              tooltipText="Copy Address"
              iconSize="h-5 w-5"
              buttonClass="w-5 h-5"
              placement="bottom"
            />
            <Tooltip value="Show QR" placement="bottom">
              <button
                class="rounded-lg place-items-center grid group w-5 h-5 relative -top-[3px]"
                @click.prevent="openQr"
                aria-label="Show address QR"
              >
                <QrIcon class="text-[#888888] group-hover:text-kadscan-400" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <!-- Card 1: Overview -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#f5f5f5] font-semibold mb-4">
          Overview <span class="text-[#bbbbbb] font-normal">— {{ overviewChainLabel }}</span>
        </h3>
        <div class="flex-1 flex flex-col justify-between gap-4">
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">KDA BALANCE</div>
            <div class="flex items-center gap-1">
              <KadenaIcon class="w-4 h-4 text-[#bbbbbb]" />
              <span v-if="showOverviewLoading" class="text-[14px] text-[#888888] animate-pulse">Loading...</span>
              <span v-else class="text-[14px] text-[#f5f5f5]">{{ displayKdaBalance }} KDA</span>
            </div>
          </div>
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">KDA VALUE</div>
            <div class="text-[#f5f5f5] text-[14px]">
              <span v-if="showPriceLoading" class="text-[#888888] animate-pulse">Loading...</span>
              <span v-else>
                ${{ account.kdaValue }}
                <template v-if="shouldShowPerKda"> (${{ account.kdaPrice }}/KDA)</template>
              </span>
            </div>
          </div>
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">TOKEN HOLDINGS</div>
            <TokenHoldings
              :loading="balancesLoading"
              :balances="rawBalances"
              @view-all-assets="() => { activeTab = 'assets' }"
            />
          </div>
        </div>
      </div>

      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#f5f5f5] font-semibold mb-4">More Info</h3>
        <div class="space-y-4">
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">TRANSACTIONS SENT</div>
            <div class="space-y-1">
              <div class="flex items-center">
                <span class="text-[#bbb] text-[14px] mr-1">Latest:</span>
                <template v-if="showTransfersLoading">
                  <span class="text-[#888888] text-[14px] animate-pulse">Loading...</span>
                </template>
                <template v-else>
                  <NuxtLink 
                    v-if="lastTransaction?.requestKey" 
                    :to="`/transactions/${lastTransaction.requestKey}`"
                    class="text-[#6AB5DB] text-[14px] hover:text-[#9ccee7] transition-colors"
                  >
                    {{ account.lastTransactionCreationTime }}
                  </NuxtLink>
                  <span v-else class="text-[#bbb] text-[14px]">N/A</span>
                </template>

                <span class="text-[#bbb] text-[14px] mr-1 ml-4">First:</span>
                <template v-if="showTransfersLoading">
                  <span class="text-[#888888] text-[14px] animate-pulse">Loading...</span>
                </template>
                <template v-else>
                  <NuxtLink 
                    v-if="firstTransaction?.requestKey" 
                    :to="`/transactions/${firstTransaction.requestKey}`"
                    class="text-[#6AB5DB] text-[14px] hover:text-[#9ccee7] transition-colors"
                  >
                    {{ account.firstTransactionCreationTime }}
                  </NuxtLink>
                  <span v-else class="text-[#bbb] text-[14px]">N/A</span>
                </template>
              </div>
            </div>
          </div>
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">FUNDED BY</div>
            <div class="flex flex-col gap-1">
              <template v-if="showTransfersLoading">
                <span class="text-[#888888] text-[14px] animate-pulse">Loading...</span>
              </template>
              <template v-else>
                <template v-if="account.fundedBy">
                  <NuxtLink 
                    :to="`/account/${account.fundedBy}`"
                    class="text-[#6AB5DB] hover:text-[#9ccee7] text-[14px]"
                  >
                    {{ truncateAddress(account.fundedBy, 10, 10) }}
                  </NuxtLink>
                  <div class="text-[14px] text-[#bbb]">
                    <span>At Height </span>
                    <NuxtLink 
                      :to="`/blocks/${account.height}/chain/${account.chainId}`"
                      class="text-[#6AB5DB] hover:text-[#9ccee7]"
                    >
                      {{ account.height }}
                    </NuxtLink>
                    <span> and Chain ID </span>
                    <NuxtLink
                      :to="`/blocks?chain=${account.chainId}`"
                      class="text-[#6AB5DB] hover:text-[#9ccee7]"
                    >
                      {{ account.chainId }}
                    </NuxtLink>
                  </div>
                </template>
                <span v-else class="text-[#bbb] text-[14px]">N/A</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#f5f5f5] font-semibold mb-4">Multichain Info</h3>
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
                <Coins class="w-4 h-4 text-[#f5f5f5]" />
                <span class="text-[#f5f5f5] text-[14px]">
                  ${{ account.multichainPortfolio }}
                  <span class="text-[#bbbbbb] text-[13px]">({{ multichainLabel }})</span>
                </span>
              </div>
            </Select>
          </div>
          
          <!-- Guards Information for selected chain only -->
          <div v-if="currentGuard">
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-2">GUARDS</div>
            <div class="bg-[#222222] border border-[#333333] rounded-lg p-3">
              <div class="grid grid-cols-4 gap-4">
                <!-- Predicate Column (1/4) -->
                <div class="col-span-1">
                  <div class="text-[13px] text-[#bbbbbb] font-medium mb-2">Predicate:</div>
                  <div class="text-[14px] text-[#f5f5f5] font-mono">{{ currentGuard.predicate }}</div>
                </div>
                
                <!-- Keys Column (3/4) -->
                <div class="col-span-3">
                  <div class="text-[13px] text-[#bbbbbb] font-medium mb-2">Keys:</div>
                  <div class="space-y-1">
                    <div 
                      v-for="(key, index) in currentGuard.keys" 
                      :key="index"
                      class="flex items-center gap-2"
                    >
                      <span class="text-[13px] text-[#f5f5f5] font-mono break-all">{{ key }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex items-center justify-between mb-4 overflow-x-auto">
      <div class="flex items-center gap-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-3 py-1 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id 
              ? 'bg-[#009367] text-[#f5f5f5]' 
              : 'bg-[#252525] text-[#f5f5f5] hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content with KeepAlive to persist table state across tab switches -->
    <div class="mb-6">
      <KeepAlive include="AccountTransactions,AccountTokenTransfers,AccountNFTTransfers,AccountAssets">
        <component :is="activeComponent" v-bind="activeProps" />
      </KeepAlive>
    </div>

    <!-- QR Modal -->
    <QrModal :isOpen="isQrOpen" :address="address" @close="closeQr" />
  </div>
</template>
