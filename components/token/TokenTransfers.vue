<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
defineOptions({ name: 'TokenTransfers' })
import IconDownload from '~/components/icon/Download.vue'
import ArrowRight from '~/components/icon/ArrowRight.vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table.vue'
import FilterSelect from '~/components/FilterSelect.vue'
import Tooltip from '~/components/Tooltip.vue'
import Copy from '~/components/Copy.vue'
import { exportableToCsv, downloadCSV } from '~/composables/csv'
import { useTokenTransfers } from '~/composables/useTokenTransfers'
import { useSharedData } from '~/composables/useSharedData'
import { useFormat } from '~/composables/useFormat'
import { useAssetUsdPrices } from '~/composables/useAssetUsdPrices'

const props = defineProps<{
  modulename?: string
}>()

const route = useRoute()
const { selectedNetwork } = useSharedData()
const { truncateAddress } = useFormat()
const { getUsdPerUnit, primeModules } = useAssetUsdPrices()

// USD price per token unit for current modulename
const unitUsd = computed(() => (props.modulename ? getUsdPerUnit(props.modulename) : 0))

// Ensure price is primed when modulename changes
watch(() => props.modulename, (m) => { if (m) primeModules([m]) }, { immediate: true })

const {
  tokenTransfers,
  loading,
  pageInfo,
  totalCount,
  rowsToShow,
  error,
  fetchTokenTransfers,
  updateRowsToShow,
  clearState,
} = useTokenTransfers()

const tableHeaders = [
  { key: 'requestKey', label: 'Request Key' },
  { key: 'action', label: 'Action' },
  { key: 'height', label: 'Block' },
  { key: 'chainId', label: 'Chain' },
  { key: 'time', label: 'Age' },
  { key: 'sender', label: 'Sender' },
  { key: 'direction', label: '' },
  { key: 'receiver', label: 'Receiver' },
  { key: 'amount', label: 'Amount' },
  { key: 'usdValue', label: 'Value (USD)' },
]

const rowOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
]

const currentPage = ref(1)
const loadingPage = ref(false)
const isInitialized = ref(false)

const selectedRowOption = computed({
  get: () => rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0],
  set: (value) => { if (value) updateRowsToShow(value) }
})

const totalPages = computed(() => {
  if (!totalCount.value) return 1
  return Math.ceil(totalCount.value / rowsToShow.value)
})

const subtitle = computed(() => {
  if (!tokenTransfers.value || loading.value || !totalCount.value) return ''
  const itemsBefore = (currentPage.value - 1) * rowsToShow.value
  const remaining = Math.max(totalCount.value - itemsBefore, 0)
  const pageCount = Math.min(rowsToShow.value, remaining)
  const newestIndex = totalCount.value - itemsBefore
  const oldestIndex = Math.max(newestIndex - pageCount + 1, 1)
  const formattedNewest = new Intl.NumberFormat().format(newestIndex)
  const formattedOldest = new Intl.NumberFormat().format(oldestIndex)
  return `(Showing transfers between #${formattedOldest} to #${formattedNewest})`
})

const selectedChain = ref({ label: 'All', value: null as string | null })
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null as string | null }]
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() })
  }
  return options
})

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
    loadingPage.value = true
    const params: { networkId: string; fungibleName: string; chainId?: string } = {
      networkId: network.id,
      fungibleName: props.modulename,
    }
    if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string
    await fetchTokenTransfers(params)
    loadingPage.value = false
  }
  isInitialized.value = true
})

// Keep selectedChain in sync with URL
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

// 1) React to network, chain, or token change
watch([selectedNetwork, selectedChain, () => props.modulename], async ([network]) => {
  if (!isInitialized.value) return
  if (!network || !props.modulename) return
  currentPage.value = 1
  const params: { networkId: string; fungibleName: string; chainId?: string } = {
    networkId: network.id,
    fungibleName: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string
  loadingPage.value = true
  await fetchTokenTransfers(params)
  loadingPage.value = false
})

// 2) React to rows-per-page change
watch(rowsToShow, async (newRows, oldRows) => {
  if (newRows === oldRows) return
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  currentPage.value = 1
  const params: { networkId: string; fungibleName: string; chainId?: string } = {
    networkId: network.id,
    fungibleName: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string
  await fetchTokenTransfers(params)
  loadingPage.value = false
})

// 3) Page change
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  if (!newPage || newPage === oldPage) return
  const params: { networkId: string; fungibleName: string; after?: string; before?: string; toLastPage?: boolean; chainId?: string } = {
    networkId: network.id,
    fungibleName: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string
  if (newPage > oldPage) {
    params.after = pageInfo.value?.endCursor
  } else if (newPage < oldPage) {
    params.before = pageInfo.value?.startCursor
  }
  if (newPage === totalPages.value) {
    params.after = null as any
    params.before = null as any
    params.toLastPage = true
  }
  await fetchTokenTransfers(params)
  loadingPage.value = false
})

function downloadData() {
  const withUsd = (tokenTransfers.value || []).map((it: any) => {
    const amt = Number(it?.amount || 0)
    const val = Number.isFinite(amt) && unitUsd.value > 0 ? amt * unitUsd.value : 0
    return { ...it, usdValue: val > 0 ? `$${val}` : '', time: it?.timeUtc || it?.time }
  })
  const csv = exportableToCsv(withUsd, tableHeaders)
  downloadCSV(csv, `kadena-token-transfers-page-${currentPage.value}.csv`)
}
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else-if="tokenTransfers && tokenTransfers.length > 0"
      :headers="tableHeaders"
      :items="tokenTransfers"
      :totalItems="totalCount"
      itemNamePlural="transfers"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      v-model:loadingPage="loadingPage"
      :has-next-page="pageInfo?.hasNextPage"
      :has-previous-page="pageInfo?.hasPreviousPage"
    >
      <template #actions>
        <FilterSelect
          :modelValue="selectedChain"
          @update:modelValue="selectedChain = $event"
          :items="chainOptions"
          urlParamName="chain"
        />
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#f5f5f5] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          <span class="hidden md:inline">Download Page Data</span>
        </button>
      </template>

      <template #requestKey="{ item }">
        <div class="flex items-center">
          <Tooltip :value="item.requestKey" variant="hash">
            <NuxtLink :to="`/transactions/${item.requestKey}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.requestKey, 18, 0) }}</NuxtLink>
          </Tooltip>
          <Copy :value="item.requestKey" tooltipText="Copy Transaction Request Key" />
        </div>
      </template>
      <template #action="{ item }">
        <span class="px-2 py-1.5 rounded-md border border-[#292929] bg-[#151515] text-[11px] text-[#f5f5f5] font-normal inline-flex items-center justify-center leading-none w-[92px]">
          {{ item.action }}
        </span>
      </template>
      <template #height="{ item }">
        <span v-if="item.time === 0 || item.height === 0" class="text-[#f5f5f5]">Genesis</span>
        <NuxtLink v-else :to="`/blocks/${item.height}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.height }}</NuxtLink>
      </template>
      <template #sender="{ item }">
        <div class="flex items-center">
          <template v-if="item.sender === 'k:system'">
            <span class="text-[#f5f5f5]">k:system</span>
          </template>
          <template v-else-if="item.sender && item.sender !== 'N/A'">
            <Tooltip :value="item.sender" variant="hash">
              <NuxtLink :to="`/account/${item.sender}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.sender, 10, 10) }}</NuxtLink>
            </Tooltip>
            <Copy :value="item.sender" tooltipText="Copy Address" />
          </template>
          <span v-else class="text-[#f5f5f5]">NaN</span>
        </div>
      </template>
      <template #direction>
        <div class="flex items-center justify-center">
          <ArrowRight class="w-5 h-5 text-[#00a186]" />
        </div>
      </template>
      <template #receiver="{ item }">
        <div class="flex items-center">
          <template v-if="item.receiver === 'k:system'">
            <span class="text-[#f5f5f5]">k:system</span>
          </template>
          <template v-else-if="item.receiver && item.receiver !== 'N/A'">
            <Tooltip :value="item.receiver" variant="hash">
              <NuxtLink :to="`/account/${item.receiver}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.receiver, 10, 10) }}</NuxtLink>
            </Tooltip>
            <Copy :value="item.receiver" tooltipText="Copy Address" />
          </template>
          <span v-else class="text-[#f5f5f5]">NaN</span>
        </div>
      </template>
      <template #amount="{ item }">
        <div class="inline-flex items-center">
          <span class="text-[#f5f5f5]">{{ item.amount }}</span>
        </div>
      </template>
      <template #usdValue="{ item }">
        <div class="inline-flex items-center">
          <span class="text-[#f5f5f5]">
            <template v-if="unitUsd && Number(unitUsd) > 0">
              {{ `$${(Number(item.amount) * Number(unitUsd)).toLocaleString(undefined, { maximumFractionDigits: 2 })}` }}
            </template>
            <template v-else>
              N/A
            </template>
          </span>
        </div>
      </template>
    </DataTable>

    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No token transfers" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#f5f5f5] text-lg font-medium mb-2">No token transfers yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          This token hasn't had transfers yet.
        </p>
      </div>
    </div>
  </div>
</template>


