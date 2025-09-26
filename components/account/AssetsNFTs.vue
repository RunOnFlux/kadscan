<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table5.vue'
import PreviewIcon from '~/components/icon/Preview.vue'
import IconDownload from '~/components/icon/Download.vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useSharedData } from '~/composables/useSharedData'
import Tooltip from '~/components/Tooltip.vue'
import Copy from '~/components/Copy.vue'
import { shortenString, sanitizeDisplayText } from '~/composables/useString'
import { exportableToCsv, downloadCSV } from '~/composables/useCSV'

const props = defineProps<{
  address: string
}>()

const headers = [
  { key: 'collection', label: 'Collection' },
  { key: 'name', label: 'Name' },
  { key: 'chain', label: 'Chain' },
  { key: 'tokenId', label: 'TokenId' },
  { key: 'preview', label: '' },
]

const { selectedNetwork } = useSharedData()
const { loading, hasFetched, nfts, metadataByKey, metadataErrors, fetchAccountNFTs, startMetadataQueue, clearState, setSelected } = useAccountNFTs()

// Track thumbnails that failed to load so we can show the IPFS label
const miniBroken = ref<Record<string, boolean>>({})

function keyForItem(item: any): string {
  const h = item?._holding
  if (h && h.chainId !== undefined && h.tokenId !== undefined) return `${h.chainId}:${h.tokenId}`
  if (item && item.chain !== undefined && item.tokenId !== undefined) return `${item.chain}:${item.tokenId}`
  return String(Math.random())
}

function isMiniBroken(item: any): boolean {
  const k = keyForItem(item)
  return !!miniBroken.value[k]
}

function markMiniBroken(item: any) {
  const k = keyForItem(item)
  miniBroken.value = { ...miniBroken.value, [k]: true }
}

const route = useRoute()

const chainFromQuery = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  return n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19 ? `${n}` : null
})

const sanitize = (input: any, maxLen = 200): string => sanitizeDisplayText(input, maxLen)

const flattenedRows = computed(() => {
  const arr = nfts.value || []
  const chain = chainFromQuery.value
  const filtered = chain === null ? arr : arr.filter(r => `${r.chainId}` === chain)
  return filtered.map(h => {
    const meta = metadataByKey.value[`${h.chainId}:${h.tokenId}`] || null
    const err = metadataErrors.value[`${h.chainId}:${h.tokenId}`] || null
    const name = sanitize(meta?.name || 'Unknown')
    const attrCollection = Array.isArray(meta?.attributes)
      ? (() => {
          const found = meta.attributes.find((a: any) =>
            typeof a?.trait_type === 'string' && a.trait_type.toLowerCase() === 'collection' && typeof a?.value === 'string' && a.value
          )
          return found ? found.value : null
        })()
      : null
    const rawCollection = (
      typeof meta?.collection === 'string' && meta?.collection
    ) ? meta.collection : (
      typeof meta?.collection_id === 'string' && meta?.collection_id
    ) ? meta.collection_id : (
      typeof attrCollection === 'string' && attrCollection
    ) ? attrCollection : (
      typeof meta?.creator === 'string' && meta?.creator
    ) ? meta.creator : 'Unknown'
    const collection = sanitize(rawCollection)
    return {
      preview: h,
      collection,
      name,
      chain: h.chainId,
      tokenId: h.tokenId,
      _image: meta?.image || null,
      _meta: meta,
      _metaErr: err,
      _holding: h,
    }
  })
})

const totalItems = computed(() => flattenedRows.value.length)

const rowOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
]

const currentPage = ref(1)
const rowsToShow = ref(10)
const selectedRowOption = computed({
  get: () => rowOptions.find(o => o.value === rowsToShow.value) || rowOptions[0],
  set: (val: any) => { if (val) rowsToShow.value = val.value },
})
const totalPages = computed(() => Math.max(Math.ceil(totalItems.value / rowsToShow.value), 1))

// Slice rows for the current page
const pageSlice = computed(() => {
  const start = (currentPage.value - 1) * rowsToShow.value
  const end = start + rowsToShow.value
  return flattenedRows.value.slice(start, end)
})

// Keep current page within range when page size changes
watch(rowsToShow, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

// Clamp when total pages changes (dataset/filter/tab switches)
watch(totalPages, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
})

const subtitle = computed(() => {
  if (totalItems.value === 0) return ''
  const first = (currentPage.value - 1) * rowsToShow.value + 1
  const last = Math.min(currentPage.value * rowsToShow.value, totalItems.value)
  return `Showing NFTs ${first}–${last}`
})

function downloadData() {
  const exportHeaders = headers.filter(h => h.key !== 'preview')
  const csv = exportableToCsv(pageSlice.value, exportHeaders)
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadCSV(csv, `nfts-page-${currentPage.value}-${ts}.csv`)
}

function openPreview(row: any) {
  if (row?._holding) setSelected(row._holding)
}

// Fetch on mount and when network/address changes
onMounted(async () => {
  const networkId = selectedNetwork.value?.id
  if (networkId && props.address) {
    await fetchAccountNFTs({ networkId, accountName: props.address })
    startMetadataQueue(props.address)
  }
})

watch(() => [selectedNetwork.value?.id, props.address], async ([networkId, address]) => {
  if (networkId && address) {
    await fetchAccountNFTs({ networkId, accountName: address })
    startMetadataQueue(address)
    currentPage.value = 1
  }
})

onBeforeUnmount(() => {
  clearState()
})
</script>

<template>
  <div>
    <SkeletonTable v-if="!hasFetched || loading" />
    <DataTable
      v-else-if="pageSlice && pageSlice.length > 0"
      :headers="headers"
      :items="pageSlice"
      :totalItems="totalItems"
      itemNamePlural="NFTs"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      :has-next-page="currentPage < totalPages"
      :has-previous-page="currentPage > 1"
      :showTopPagination="false"
      :preventHeaderWrap="true"
    >
      <template #actions>
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-font-primary bg-surface-disabled border border-line-default rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-font-secondary" />
          <span class="hidden md:inline">Download</span>
        </button>
      </template>
      <template #preview="{ item }">
        <button
          class="w-8 h-8 rounded-md border border-line-default grid place-items-center hover:bg-surface-secondary active:bg-surface-hover"
          @click.prevent="openPreview(item)"
        >
          <PreviewIcon class="opacity-60"/>
        </button>
      </template>
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <div class="relative w-8 h-8 rounded-md overflow-hidden bg-surface-secondary border border-line-default grid place-items-center">
            <img v-if="item._image && !isMiniBroken(item)" :src="item._image" alt="nft" class="w-full h-full object-cover" @error="markMiniBroken(item)" />
            <span v-else-if="!item._metaErr && !isMiniBroken(item)" class="inline-block">
              <span class="block w-[12px] h-[12px] border-2 border-font-secondary border-t-transparent rounded-full animate-spin"></span>
            </span>
            <span v-else class="text-[10px] text-font-danger text-center">IPFS</span>
            <div v-if="item._holding?.balance && Number(item._holding.balance) > 1" class="absolute bottom-[2px] left-[2px] bg-black/70 text-white text-[10px] px-[4px] py-[1px] rounded">
              x{{ item._holding.balance }}
            </div>
          </div>
          <span class="text-font-primary">{{ item.name }}</span>
        </div>
      </template>
      <template #tokenId="{ item }">
        <div class="flex items-center gap-1">
          <Tooltip :value="item.tokenId" variant="hash">
            <span class="text-font-primary">{{ shortenString(item.tokenId, 10, 10) }}</span>
          </Tooltip>
          <Copy :value="item.tokenId" tooltipText="Copy Token ID" />
        </div>
      </template>
    </DataTable>

    <div v-else class="bg-surface-primary border border-line-default rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/nft.png" alt="No NFTs" class="w-24 h-24 mb-4 opacity-50" />
        <div class="text-font-primary text-lg font-medium mb-2">No NFTs yet</div>
        <p class="text-font-secondary text-sm text-center">
          This account doesn’t hold any NFTs on this chain.
        </p>
      </div>
    </div>
  </div>
</template>


