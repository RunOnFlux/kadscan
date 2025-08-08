<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import DataTable from '~/components/DataTable.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import Copy from '~/components/Copy.vue';
import { useAccountTokenTransfers } from '~/composables/useAccountTokenTransfers';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';

const props = defineProps<{
  address: string;
}>();

const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();

const {
  tokenTransfers,
  loading,
  pageInfo,
  totalCount,
  rowsToShow,
  error,
  fetchAccountTokenTransfers,
  fetchTotalCount,
  updateRowsToShow,
  clearState
} = useAccountTokenTransfers();

// Pagination state
const currentPage = ref(1);
const loadingPage = ref(false);
const selectedRowOption = ref({ label: '25', value: 25 });
const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 }
];

const totalPages = computed(() => {
  return Math.max(Math.ceil(totalCount.value / rowsToShow.value), 1);
});

const subtitle = computed(() => {
  if (tokenTransfers.value.length === 0 || loading.value) {
    return '';
  }
  return `(Latest ${tokenTransfers.value.length} token transfers for this account)`;
});

const tableHeaders = [
  { key: 'status', label: 'Status' },
  { key: 'hash', label: 'Transaction Hash' },
  { key: 'token', label: 'Token' },
  { key: 'block', label: 'Block' },
  { key: 'age', label: 'Age' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'amount', label: 'Amount' },
  { key: 'fee', label: 'Txn Fee' }
];

// Clear state on mount
onMounted(() => {
  clearState();
});

// Fetch data when address or network changes
watch([() => props.address, selectedNetwork], () => {
  if (props.address && selectedNetwork.value) {
    fetchAccountTokenTransfers({
      networkId: selectedNetwork.value,
      address: props.address
    });
    fetchTotalCount(selectedNetwork.value, props.address);
  }
}, { immediate: true });

// Handle rows per page changes
watch(selectedRowOption, (newOption) => {
  updateRowsToShow(newOption);
  currentPage.value = 1; // Reset to first page
  if (props.address && selectedNetwork.value) {
    fetchAccountTokenTransfers({
      networkId: selectedNetwork.value,
      address: props.address
    });
  }
});
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />
    
    <DataTable
      v-else-if="tokenTransfers.length > 0"
      :headers="tableHeaders"
      :items="tokenTransfers"
      :totalItems="totalCount"
      itemNamePlural="token transfers"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      v-model:loadingPage="loadingPage"
      :has-next-page="pageInfo?.hasNextPage"
      :has-previous-page="pageInfo?.hasPreviousPage"
    >
      <!-- Custom column templates will go here when we have real data -->
      <template #status="{ item }">
        <span class="px-2 py-1 rounded text-xs bg-[#333333] text-white border border-[#444444]">
          {{ item.status || 'Success' }}
        </span>
      </template>
      
      <template #hash="{ item }">
        <div class="flex items-center gap-2">
          <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">
            {{ truncateAddress(item.hash || '', 10) }}
          </span>
          <Copy :value="item.hash || ''" />
        </div>
      </template>
      
      <template #token="{ item }">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-gray-300 rounded"></div>
          <span class="text-[#fafafa]">{{ item.token || 'Token' }}</span>
        </div>
      </template>
      
      <template #from="{ item }">
        <div class="flex items-center gap-2">
          <span class="text-[#6AB5DB] hover:text-[#9ccee7]">
            {{ truncateAddress(item.from || '', 10) }}
          </span>
          <Copy :value="item.from || ''" />
        </div>
      </template>
      
      <template #to="{ item }">
        <div class="flex items-center gap-2">
          <span class="text-[#6AB5DB] hover:text-[#9ccee7]">
            {{ truncateAddress(item.to || '', 10) }}
          </span>
          <Copy :value="item.to || ''" />
        </div>
      </template>
    </DataTable>
    
    <!-- Empty state -->
    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No token transfers" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#fafafa] text-lg font-medium mb-2">No token transfers yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          This account hasn't made any token transfers yet.
        </p>
      </div>
    </div>
  </div>
</template> 