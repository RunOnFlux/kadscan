<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table5.vue'
import IconDownload from '~/components/icon/Download.vue'
import { staticTokens, unknownToken } from '~/constants/tokens'
import { useAccountBalances } from '~/composables/useAccountBalances'
import { useSharedData } from '~/composables/useSharedData'
import Tooltip from '~/components/Tooltip.vue'
import { useFormat } from '~/composables/useFormat'
import { exportableToCsv, downloadCSV } from '~/composables/csv'

const props = defineProps<{
  address: string
}>()

const route = useRoute()
const { selectedNetwork } = useSharedData()
const { balances, loading, pageInfo } = useAccountBalances()
const { truncateAddress } = useFormat()

// Table setup
const headers = [
  { key: 'asset', label: 'Asset' },
  { key: 'module', label: 'Module' },
  { key: 'chain', label: 'Chain' },
  { key: 'price', label: 'Price' },
  { key: 'amount', label: 'Amount' },
  { key: 'value', label: 'Value' },
]

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

const totalCount = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(Math.ceil(totalCount.value / rowsToShow.value), 1))

const pageSlice = computed(() => {
  const start = (currentPage.value - 1) * rowsToShow.value
  return filteredRows.value.slice(start, start + rowsToShow.value)
})

function formatUsd(num: number) {
  return `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`
}

const iconForModule = (module: string) => {
  const token = staticTokens.find(t => t.module === module) || (module === 'coin' ? staticTokens.find(t => t.module === 'coin') : null)
  return token?.icon || ''
}

const nameForModule = (module: string) => {
  const token = staticTokens.find(t => t.module === module)
  if (token?.name) return token.name
  // Fallback: derive from module
  const parts = (module || '').split('.')
  const fallback = (parts[1] || parts[0] || 'UNKNOWN').toUpperCase()
  return fallback
}

const priceForModule = (_module: string) => 0 // USD price hardcoded for now

const chainFromQuery = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  return n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19 ? `${n}` : null
})

const flattenedRows = computed(() => {
  const arr = balances.value || []
  // map each balance to table row
  return arr
    .filter((b: any) => Number(b.balance) > 0)
    .map((b: any) => {
      const amountNum = Number(b.balance)
      const price = priceForModule(b.module)
      const value = price * amountNum
      return {
        asset: nameForModule(b.module),
        module: b.module,
        chain: b.chainId,
        price: formatUsd(price),
        amount: new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(amountNum),
        value: formatUsd(value),
        _sortValue: value,
        _icon: iconForModule(b.module),
      }
    })
})

// Helpers for displaying long module names
const isLongModule = (module: string | undefined | null) => {
  const ns = (module || '').split('.')?.[0] || ''
  return ns.length > 20
}

const displayModule = (module: string | undefined | null) => {
  const text = module || ''
  const [ns, name] = text.split('.')
  if (ns && ns.length > 20) {
    const truncated = truncateAddress(ns, 8, 6)
    return name ? `${truncated}.${name}` : truncated
  }
  return text
}

const filteredRows = computed(() => {
  const rows = flattenedRows.value
  const chain = chainFromQuery.value
  const visible = chain === null ? rows : rows.filter(r => `${r.chain}` === chain)
  // sort by value desc
  return [...visible].sort((a, b) => (b._sortValue || 0) - (a._sortValue || 0))
})

// Clamp current page when total pages or page size changes (after filteredRows exists)
watch([totalPages, rowsToShow], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
})

const subtitle = computed(() => {
  if (totalCount.value === 0) return ''
  const first = (currentPage.value - 1) * rowsToShow.value + 1
  const last = Math.min(currentPage.value * rowsToShow.value, totalCount.value)
  return `(Showing assets between #${first} to #${last})`
})

function downloadData() {
  const csv = exportableToCsv(pageSlice.value, headers)
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadCSV(csv, `assets-page-${currentPage.value}-${ts}.csv`)
}
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />
    <DataTable
      v-else-if="pageSlice && pageSlice.length > 0"
      :headers="headers"
      :items="pageSlice"
      :totalItems="totalCount"
      itemNamePlural="assets"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      :has-next-page="pageInfo?.hasNextPage"
      :has-previous-page="pageInfo?.hasPreviousPage"
      :showTopPagination="false"
    >
      <template #actions>
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          {{ isMobile ? 'Download' : 'Download Page Data' }}
        </button>
      </template>
      <template #asset="{ item }">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-[#222222] overflow-hidden grid place-items-center">
            <img v-if="item._icon" :src="item._icon" alt="icon" class="w-6 h-6 object-contain" />
            <span v-else class="text-[11px] text-[#fafafa]">
              {{ (item.module?.split('.')?.[1] || item.module || 'U')[0]?.toUpperCase() }}
            </span>
          </div>
          <span class="text-[#f5f5f5]">{{ item.asset }}</span>
        </div>
      </template>
      <template #module="{ item }">
        <Tooltip :value="item.module" :disabled="!isLongModule(item.module)">
          <span class="text-[#f5f5f5]">{{ displayModule(item.module) }}</span>
        </Tooltip>
      </template>
    </DataTable>

    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/nft.png" alt="No assets" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#fafafa] text-lg font-medium mb-2">No assets yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          This account doesn’t hold any tokens on this chain.
        </p>
      </div>
    </div>
  </div>
</template>


