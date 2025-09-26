<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import IconDownload from '~/components/icon/Download.vue'
import { useStatus } from '~/composables/useStatus'
import StatusBadge from '~/components/StatusBadge.vue'
import DataTable from '~/components/DataTable.vue'
import FilterSelect from '~/components/FilterSelect.vue'
import Tooltip from '~/components/Tooltip.vue'
import Copy from '~/components/Copy.vue'
import SkeletonTable from '~/components/skeleton/Table.vue'
import ColumnGas from '~/components/column/Gas.vue'
import { useContractTransactions } from '~/composables/useContractTransactions'
import { useFormat } from '~/composables/useFormat'
import { useSharedData } from '~/composables/useSharedData'
import { useScreenSize } from '~/composables/useScreenSize'
import { exportableToCsv, downloadCSV } from '~/composables/useCSV'
import { useBlocks } from '~/composables/useBlocks'

defineOptions({ name: 'ContractTransactions' })

const props = defineProps<{
  modulename?: string
}>()

const route = useRoute()
const { truncateAddress } = useFormat()
const { selectedNetwork } = useSharedData()
const { isMobile } = useScreenSize()

const {
  transactions,
  loading,
  fetchTransactionsByFungible,
  pageInfo,
  totalCount,
  rowsToShow,
  updateRowsToShow,
  clearState: clearTransactionsState,
} = useContractTransactions()

const {
  lastBlockHeight,
  fetchLastBlockHeight,
  error: blocksError,
  clearState: clearBlocksState,
} = useBlocks()

const selectedChain = ref({ label: 'All', value: null as string | null })
const isChainParamResolved = ref(false)
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null as string | null }]
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() })
  }
  return options
})

const initChainFromUrl = () => {
  const q = route.query.chain as string | undefined
  if (q === undefined) {
    isChainParamResolved.value = false
    return
  }
  const n = parseInt(q, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  if (isValid) {
    selectedChain.value = { label: n.toString(), value: n.toString() }
    isChainParamResolved.value = true
  } else {
    isChainParamResolved.value = false
  }
}

const tableHeaders = [
  { key: 'requestKey', label: 'Request Key' },
  { key: 'method', label: 'Method' },
  { key: 'height', label: 'Block' },
  { key: 'chainId', label: 'Chain' },
  { key: 'status', label: 'Status' },
  { key: 'time', label: 'Time' },
  { key: 'sender', label: 'Sender' },
  { key: 'gas', label: 'Gas' },
  { key: 'gasLimit', label: 'Gas Limit' },
  { key: 'fee', label: 'Fee' },
]

const rowOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
]

const currentPage = ref(1)
const loadingPage = ref(false)

const selectedRowOption = computed({
  get: () => rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0],
  set: (value) => {
    if (value) updateRowsToShow(value)
  },
})

const totalPages = computed(() => {
  if (!totalCount.value) return 1
  return Math.ceil(totalCount.value / rowsToShow.value)
})

const subtitle = computed(() => {
  if (!transactions.value || loading.value || !totalCount.value) return ''
  const itemsBefore = (currentPage.value - 1) * rowsToShow.value
  const remaining = Math.max(totalCount.value - itemsBefore, 0)
  const pageCount = Math.min(rowsToShow.value, remaining)
  const newestTxIndex = totalCount.value - itemsBefore
  const oldestTxIndex = Math.max(newestTxIndex - pageCount + 1, 1)
  const formattedNewest = new Intl.NumberFormat().format(newestTxIndex)
  const formattedOldest = new Intl.NumberFormat().format(oldestTxIndex)
  return `Showing transactions between #${formattedOldest} to #${formattedNewest}`
})

const { transactionStatus } = useStatus(lastBlockHeight)

const filteredTransactions = computed(() => {
  if (!transactions.value || !lastBlockHeight || !lastBlockHeight.value) return [] as any[]
  return transactions.value.filter((tx: any) => !(lastBlockHeight.value - 6 >= tx.height && !tx.canonical))
})

function getFeeInKda(item: any) {
  if (!item.gas || !item.rawGasPrice) return '0.0'
  const feeInKda = item.gas * item.rawGasPrice
  if (feeInKda === 0) return '0.0'
  const formattedFee = new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 12 }).format(feeInKda)
  return `${formattedFee}`
}

// Method formatters (same as transactions list)
const formatMethod = computed(() => (val?: string) => {
  if (!val || val === '-') return 'Transaction'
  const replaced = String(val).replace(/-/g, ' ')
  const titleCased = replaced.replace(/\b([a-zA-Z])/g, (m) => m.toUpperCase())
  return titleCased.length > 15 ? titleCased.slice(0, 15) + '...' : titleCased
})

const formatMethodFull = computed(() => (val?: string) => {
  if (!val || val === '-') return 'Transaction'
  const replaced = String(val).replace(/-/g, ' ')
  return replaced.replace(/\b([a-zA-Z])/g, (m) => m.toUpperCase())
})

onMounted(() => {
  initChainFromUrl()
  clearTransactionsState()
  clearBlocksState()
})

watch(() => route.query.chain, (q) => {
  const str = typeof q === 'string' ? q : undefined
  if (str === undefined) {
    isChainParamResolved.value = false
    return
  }
  const n = parseInt(str, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  if (!isValid) {
    isChainParamResolved.value = false
    return
  }
  selectedChain.value = { label: n.toString(), value: n.toString() }
  isChainParamResolved.value = true
})

watch(
  [selectedNetwork, selectedChain, () => props.modulename, isChainParamResolved],
  async ([network], [oldNetwork, oldChain, oldModule]) => {
    if (!isChainParamResolved.value) return
    if (!network || !props.modulename) return

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id
    const chainChanged = !!oldChain && selectedChain.value.value !== oldChain.value
    const moduleChanged = props.modulename !== oldModule

    if (networkChanged || chainChanged || moduleChanged) {
      clearTransactionsState()
      clearBlocksState()
      await fetchLastBlockHeight({ networkId: network.id })
      currentPage.value = 1
      const params: { networkId: string; fungibleName: string; chainId?: string } = {
        networkId: network.id,
        fungibleName: props.modulename,
      }
      if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string
      await fetchTransactionsByFungible(params)
      loadingPage.value = false
    }
  },
  { immediate: true },
)

watch(rowsToShow, async (newRows, oldRows) => {
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  if (!isChainParamResolved.value) return
  if (newRows === oldRows) return
  currentPage.value = 1
  const params: { networkId: string; fungibleName: string; chainId?: string } = {
    networkId: network.id,
    fungibleName: props.modulename,
  }
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string
  await fetchTransactionsByFungible(params)
  loadingPage.value = false
})

watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  if (!isChainParamResolved.value) return
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

  await fetchTransactionsByFungible(params)
  loadingPage.value = false
})

function downloadData() {
  const rows = (filteredTransactions.value || []).map((item: any) => {
    const statusText = transactionStatus(item.height, item.canonical, item.badResult)?.text || ''
    const feeInKda = (() => {
      if (!item?.gas || !item?.rawGasPrice) return '0.0'
      const fee = item.gas * item.rawGasPrice
      if (!Number.isFinite(fee) || fee === 0) return '0.0'
      const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 12 }).format(fee)
      return `${formatted}`
    })()
    return {
      ...item,
      time: item?.timeUtc || item?.time,
      status: statusText,
      fee: feeInKda,
      gasLimit: item?.rawGasLimit ?? item?.gasLimit ?? '',
    }
  })
  const csv = exportableToCsv(rows, tableHeaders)
  downloadCSV(csv, `kadena-contract-transactions-page-${currentPage.value}.csv`)
}
</script>

<template>
  <div>
    <SkeletonTable v-if="!isChainParamResolved || loading" />

    <DataTable
      v-else-if="isChainParamResolved && filteredTransactions && filteredTransactions.length > 0"
      :headers="tableHeaders"
      :items="filteredTransactions"
      :totalItems="totalCount"
      itemNamePlural="transactions"
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
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#f5f5f5] bg-surface-disabled border border-[#222222] rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          <span class="hidden md:inline">Download</span>
        </button>
      </template>

      <template #requestKey="{ item }">
        <div class="flex items-center">
          <Tooltip :value="item.requestKey" variant="hash">
            <NuxtLink :to="`/transactions/${item.requestKey}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.requestKey, 10, 10) }}</NuxtLink>
          </Tooltip>
          <Copy :value="item.requestKey" tooltipText="Copy Transaction Request Key" />
        </div>
      </template>
      <template #height="{ item }">
        <span v-if="item.time === 0 || item.height === 0" class="text-[#f5f5f5]">Genesis</span>
        <NuxtLink v-else :to="`/blocks/${item.height}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.height }}</NuxtLink>
      </template>
      <template #status="{ item }">
        <StatusBadge :status="transactionStatus(item.height, item.canonical, item.badResult)" />
      </template>
      <template #sender="{ item }">
        <div class="flex items-center">
          <template v-if="item.sender && item.sender !== 'N/A'">
            <Tooltip :value="item.sender" variant="hash">
              <NuxtLink :to="`/account/${item.sender}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.sender, 10, 10) }}</NuxtLink>
            </Tooltip>
            <Copy :value="item.sender" tooltipText="Copy Address" />
          </template>
          <span v-else-if="item.time === 0 || (item.sender === 'NaN' || !item.sender || item.sender === 'N/A')" class="text-[#f5f5f5]">Genesis</span>
          <span v-else class="text-[#f5f5f5]">NaN</span>
        </div>
      </template>
      <template #gas="{ item }">
        <ColumnGas :gas="item.gas" :gas-limit="item.rawGasLimit" />
      </template>
      <template #method="{ item }">
        <div class="flex items-center">
          <Tooltip :value="formatMethodFull(item.method)">
            <span class="px-2 py-1.5 bg-surface-disabled rounded-md border border-[#333333] text-[11px] text-[#f5f5f5] font-normal inline-flex items-center justify-center leading-none w-[120px]">
              {{ formatMethod(item.method) }}
            </span>
          </Tooltip>
        </div>
      </template>
      <template #fee="{ item }">
        <span class="text-[#f5f5f5]">{{ getFeeInKda(item) }}</span>
      </template>
    </DataTable>

    <!-- Empty state -->
    <div v-else class="bg-surface-primary border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No transactions" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#f5f5f5] text-lg font-medium mb-2">No transactions yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          This contract hasn't made any transactions yet.
        </p>
      </div>
    </div>
  </div>
</template>

