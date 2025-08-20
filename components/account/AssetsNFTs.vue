<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table5.vue'

const props = defineProps<{
  address: string
}>()

const headers = [
  { key: 'collection', label: 'Collection' },
  { key: 'name', label: 'Name' },
  { key: 'chain', label: 'Chain' },
  { key: 'tokenId', label: 'TokenId' },
  { key: 'value', label: 'Value' },
]

const items: any[] = []
const totalItems = computed(() => items.length)

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
const loadingPage = ref(false)

const subtitle = computed(() => {
  if (totalItems.value === 0) return ''
  const first = (currentPage.value - 1) * rowsToShow.value + 1
  const last = Math.min(currentPage.value * rowsToShow.value, totalItems.value)
  return `(Showing NFTs ${first}–${last})`
})
</script>

<template>
  <div>
    <SkeletonTable v-if="false" />
    <DataTable
      v-else-if="false"
      :headers="headers"
      :items="[]"
      :totalItems="totalItems"
      itemNamePlural="NFTs"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      v-model:loadingPage="loadingPage"
      :has-next-page="false"
      :has-previous-page="false"
    />
    <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/nft.png" alt="No NFTs" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#fafafa] text-lg font-medium mb-2">No NFTs yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          This account doesn’t hold any NFTs on this chain.
        </p>
      </div>
    </div>
  </div>
</template>


