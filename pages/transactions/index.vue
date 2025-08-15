<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import { useStatus } from '~/composables/useStatus';
import StatusBadge from '~/components/StatusBadge.vue';
import DataTable from '~/components/DataTable.vue';
import FilterSelect from '~/components/FilterSelect.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import ColumnGas from '~/components/column/Gas.vue';
import { useTransactions } from '~/composables/useTransactions';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv } from '~/composables/csv';
import { downloadCSV } from '~/composables/csv';
import { useBlocks } from '~/composables/useBlocks';

definePageMeta({
  layout: 'app',
});

useHead({
  title: 'Transactions'
});

const route = useRoute();
const router = useRouter();
const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();
const { isMobile } = useScreenSize();

const { 
  lastBlockHeight, 
  fetchLastBlockHeight, 
  error: blocksError, 
  clearState: clearBlocksState 
  } = useBlocks();

const { 
  error: transactionsError,
  transactions, 
  loading, 
  fetchTransactions,
  pageInfo, 
  totalCount, 
  rowsToShow, 
  updateRowsToShow,
  clearState: clearTransactionsState,
} = useTransactions();

// Chain filter state - initialize from URL parameters (commented due to query glitch)
const selectedChain = ref({ label: 'All', value: null });
const selectedBlock = ref<number | null>(route.query.block ? Number(route.query.block) : null);

// Clear global state on mount to show skeleton on page navigation
onMounted(() => {
  clearTransactionsState();
  clearBlocksState();
});

// Generate chain filter options (All + 0-19)
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null }];
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() });
  }
  return options;
});

const subtitle = computed(() => {
  if (filteredTransactions.value.length === 0 || loading.value || !totalCount.value) {
    return '';
  }

  // Determine how many items should appear on the current page (handles last-page remainder)
  const itemsBefore = (currentPage.value - 1) * rowsToShow.value;
  const remaining = Math.max(totalCount.value - itemsBefore, 0);
  const pageCount = Math.min(rowsToShow.value, remaining);

  const newestTxIndex = totalCount.value - itemsBefore;
  const oldestTxIndex = Math.max(newestTxIndex - pageCount + 1, 1);

  const formattedNewest = new Intl.NumberFormat().format(newestTxIndex);
  const formattedOldest = new Intl.NumberFormat().format(oldestTxIndex);

  return `(Showing transactions between #${formattedOldest} to #${formattedNewest})`;
});

const getFeeInKda = (item: any) => {
  if (!item.gas || !item.rawGasPrice) {
    return '0.0 KDA';
  }
  const feeInKda = item.gas * item.rawGasPrice;
  
  // If fee is 0, show simplified format
  if (feeInKda === 0) {
    return '0.0 KDA';
  }
  
  const formattedFee = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 12,
  }).format(feeInKda);
  return `${formattedFee} KDA`;
};

const tableHeaders = [
  { key: 'requestKey', label: 'Request Key' },
  { key: 'height', label: 'Block' },
  { key: 'chainId', label: 'Chain' },
  { key: 'status', label: 'Status' },
  { key: 'time', label: 'Time' },
  { key: 'sender', label: 'Sender' },
  { key: 'gas', label: 'Gas' },
  { key: 'gasLimit', label: 'Gas Limit' },
  { key: 'gasPrice', label: 'Gas Price' },
  { key: 'fee', label: 'Fee' },
];

const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];
const currentPage = ref(Number(route.query.page) || 1);
const loadingPage = ref(false);

const selectedRowOption = computed({
  get: () => rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0],
  set: (value) => {
    if (value) {
      updateRowsToShow(value);
    }
  },
});

const totalPages = computed(() => {
  if (!totalCount.value) return 1;
  return Math.ceil(totalCount.value / rowsToShow.value);
});

const { transactionStatus } = useStatus(lastBlockHeight);

// Computed property to filter out transactions from orphaned blocks
const filteredTransactions = computed(() => {
  if (!transactions.value || !lastBlockHeight || !lastBlockHeight.value) return [];
  
  return transactions.value.filter((transaction: any) => {
    // Remove transactions from orphaned blocks (same logic as blockStatus function)
    const isFromOrphanedBlock = lastBlockHeight.value - 10 >= transaction.height && !transaction.canonical;
    return !isFromOrphanedBlock;
  });
});

watch(
  [currentPage, rowsToShow],
  ([newPage, newRows], [oldPage, oldRows]) => {
    // Don't update URL if there's an error (prevents race condition with error redirect)
    if (transactionsError.value || blocksError.value) return;
    
    const query = { ...route.query, page: newPage };
    if (newRows !== oldRows) {
      query.page = 1;
      currentPage.value = 1;
    }
    router.push({ query });
  },
);

// Keep currentPage in sync with the URL (back/forward, manual edits)
watch(() => route.query.page, (page) => {
  const pageNumber = Number(page) || 1;
  if (pageNumber !== currentPage.value) {
    currentPage.value = pageNumber;
  }
});

// 1) React to network or chain change: reset to page 1 and refresh counts, then fetch first page
watch(
  [selectedNetwork, selectedChain, selectedBlock],
  async ([network], [oldNetwork, oldChain, oldBlock]) => {
    if (!network) return;

    // Don't run pagination logic if there's an error (prevents race condition with error redirect)
    if (transactionsError.value || blocksError.value) return;

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    const chainChanged = !!oldChain && selectedChain.value.value !== oldChain.value;
    const blockChanged = selectedBlock.value !== oldBlock;

    if (networkChanged || chainChanged || blockChanged) {
      await fetchLastBlockHeight({ networkId: network.id });
      currentPage.value = 1;
      const params: { networkId: string; chainId?: string; isCoinbase?: boolean; minHeight?: number; maxHeight?: number } = { networkId: network.id };
      // Default coinbase behavior: false unless both chain and block are present
      params.isCoinbase = false;
      // Chain filter
      if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
      // Block filter
      if (selectedBlock.value !== null) {
        params.minHeight = selectedBlock.value;
        params.maxHeight = selectedBlock.value;
        // Only include coinbase when both chain and block are present
        if (params.chainId) params.isCoinbase = true;
      }
      await fetchTransactions(params);
      loadingPage.value = false;
    }
  },
  { immediate: true }
);

// 2) React to rows-per-page change: reset to page 1 and refetch first page
watch(rowsToShow, async (newRows, oldRows) => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (transactionsError.value || blocksError.value) return;
  if (newRows === oldRows) return;
  currentPage.value = 1;
  const params: { networkId: string; chainId?: string; isCoinbase?: boolean; minHeight?: number; maxHeight?: number } = { networkId: network.id };
  params.isCoinbase = false;
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
  if (selectedBlock.value !== null) {
    params.minHeight = selectedBlock.value;
    params.maxHeight = selectedBlock.value;
    if (params.chainId) params.isCoinbase = true;
  }
  await fetchTransactions(params);
  loadingPage.value = false;
});

// 3) React to page change only: fetch the next/prev page using cursors
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (transactionsError.value || blocksError.value) return;
  if (!newPage || newPage === oldPage) return;

  const params: { networkId: string; after?: string; before?: string; toLastPage?: boolean; chainId?: string; isCoinbase?: boolean; minHeight?: number; maxHeight?: number } = {
    networkId: network.id,
  };
  params.isCoinbase = false;
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
  if (selectedBlock.value !== null) {
    params.minHeight = selectedBlock.value;
    params.maxHeight = selectedBlock.value;
    if (params.chainId) params.isCoinbase = true;
  }

  if (newPage > oldPage) {
    params.after = pageInfo.value?.endCursor as string | undefined;
  } else if (newPage < oldPage) {
    params.before = pageInfo.value?.startCursor as string | undefined;
  }

  // Only trigger last page jump when we truly are on the last page (after counts are known)
  if (totalPages.value > 1 && newPage === totalPages.value) {
    params.after = null as any;
    params.before = null as any;
    params.toLastPage = true;
  }

  await fetchTransactions(params);
  loadingPage.value = false;
});

// Keep selectedBlock in sync with URL (back/forward, manual edits)
watch(() => route.query.block, (block) => {
  const blockNumber = typeof block === 'string' && block !== '' ? Number(block) : null;
  const normalized = blockNumber !== null && !Number.isNaN(blockNumber) && blockNumber >= 0 ? blockNumber : null;
  if (normalized !== selectedBlock.value) {
    selectedBlock.value = normalized;
  }
});

// Redirect to error page when transaction is not found
watch([transactionsError, blocksError], ([transactionsError, blocksError]) => {
  if (transactionsError || blocksError) {
    navigateTo('/error', { replace: true })
  }
})

function downloadData() {
  const csv = exportableToCsv(filteredTransactions.value, tableHeaders);
  downloadCSV(csv, `kadena-transactions-page-${currentPage.value}.csv`);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Transactions
      </h1>
    </div>

    <SkeletonTable v-if="loading" />

    <DataTable
      v-else
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
        <FilterSelect
          :modelValue="selectedChain"
          @update:modelValue="selectedChain = $event"
          :items="chainOptions"
          urlParamName="chain"
          :enableBlockFilter="true"
          blockUrlParamName="block"
        />
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          {{ isMobile ? 'Download' : 'Download Page Data' }}
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
      <template #fee="{ item }">
        <span class="text-[#f5f5f5]">{{ getFeeInKda(item) }}</span>
      </template>
    </DataTable>
  </div>
</template>
