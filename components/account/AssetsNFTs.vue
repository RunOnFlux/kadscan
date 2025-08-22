<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table5.vue'
import PreviewIcon from '~/components/icon/Preview.vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useSharedData } from '~/composables/useSharedData'
import Tooltip from '~/components/Tooltip.vue'
import Copy from '~/components/Copy.vue'
import { shortenString } from '~/composables/string'

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
const { loading, nfts, metadataByKey, metadataErrors, fetchAccountNFTs, startMetadataQueue, clearState } = useAccountNFTs()

const emit = defineEmits<{
  (e: 'preview', payload: { holding: any | null; metadata: any | null; errorUrl: string | null }): void
}>()

const route = useRoute()

const chainFromQuery = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  return n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19 ? `${n}` : null
})

const sanitize = (input: any, maxLen = 200): string => {
  if (input === null || input === undefined) return ''
  let text = String(input)
  text = text.replace(/<[^>]*>/g, ' ')
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  text = text.replace(/[^\w\s.,:;!?()\[\]\-_/&#%+'"@]/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > maxLen) text = text.slice(0, maxLen - 1) + '…'
  return text
}

const flattenedRows = computed(() => {
  const arr = nfts.value || []
  const chain = chainFromQuery.value
  const filtered = chain === null ? arr : arr.filter(r => `${r.chainId}` === chain)
  return filtered.map(h => {
    const meta = metadataByKey.value[`${h.chainId}:${h.tokenId}`] || null
    const err = metadataErrors.value[`${h.chainId}:${h.tokenId}`] || null
    const name = sanitize(meta?.name || 'Unknown')
    const collection = sanitize(meta?.collection || meta?.collection_id || 'Unknown')
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

const loadingPage = ref(false)

const subtitle = computed(() => {
  if (totalItems.value === 0) return ''
  const first = (currentPage.value - 1) * rowsToShow.value + 1
  const last = Math.min(currentPage.value * rowsToShow.value, totalItems.value)
  return `(Showing NFTs ${first}–${last})`
})

function openPreview(row: any) {
  emit('preview', {
    holding: row?._holding || null,
    metadata: row?._meta || null,
    errorUrl: (row?._metaErr && row._metaErr.url) ? row._metaErr.url : null,
  })
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
    <SkeletonTable v-if="loading" />
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
      v-model:loadingPage="loadingPage"
      :has-next-page="currentPage < totalPages"
      :has-previous-page="currentPage > 1"
    >
      <template #preview="{ item }">
        <button
          class="w-8 h-8 rounded-md border border-[#222222] grid place-items-center hover:bg-[#1a1a1a] active:bg-[#252525]"
          @click.prevent="openPreview(item)"
        >
          <PreviewIcon />
        </button>
      </template>
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <div class="relative w-8 h-8 rounded-md overflow-hidden bg-[#1a1a1a] border border-[#222222] grid place-items-center">
            <img v-if="item._image" :src="item._image" alt="nft" class="w-full h-full object-cover" />
            <span v-else-if="!item._metaErr" class="inline-block">
              <span class="block w-[12px] h-[12px] border-2 border-[#bbbbbb] border-t-transparent rounded-full animate-spin"></span>
            </span>
            <span v-else class="text-[10px] text-[#ff6b6b] text-center">IPFS</span>
            <div v-if="item._holding?.balance && Number(item._holding.balance) > 1" class="absolute bottom-[2px] left-[2px] bg-black/70 text-white text-[10px] px-[4px] py-[1px] rounded">
              x{{ item._holding.balance }}
            </div>
          </div>
          <span class="text-[#fafafa]">{{ item.name }}</span>
        </div>
      </template>
      <template #tokenId="{ item }">
        <div class="flex items-center gap-1">
          <Tooltip :value="item.tokenId" variant="hash">
            <span class="text-[#fafafa]">{{ shortenString(item.tokenId, 10, 10) }}</span>
          </Tooltip>
          <Copy :value="item.tokenId" tooltipText="Copy Token ID" />
        </div>
      </template>
    </DataTable>

    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/nft.png" alt="No NFTs" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#fafafa] text-lg font-medium mb-2">No NFTs held in this account or specific chain</h3>
        <p class="text-[#bbbbbb] text-sm text-center">&nbsp;</p>
      </div>
    </div>
  </div>
</template>


