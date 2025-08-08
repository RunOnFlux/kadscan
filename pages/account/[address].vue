<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatDistanceToNowStrict } from 'date-fns'
import { useScreenSize } from '~/composables/useScreenSize'
import { useAccount } from '~/composables/useAccount'
import { useBinance } from '~/composables/useBinance'
import { useSharedData } from '~/composables/useSharedData'
import KadenaIcon from '~/components/icon/Kadena.vue'
import UpperRightArrow from '~/components/icon/UpperRightArrow.vue'
import Coins from '~/components/icon/Coins.vue'
import Copy from '~/components/Copy.vue'
import IconChevron from '~/components/icon/Chevron.vue'
import AccountTransactions from '~/components/account/AccountTransactions.vue'
import AccountTokenTransfers from '~/components/account/AccountTokenTransfers.vue'
import AccountNFTTransfers from '~/components/account/AccountNFTTransfers.vue'
import { useFormat } from '~/composables/useFormat'
import QrIcon from '~/components/icon/Qr.vue'
import QrModal from '~/components/qr/Modal.vue'

definePageMeta({
  layout: 'app',
})

const { isMobile } = useScreenSize()
const route = useRoute()

// Get address from route params
const address = computed(() => route.params.address as string)

// Use composables
const { 
  accountData, 
  chainAccount,
  loading: accountLoading, 
  transfersLoading,
  firstTransaction,
  lastTransaction,
  fetchAccount,
  fetchChainAccount,
} = useAccount()
const { fetchKadenaPrice } = useBinance()
const { selectedNetwork } = useSharedData()
const { truncateAddress } = useFormat()

// Reactive state for KDA price and time updates
const kdaPrice = ref<number>(0)
const isHydrated = ref(false)

// Computed properties for time formatting
const firstTransactionTimeAgo = computed(() => {
  console.log('firstTransaction', lastTransaction.value)
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
      totalTransactions: '0',
      badge: '0',
      guards: []
    }
  }

  const data = accountData.value
  const totalBalance = data.totalBalance || 0
  const kdaValue = totalBalance * kdaPrice.value

  // Extract unique guards information
  const guards = data.chainAccounts?.map((chainAccount: any) => ({
    chainId: chainAccount.chainId,
    predicate: chainAccount.guard?.predicate || 'N/A',
    keys: chainAccount.guard?.keys || []
  })) || []

  return {
    address: data.accountName || address.value,
    kdaBalance: totalBalance.toFixed(12),
    kdaValue: kdaValue.toFixed(2),
    kdaPrice: kdaPrice.value.toFixed(2),
    tokenHoldings: '0', // Will be implemented later
    tokenCount: '0', // Will be implemented later
    lastTransactionCreationTime: lastTransactionTimeAgo.value || null,
    firstTransactionCreationTime: firstTransactionTimeAgo.value || null,
    fundedBy: lastTransaction.value?.fundedBy || null,
    height: lastTransaction.value?.height === 0 ? '0' : lastTransaction.value?.height || null,
    chainId: lastTransaction.value?.chainId === 0 ? '0' : lastTransaction.value?.chainId || null,
    multichainPortfolio: kdaValue.toFixed(2),
    totalTransactions: '0', // Will be implemented later
    badge: '0', // Will be implemented later
    guards
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

// Watch for network changes and address changes to fetch account data
watch(
  [selectedNetwork, address],
  async ([network, addr]) => {
    if (network && addr) {
      await fetchAccount({
        networkId: network.id,
        accountName: addr
      })
    }
  },
  { immediate: true }
)

// Watch for chainId in URL to fetch chain-specific account info
watch(
  [selectedNetwork, address, () => route.query.chainId],
  async ([network, addr, chainId]) => {
    if (network && addr) {
      const id = typeof chainId === 'string' ? chainId : undefined
      if (id) {
        await fetchChainAccount({ networkId: network.id, accountName: addr, chainId: id })
      } else {
        // Clear chain specific when not provided
        // chainAccount is managed inside composable; nothing else to do
      }
    }
  },
  { immediate: true }
)

// Tab management - similar to pages/transactions/[requestKey].vue
const activeTab = ref('transactions')

const tabLabels = computed(() => [
  'Transactions',
  'Token Transfers', 
  'NFT Transfers'
])

const tabs = computed(() => [
  { id: 'transactions', label: 'Transactions' },
  { id: 'token-transfers', label: 'Token Transfers' },
  { id: 'nft-transfers', label: 'NFT Transfers' }
])

// Guard navigation
const currentGuardIndex = ref(0)

const currentGuard = computed(() => {
  if (!account.value.guards || account.value.guards.length === 0) {
    return null
  }
  return account.value.guards[currentGuardIndex.value]
})

const hasMultipleGuards = computed(() => {
  return account.value.guards && account.value.guards.length > 1
})

const nextGuard = () => {
  if (account.value.guards && currentGuardIndex.value < account.value.guards.length - 1) {
    currentGuardIndex.value++
  }
}

const prevGuard = () => {
  if (currentGuardIndex.value > 0) {
    currentGuardIndex.value--
  }
}

// Reset guard index when account data changes
watch(accountData, () => {
  currentGuardIndex.value = 0
})

useHead({
  title: `Account ${address.value} - Kadscan`
})

// QR modal state
const isQrOpen = ref(false)
const openQr = () => { isQrOpen.value = true }
const closeQr = () => { isQrOpen.value = false }

// Loading helpers
const isOverviewLoading = computed(() => !accountData.value || accountLoading.value)
const isPriceLoading = computed(() => isOverviewLoading.value || kdaPrice.value === 0)
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
</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-[#222222] mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <div class="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[#8B4513] to-[#A0522D] flex items-center justify-center">
            <div class="w-6 h-6 grid grid-cols-3 grid-rows-3 gap-0.5">
              <div class="bg-[#0066CC]"></div>
              <div class="bg-[#8B4513]"></div>
              <div class="bg-[#8B4513]"></div>
              <div class="bg-[#8B4513]"></div>
              <div class="bg-[#0066CC]"></div>
              <div class="bg-[#8B4513]"></div>
              <div class="bg-[#8B4513]"></div>
              <div class="bg-[#0066CC]"></div>
              <div class="bg-[#8B4513]"></div>
            </div>
          </div>
          <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">Account</h1>
        </div>
        <div class="flex flex-col md:flex-row md:items-center md:gap-3">
          <div class="text-[15px] text-[#f5f5f5] break-all">{{ address }}</div>
          <div class="flex items-center gap-3 pt-2 md:pt-0">
            <Copy 
              :value="address" 
              tooltipText="Copy Address"
              iconSize="h-5 w-5"
              buttonClass="w-5 h-5"
            />
            <button
              class="rounded-lg place-items-center grid group w-5 h-5"
              @click.prevent="openQr"
              aria-label="Show address QR"
            >
              <QrIcon class="text-[#888888] group-hover:text-kadscan-400" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <!-- Card 1: Overview -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col">
        <h3 class="text-[#fafafa] font-semibold mb-4">Overview</h3>
        <div class="flex-1 flex flex-col justify-between gap-4">
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">KDA BALANCE</div>
            <div class="flex items-center gap-1">
              <KadenaIcon class="w-4 h-4 text-[#bbbbbb]" />
              <span v-if="showOverviewLoading" class="text-[14px] text-[#888888] animate-pulse">Loading...</span>
              <span v-else class="text-[14px] text-[#fafafa]">{{ displayKdaBalance }} KDA</span>
            </div>
          </div>
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">KDA VALUE</div>
            <div class="text-[#fafafa] text-[14px]">
              <span v-if="showPriceLoading" class="text-[#888888] animate-pulse">Loading...</span>
              <span v-else>${{ account.kdaValue }} (${{ account.kdaPrice }}/KDA)</span>
            </div>
          </div>
          <div>
            <div class="text-[13px] text-[#bbbbbb] font-medium mb-1">TOKEN HOLDINGS</div>
            <div class="w-full">
              <button class="w-full px-3 py-2 rounded border border-[#222] bg-[#151515] text-[#fafafa] text-[14px] hover:bg-[#222] transition-colors flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span>${{ account.tokenHoldings }}</span><span class="text-[#bbbbbb] text-[13px]"> ({{ account.tokenCount }} Tokens)</span>
                </div>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
         
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col">
        <h3 class="text-[#fafafa] font-semibold mb-4">More Info</h3>
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
                    v-if="firstTransaction?.requestKey" 
                    :to="`/transactions/${firstTransaction.requestKey}`"
                    class="text-[#6AB5DB] text-[14px] hover:text-[#9ccee7] transition-colors"
                  >
                    {{ account.firstTransactionCreationTime }}
                  </NuxtLink>
                  <span v-else class="text-[#bbb] text-[14px]">N/A</span>
                </template>

                <span class="text-[#bbb] text-[14px] ml-4 mr-1">First:</span>
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
                      :to="`/blocks?chainId=${account.chainId}`"
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

      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col">
        <h3 class="text-[#fafafa] font-semibold mb-4">Multichain Info</h3>
        <div class="space-y-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222222] border border-[#333333]">
              <Coins class="w-4 h-4 text-white" />
              <span class="text-white text-[14px]">${{ account.multichainPortfolio }} (All Chains)</span>
            </div>
          </div>
          
          <!-- Guards Information -->
          <div v-if="currentGuard">
            <div class="flex items-center justify-between mb-2">
              <div class="text-[13px] text-[#bbbbbb] font-medium">GUARDS</div>
              <nav v-if="hasMultipleGuards" class="flex items-stretch gap-0.5" aria-label="Guard Navigation">
                <button
                  :disabled="currentGuardIndex === 0"
                  @click="prevGuard"
                  class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#111111] text-[13px] font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                >
                  <IconChevron class="h-4 w-4 transform rotate-180" />
                </button>
                <span class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-[13px] font-normal text-[#888888] cursor-default">
                  Chain {{ currentGuard.chainId }}
                </span>
                <button
                  :disabled="currentGuardIndex === account.guards.length - 1"
                  @click="nextGuard"
                  class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#111111] text-[13px] font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                >
                  <IconChevron class="h-4 w-4" />
                </button>
              </nav>
            </div>
            <div class="bg-[#222222] border border-[#333333] rounded-lg p-3">
              <div class="grid grid-cols-4 gap-4">
                <!-- Predicate Column (1/4) -->
                <div class="col-span-1">
                  <div class="text-[13px] text-[#bbbbbb] font-medium mb-2">Predicate:</div>
                  <div class="text-[14px] text-[#fafafa] font-mono">{{ currentGuard.predicate }}</div>
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
                      <span class="text-[13px] text-[#fafafa] font-mono break-all">{{ key }}</span>
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
              ? 'bg-[#0784c3] text-white' 
              : 'bg-[#222222] text-[#fafafa] hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mb-6">
      <AccountTransactions 
        v-if="activeTab === 'transactions'"
        :accountName="address"
      />
      
      <AccountTokenTransfers 
        v-else-if="activeTab === 'token-transfers'"
        :address="address"
      />
      
      <AccountNFTTransfers 
        v-else-if="activeTab === 'nft-transfers'"
        :address="address"
      />
    </div>

    <!-- QR Modal -->
    <QrModal :isOpen="isQrOpen" :address="address" @close="closeQr" />
  </div>
</template>
