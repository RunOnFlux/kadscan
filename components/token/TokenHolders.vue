<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
defineOptions({ name: 'TokenHolders' })
import IconDownload from '~/components/icon/Download.vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table.vue'
import Tooltip from '~/components/Tooltip.vue'
import Copy from '~/components/Copy.vue'
import { exportableToCsv, downloadCSV } from '~/composables/useCSV'
import { useTokenHolders } from '~/composables/useTokenHolders'
import { useSharedData } from '~/composables/useSharedData'
import { useAssetUsdPrices } from '~/composables/useAssetUsdPrices'
import { useFormat } from '~/composables/useFormat'

const props = defineProps<{ modulename?: string }>()

const route = useRoute()
const { selectedNetwork } = useSharedData()

const { holders, loading, pageInfo, rowsToShow, error, fetchTokenHolders, updateRowsToShow, clearState } = useTokenHolders()

// Prices utilities (USD per module and KDA/USD)
const { kdaUsdPrice, getUsdPerUnit, primeModules } = useAssetUsdPrices()
const { formatKda } = useFormat()

const tableHeaders = [
  { key: 'chainId', label: 'Chain', class: 'text-left' },
  { key: 'address', label: 'Address', class: 'text-left' },
  { key: 'amount', label: 'Amount', class: 'text-left' },
  { key: 'valueKda', label: 'Value (KDA)', class: 'text-left' },
  { key: 'valueUsd', label: 'Value (USD)', class: 'text-left' },
]

const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]

const currentPage = ref(1)
const loadingPage = ref(false)
const isInitialized = ref(false)

const selectedRowOption = computed({
  get: () => rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0],
  set: (value) => { if (value) updateRowsToShow(value) }
})

// Unknown total - keep at least 1 page
const totalPages = computed(() => 1)

const subtitle = computed(() => '')

const selectedChain = ref({ label: 'All', value: null as string | null })

const initChainFromUrl = () => {
  const q = route.query.chain as string | undefined
  if (q === undefined) return
  const n = parseInt(q, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  selectedChain.value = isValid ? { label: n.toString(), value: n.toString() } : { label: 'All', value: null }
}

// Initial fetch
onMounted(async () => {
  initChainFromUrl()
  clearState()
  const network = selectedNetwork.value
  if (network && props.modulename) {
    // Prime prices for this module in the background
    primeModules([props.modulename])
    loadingPage.value = true
    const params: { networkId: string; module: string; chainIds?: string[] } = {
      networkId: network.id,
      module: props.modulename,
    }
    if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string]
    await fetchTokenHolders(params)
    loadingPage.value = false
  }
  isInitialized.value = true
})

// Sync URL -> state
watch(() => route.query.chain, (q) => {
  const str = typeof q === 'string' ? q : undefined
  if (str === undefined) {
    selectedChain.value = { label: 'All', value: null }
    return
  }
  const n = parseInt(str, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  selectedChain.value = isValid ? { label: n.toString(), value: n.toString() } : { label: 'All', value: null }
})

// React to network, chain, or token change
watch([selectedNetwork, selectedChain, () => props.modulename], async ([network]) => {
  if (!isInitialized.value) return
  if (!network || !props.modulename) return
  currentPage.value = 1
  const params: { networkId: string; module: string; chainIds?: string[] } = {
    networkId: network.id,
    module: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string]
  // Ensure prices are primed when module/network/chain changes
  primeModules([props.modulename])
  loadingPage.value = true
  await fetchTokenHolders(params)
  loadingPage.value = false
})

// React to rows-per-page change (re-fetch first page)
watch(rowsToShow, async (newRows, oldRows) => {
  if (newRows === oldRows) return
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  currentPage.value = 1
  const params: { networkId: string; module: string; chainIds?: string[] } = {
    networkId: network.id,
    module: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string]
  await fetchTokenHolders(params)
  loadingPage.value = false
})

// Cursor-only navigation (unknown total)
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  if (!newPage || newPage === oldPage) return
  const params: { networkId: string; module: string; after?: string; before?: string; chainIds?: string[] } = {
    networkId: network.id,
    module: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string]
  const goingNext = newPage > oldPage
  const goingPrev = newPage < oldPage
  if (goingNext) params.after = pageInfo.value?.endCursor
  else if (goingPrev) params.before = pageInfo.value?.startCursor
  loadingPage.value = true
  await fetchTokenHolders(params)
  loadingPage.value = false
})

// Derived per-unit prices
const unitUsd = computed(() => (props.modulename ? getUsdPerUnit(props.modulename) : 0))
const unitKda = computed(() => {
  const usd = unitUsd.value || 0
  const kda = kdaUsdPrice.value || 0
  return kda > 0 ? usd / kda : 0
})

function valueKdaOf(balance: string | number | null | undefined): number | null {
  const amount = Number(balance || 0)
  if (!Number.isFinite(amount) || amount === 0) return amount === 0 ? 0 : null
  if (!unitKda.value || unitKda.value <= 0) return null
  return amount * unitKda.value
}

function valueUsdOf(balance: string | number | null | undefined): number | null {
  const amount = Number(balance || 0)
  if (!Number.isFinite(amount) || amount === 0) return amount === 0 ? 0 : null
  if (!unitUsd.value || unitUsd.value <= 0) return null
  return amount * unitUsd.value
}

function downloadData() {
  const rows = (displayHolders.value || []).map((h: any) => {
    const vKda = valueKdaOf(h.balance)
    const vUsd = valueUsdOf(h.balance)
    return {
      chainId: h.chainId,
      address: h.address,
      amount: formatKda(Number(h.balance || 0), 12),
      valueKda: vKda === null ? '-' : formatKda(Number(vKda), 12),
      valueUsd: vUsd === null ? '-' : Number(vUsd).toFixed(6),
    }
  })
  const csv = exportableToCsv(rows, tableHeaders)
  downloadCSV(csv, `kadena-token-holders-page-${currentPage.value}.csv`)
}

// Filtered holders: remove zero balance entries
const displayHolders = computed(() => {
  const list = holders.value || []
  return list.filter((h: any) => Number(h.balance || 0) > 0)
})
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else-if="displayHolders && displayHolders.length > 0"
      :headers="tableHeaders"
      :items="displayHolders"
      :totalItems="0"
      itemNamePlural="holders"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      v-model:loadingPage="loadingPage"
      :has-next-page="pageInfo?.hasNextPage"
      :has-previous-page="pageInfo?.hasPreviousPage"
      :unknownTotal="true"
      customTitle="Searching holders"
    >
      <template #chainId="{ item }">
        <span class="text-font-primary">{{ item.chainId }}</span>
      </template>
      <template #actions>
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-font-primary bg-surface-disabled border border-line-default rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-font-secondary" />
          <span class="hidden md:inline">Download</span>
        </button>
      </template>

      <template #address="{ item }">
        <div class="flex items-center min-w-0 w-full">
          <Tooltip :value="item.address" variant="hash">
            <NuxtLink :to="`/account/${item.address}`" class="text-link hover:text-link-hover truncate max-w-full">{{ item.address }}</NuxtLink>
          </Tooltip>
          <Copy :value="item.address" tooltipText="Copy Address" />
        </div>
      </template>

      <template #amount="{ item }">
        <div class="text-left text-font-primary">{{ formatKda(Number(item.balance || 0), 12) }}</div>
      </template>

      <template #valueKda="{ item }">
        <div class="text-left text-font-primary">
          <template v-if="valueKdaOf(item.balance) !== null">
            {{ formatKda(Number(valueKdaOf(item.balance)), 12) }}
          </template>
          <template v-else>-</template>
        </div>
      </template>

      <template #valueUsd="{ item }">
        <div class="text-left text-font-primary">
          <template v-if="valueUsdOf(item.balance) !== null">
            ${{ Number(valueUsdOf(item.balance)).toFixed(6) }}
          </template>
          <template v-else>-</template>
        </div>
      </template>
    </DataTable>

    <div v-else class="bg-surface-primary border border-line-default rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No holders" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-font-primary text-lg font-medium mb-2">No holders</h3>
        <p class="text-font-secondary text-sm text-center">
          No holders found for this token.
        </p>
      </div>
    </div>
  </div>
</template>


