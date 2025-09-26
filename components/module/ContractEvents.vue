<script setup lang="ts">
import { ref, watch, computed, onMounted, reactive } from 'vue'
import IconDownload from '~/components/icon/Download.vue'
import Tooltip from '~/components/Tooltip.vue'
import Copy from '~/components/Copy.vue'
import PaginationControls from '~/components/PaginationControls.vue'
import Select from '~/components/Select.vue'
import SkeletonTable from '~/components/skeleton/Table.vue'
import IconEnlarge from '~/components/icon/Enlarge.vue'
import LabelValue from '~/components/LabelValue.vue'
import { exportableToCsv, downloadCSV } from '~/composables/useCSV'
import { formatJsonPretty } from '~/composables/useString'
import { useSharedData } from '~/composables/useSharedData'
import { useContractEvents } from '~/composables/useContractEvents'
import { useStatus } from '~/composables/useStatus'
import { useBlocks } from '~/composables/useBlocks'
import StatusBadge from '~/components/StatusBadge.vue'
import IconHourglass from '~/components/icon/Hourglass.vue'
import { useScreenSize } from '~/composables/useScreenSize'

defineOptions({ name: 'ContractEvents' })

const props = defineProps<{
  modulename?: string
}>()

const route = useRoute()
const { selectedNetwork } = useSharedData()
const { isMobile } = useScreenSize()

const {
  events,
  loading,
  fetchContractEvents,
  pageInfo,
  totalCount,
  rowsToShow,
  updateRowsToShow,
  clearState: clearEventsState,
} = useContractEvents()

const rowOptions = [
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
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
  if (!events.value || loading.value || !totalCount.value) return ''
  const itemsBefore = (currentPage.value - 1) * rowsToShow.value
  const remaining = Math.max(totalCount.value - itemsBefore, 0)
  const pageCount = Math.min(rowsToShow.value, remaining)
  const newestIndex = totalCount.value - itemsBefore
  const oldestIndex = Math.max(newestIndex - pageCount + 1, 1)
  const formattedNewest = new Intl.NumberFormat().format(newestIndex)
  const formattedOldest = new Intl.NumberFormat().format(oldestIndex)
  return `Showing events between #${formattedOldest} to #${formattedNewest}`
})
// Status computation per event (replaces eventStatus)
const { lastBlockHeight, fetchLastBlockHeight } = useBlocks()
const { transactionStatus: computeTxStatus } = useStatus(lastBlockHeight)
const eventTransactionStatus = (ev: any) => {
  return computeTxStatus(ev?.height, ev?.canonical, ev?.badResult)
}

onMounted(() => {
  if (selectedNetwork.value?.id) {
    fetchLastBlockHeight({ networkId: selectedNetwork.value.id })
  }
})

// Labels and descriptions to standardize with LabelValue
const textContent = {
  requestKey: {
    label: 'Request Key:',
    description: 'Request Key is a unique identifier that is generated whenever a transaction is executed.',
  },
  qualifiedEventName: {
    label: 'Qualified Event Name:',
    description: 'Fully qualified name of the event including its module namespace.',
  },
  otherAttributes: {
    label: 'Other Attributes:',
    description: 'Other data related to this event such as block height, chain and time.',
  },
  parameters: {
    label: 'Parameters:',
    description: 'Event parameters emitted by the contract.',
  },
} as const

// Expand/collapse logic (mirror Logs.vue naming)
const expandedById = reactive<Record<string, boolean>>({})
function isExpanded(id: string): boolean {
  return !!expandedById[id]
}
function toggleExpand(id: string) {
  expandedById[id] = !expandedById[id]
}
function makeEventKey(edge: any, index: number): string {
  const rk = edge?.requestKey ?? ''
  const nm = edge?.name ?? ''
  return `${rk}:${nm}:${index}`
}

// Initial load behaviors
onMounted(() => {
  clearEventsState()
})

// React to network/module/chain changes
watch([selectedNetwork, () => props.modulename, () => route.query.chain], async ([network], [oldNetwork, oldModule, oldChain]) => {
  if (!network || !props.modulename) return

  const networkChanged = !oldNetwork || network.id !== oldNetwork.id
  const moduleChanged = props.modulename !== oldModule
  const chainChanged = !!oldChain && route.query.chain !== oldChain

  if (networkChanged || moduleChanged || chainChanged) {
    clearEventsState()
    currentPage.value = 1
    const params: { networkId: string; moduleName: string; chainId?: string } = {
      networkId: network.id,
      moduleName: props.modulename,
    }
    const chain = route.query.chain as string | undefined
    if (chain !== undefined) params.chainId = chain
    await fetchContractEvents(params)
    loadingPage.value = false
  }
}, { immediate: true })

// React to rows-per-page change
watch(rowsToShow, async (newRows, oldRows) => {
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  if (newRows === oldRows) return
  currentPage.value = 1
  const params: { networkId: string; moduleName: string; chainId?: string } = {
    networkId: network.id,
    moduleName: props.modulename,
  }
  const chain = route.query.chain as string | undefined
  if (chain !== undefined) params.chainId = chain
  await fetchContractEvents(params)
  loadingPage.value = false
})

// React to page change
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value
  if (!network || !props.modulename) return
  if (!newPage || newPage === oldPage) return

  const params: { networkId: string; moduleName: string; after?: string; before?: string; toLastPage?: boolean; chainId?: string } = {
    networkId: network.id,
    moduleName: props.modulename,
  }
  const chain = route.query.chain as string | undefined
  if (chain !== undefined) params.chainId = chain

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

  await fetchContractEvents(params)
  loadingPage.value = false
})

// CSV download
const tableHeaders = [
  { key: 'requestKey', label: 'Request Key' },
  { key: 'qualifiedName', label: 'Qualified Event Name' },
  { key: 'height', label: 'Block' },
  { key: 'chainId', label: 'Chain' },
  { key: 'time', label: 'Time' },
  { key: 'parameterText', label: 'Parameter Text' },
]

function downloadData() {
  const rows = (events.value || []).map((it: any) => ({
    ...it,
    time: it?.timeUtc || it?.time,
  }))
  const csv = exportableToCsv(rows, tableHeaders)
  downloadCSV(csv, `kadena-contract-events-page-${currentPage.value}.csv`)
}
</script>

<template>
  <!-- Show only the skeleton while loading -->
  <SkeletonTable v-if="loading" />
  <div v-else class="bg-surface-primary border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
    <!-- Header (DataTable-like) -->
    <div class="flex justify-between mb-4 flex-col md:flex-row gap-y-2 items-start md:items-center">
      <div>
        <h2 v-if="loading" class="text-[15px] text-normal text-[#f5f5f5]">
          Loading...
        </h2>
        <h2 v-else class="text-[15px] text-normal text-[#f5f5f5]">
          Total of {{ new Intl.NumberFormat('en-US').format(totalCount || 0) }} events in chain {{ route.query.chain }}
        </h2>
        <p class="text-[13px] text-[#bbbbbb]">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-2 w-full md:w-fit justify-end">
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#f5f5f5] bg-surface-disabled border border-[#222222] rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          <span class="hidden md:inline">Download</span>
        </button>
        <PaginationControls
          :currentPage="currentPage"
          :totalPages="totalPages"
          :loadingPage="loadingPage"
          :has-next-page="pageInfo?.hasNextPage"
          :has-previous-page="pageInfo?.hasPreviousPage"
          v-model:currentPage="currentPage"
          v-model:loadingPage="loadingPage"
        />
      </div>
    </div>

    <!-- Body -->
    <div v-if="events && events.length > 0" class="flex flex-col gap-3">
        <div v-for="(ev, index) in events" :key="makeEventKey(ev, index)" class="bg-transparent border border-[#222222] rounded-lg p-3 flex flex-col gap-2">
          <!-- Row 1: Request Key -->
          <LabelValue :label="textContent.requestKey.label" :description="textContent.requestKey.description"
          tooltipPos="right"
          topAlign="true">
            <template #value>
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/transactions/${ev.requestKey}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ ev.requestKey }}</NuxtLink>
                <Copy 
                  v-if="!isMobile"
                  :value="ev.requestKey" 
                  tooltipText="Copy Transaction Request Key"
                  iconSize="h-5 w-5"
                  buttonClass="w-5 h-5"
                />
              </div>
            </template>
          </LabelValue>

          <!-- Row 2: Qualified Event Name -->
          <LabelValue :label="textContent.qualifiedEventName.label" :description="textContent.qualifiedEventName.description"
          tooltipPos="right"
          topAlign="true">
            <template #value>
              <div class="text-[#f5f5f5] text-[15px] break-all">{{ ev.qualifiedName }}</div>
            </template>
          </LabelValue>

          <!-- Row 3: Other Attributes -->
          <LabelValue :label="textContent.otherAttributes.label" :description="textContent.otherAttributes.description"
          tooltipPos="right"
          topAlign="true">
            <template #value>
              <div class="flex items-center gap-2 w-full flex-wrap">
                <StatusBadge :status="eventTransactionStatus(ev)" :tooltip="false" />
                <span v-if="ev.height !== undefined && ev.height !== null" class="px-2 py-1.5 rounded-md border border-[#444648] bg-surface-secondary text-[11px] font-semibold flex items-center leading-none">
                  <span class="text-[#bbbbbb]">Height:</span>
                  <NuxtLink :to="`/blocks/${ev.height}/chain/${ev.chainId}`" class="text-[#f5f5f5] ml-1 hover:underline">{{ ev.height }}</NuxtLink>
                </span>
                <span v-if="ev.chainId !== undefined && ev.chainId !== null" class="px-2 py-1.5 rounded-md border border-[#444648] bg-surface-secondary text-[11px] font-semibold flex items-center leading-none">
                  <span class="text-[#bbbbbb]">Chain:</span>
                  <span class="text-[#f5f5f5] ml-1">{{ ev.chainId }}</span>
                </span>
                <span v-if="ev.time" class="px-2 py-1.5 rounded-md border border-[#444648] bg-surface-secondary text-[11px] font-semibold flex items-center leading-none">
                  <span class="text-[#bbbbbb]">Time:</span>
                  <span class="text-[#f5f5f5] ml-1">{{ ev.time }}</span>
                </span>
                <button
                  @click="toggleExpand(makeEventKey(ev, index))"
                  class="ml-auto flex items-center justify-center w-7 h-7 text-[#f5f5f5] bg-surface-disabled border border-[#222222] rounded-md hover:bg-[#dadfe3] hover:text-[#000000] transition-colors active:bg-surface-disabled active:text-[#f5f5f5]"
                  aria-label="Enlarge parameters"
                >
                  <IconEnlarge class="w-4 h-4" />
                </button>
              </div>
            </template>
          </LabelValue>

          <!-- Row 4: Parameter Text (same model as Logs.vue) -->
          <LabelValue :label="textContent.parameters.label" :description="textContent.parameters.description" :topAlign="true"
          tooltipPos="right"
          topAlign="true">
            <template #value>
              <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
                <div v-if="ev.parameterText" class="w-full">
                  <div v-if="!isExpanded(makeEventKey(ev, index))"
                    class="grid w-full text-sm text-[#bbbbbb]
                           [&>textarea]:text-inherit
                           [&>textarea]:resize-none
                           [&>textarea]:[grid-area:1/1/2/2]"
                    >
                    <textarea
                      readonly
                      :value="formatJsonPretty(ev.parameterText)"
                      class="break-all w-full bg-surface-disabled border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-auto h-[110px] m-0"
                    ></textarea>
                  </div>
                  <div
                    v-else
                    class="grid w-full text-sm text-[#bbbbbb]
                           [&>textarea]:text-inherit
                           [&>textarea]:resize-none
                           [&>textarea]:overflow-hidden
                           [&>textarea]:[grid-area:1/1/2/2]
                           after:[grid-area:1/1/2/2]
                           after:whitespace-pre-wrap
                           after:invisible
                           after:content-[attr(data-cloned-val)_'_']
                           after:pb-2"
                    :data-cloned-val="formatJsonPretty(ev.parameterText)"
                  >
                    <textarea
                      readonly
                      :value="formatJsonPretty(ev.parameterText)"
                      class="break-all w-full bg-surface-disabled border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-hidden min-h-[110px]"
                    ></textarea>
                  </div>
                </div>
                <span v-else class="text-[#f5f5f5] text-xs">No parameters</span>
              </div>
            </template>
          </LabelValue>
        </div>

        <!-- Footer controls -->
        <div class="pt-1 flex items-center justify-end md:justify-between">
          <div class="hidden md:flex items-center gap-2">
            <span class="text-[15px] text-[#bbbbbb]">Show rows:</span>
            <div class="border border-[#222222] rounded-md">
              <Select
                :modelValue="selectedRowOption"
                v-model:modelValue="selectedRowOption"
                :items="rowOptions"
                position="bot-left"
                fontSize="12"
              />
            </div>
          </div>
          <PaginationControls
            :currentPage="currentPage"
            :totalPages="totalPages"
            :loadingPage="loadingPage"
            :has-next-page="pageInfo?.hasNextPage"
            :has-previous-page="pageInfo?.hasPreviousPage"
            v-model:currentPage="currentPage"
            v-model:loadingPage="loadingPage"
          />
        </div>
      </div>
      <div v-else class="bg-surface-primary border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
        <div class="flex flex-col items-center justify-center py-12">
          <img src="/empty/txs.png" alt="No events" class="w-24 h-24 mb-4 opacity-50" />
          <h3 class="text-[#f5f5f5] text-lg font-medium mb-2">No events yet</h3>
          <p class="text-[#bbbbbb] text-sm text-center">No events found for this contract.</p>
        </div>
      </div>
    
  </div>
</template>

<style>
.fix {
  overflow-wrap: anywhere
}
</style>


