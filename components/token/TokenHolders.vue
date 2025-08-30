<script setup lang="ts">
import { ref, computed } from 'vue'
defineOptions({ name: 'TokenHolders' })
import DataTable from '~/components/DataTable.vue'
import SkeletonTable from '~/components/skeleton/Table.vue'

const loading = ref(false)
const items = ref<Array<any>>([])
const totalCount = ref(0)

const tableHeaders = [
  { key: 'address', label: 'Address' },
  { key: 'balance', label: 'Balance' },
  { key: 'percentage', label: 'Percentage' },
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
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else-if="items && items.length > 0"
      :headers="tableHeaders"
      :items="items"
      :totalItems="totalCount"
      itemNamePlural="holders"
      subtitle=""
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      v-model:loadingPage="loadingPage"
      :has-next-page="false"
      :has-previous-page="false"
    />

    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No holders" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#f5f5f5] text-lg font-medium mb-2">No holders</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          Coming soon...
        </p>
      </div>
    </div>
  </div>
</template>


