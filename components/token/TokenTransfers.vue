<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
defineOptions({ name: 'TokenTransfers' })
import IconDownload from '~/components/icon/Download.vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table.vue'
import FilterSelect from '~/components/FilterSelect.vue'
import { exportableToCsv, downloadCSV } from '~/composables/csv'

const props = defineProps<{
  token?: string
}>()

const route = useRoute()

const loading = ref(false)
const items = ref<Array<any>>([])
const totalCount = ref(0)
const pageInfo = ref<{ hasNextPage: boolean; hasPreviousPage: boolean } | null>(null)

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
]

const rowOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
]

const rowsToShow = ref(10)
const currentPage = ref(1)
const loadingPage = ref(false)

const selectedRowOption = computed({
  get: () => rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0],
  set: (value) => { if (value) rowsToShow.value = value.value }
})

const totalPages = computed(() => {
  if (!totalCount.value) return 1
  return Math.ceil(totalCount.value / rowsToShow.value)
})

const subtitle = computed(() => {
  if (!items.value || loading.value || !totalCount.value) return ''
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

onMounted(() => {
  initChainFromUrl()
})

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

function downloadData() {
  const csv = exportableToCsv(items.value, tableHeaders)
  downloadCSV(csv, `kadena-token-transfers-page-${currentPage.value}.csv`)
}
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else-if="items && items.length > 0"
      :headers="tableHeaders"
      :items="items"
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
    </DataTable>

    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No token transfers" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#f5f5f5] text-lg font-medium mb-2">No token transfers yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          Coming soon...
        </p>
      </div>
    </div>
  </div>
</template>


