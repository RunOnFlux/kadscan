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
import ErrorOverlay from '~/components/error/Overlay.vue';
import ColumnGas from '~/components/column/Gas.vue';
import { useTransactions } from '~/composables/useTransactions';
import { useTransactionsByPactCode } from '~/composables/useTransactionsByPactCode';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv } from '~/composables/csv';
import { downloadCSV } from '~/composables/csv';
import { useBlocks } from '~/composables/useBlocks';

definePageMeta({
  layout: 'app',
  middleware: ['sanitize-chain'],
});

useHead({
  title: 'Transactions'
});

const route = useRoute();
const router = useRouter();
const { truncateAddress, formatKdaFee } = useFormat();
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

// Code-mode support (minimum 4 characters)
const codeMode = computed(() => typeof route.query.code === 'string' && route.query.code.length >= 4);
const {
  error: codeError,
  transactions: codeTransactions,
  loading: codeLoading,
  fetchTransactionsByCode,
  pageInfo: codePageInfo,
  rowsToShow: codeRowsToShow,
  updateRowsToShow: updateCodeRowsToShow,
  clearState: clearCodeState,
} = useTransactionsByPactCode();

// Chain filter state (middleware ensures query.chain is valid or absent)
const selectedChain = ref(route.query.chain ? { label: String(route.query.chain), value: String(route.query.chain) } : { label: 'All', value: null });
const selectedBlock = ref<number | null>(route.query.block ? Number(route.query.block) : null);

// Clear global state on mount to show skeleton on page navigation
onMounted(() => {
  clearTransactionsState();
  clearCodeState();
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
  if (codeMode.value) return '';
  if (filteredTransactions.value.length === 0 || loading.value || !totalCount.value) {
    return '';
  }

  const itemsBefore = (currentPage.value - 1) * rowsToShow.value;
  const remaining = Math.max(totalCount.value - itemsBefore, 0);
  const pageCount = Math.min(rowsToShow.value, remaining);

  const newestTxIndex = totalCount.value - itemsBefore;
  const oldestTxIndex = Math.max(newestTxIndex - pageCount + 1, 1);

  const formattedNewest = new Intl.NumberFormat().format(newestTxIndex);
  const formattedOldest = new Intl.NumberFormat().format(oldestTxIndex);

  return `(Showing transactions between #${formattedOldest} to #${formattedNewest})`;
});

// Use shared formatter from useFormat composable
const FEE_DECIMALS = 12
const getFeeInKda = (item: any) => formatKdaFee(item?.gas, item?.rawGasPrice, { decimals: FEE_DECIMALS, trimTrailingZeros: true })

// Format method helper (hyphens to spaces, Title Case each word, trim to 15 chars)
const formatMethod = computed(() => (val?: string) => {
  if (!val || val === '-') return 'Transaction'
  const replaced = String(val).replace(/-/g, ' ')
  const titleCased = replaced.replace(/\b([a-zA-Z])/g, (m) => m.toUpperCase())
  return titleCased.length > 15 ? titleCased.slice(0, 15) + '...' : titleCased
})

// Full formatted method for tooltip (Title Case, no trimming)
const formatMethodFull = computed(() => (val?: string) => {
  if (!val || val === '-') return 'Transaction'
  const replaced = String(val).replace(/-/g, ' ')
  return replaced.replace(/\b([a-zA-Z])/g, (m) => m.toUpperCase())
})

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
];

const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];
const currentPage = ref(Number(route.query.page) || 1);
const loadingPage = ref(false);

const selectedRowOption = computed({
  get: () => codeMode.value
    ? (rowOptions.find(option => option.value === codeRowsToShow.value) || rowOptions[0])
    : (rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0]),
  set: (value) => {
    if (value) {
      if (codeMode.value) {
        updateCodeRowsToShow(value);
        currentPage.value = 1;
      } else {
        updateRowsToShow(value);
        currentPage.value = 1;
      }
    }
  },
});

const totalPages = computed(() => {
  if (codeMode.value) return 1;
  if (!totalCount.value) return 1;
  return Math.ceil(totalCount.value / rowsToShow.value);
});

const { transactionStatus } = useStatus(lastBlockHeight);

// Computed property to filter out transactions from orphaned blocks
const filteredTransactions = computed(() => {
  const list = codeMode.value ? codeTransactions.value : transactions.value;
  if (!list || !lastBlockHeight || !lastBlockHeight.value) return [];
  
  return list.filter((transaction: any) => {
    // Remove transactions from orphaned blocks (same logic as blockStatus function)
    const isFromOrphanedBlock = lastBlockHeight.value - 6 >= transaction.height && !transaction.canonical;
    return !isFromOrphanedBlock;
  });
});

// Use the correct loading state depending on mode
const isLoading = computed(() => codeMode.value ? codeLoading.value : loading.value);

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
  [selectedNetwork, selectedChain, selectedBlock, () => route.query.code],
  async ([network]) => {
    if (!network) return;
    // Clear previous errors to avoid sticky skeleton after back navigation
    if (transactionsError.value) transactionsError.value = null as any;
    if (blocksError.value) blocksError.value = null as any;

    currentPage.value = 1;

    if (codeMode.value) {
      // Strip chain filter when in code mode
      const q: any = { ...route.query };
      if (q.chain) {
        delete q.chain;
        router.replace({ query: q });
      }
      await fetchTransactionsByCode({ networkId: network.id, pactCode: String(route.query.code) });
      loadingPage.value = false;
      return;
    }

    const params: { networkId: string; chainId?: string; isCoinbase?: boolean; minHeight?: number; maxHeight?: number } = { networkId: network.id };
    params.isCoinbase = false;
    if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
    if (selectedBlock.value !== null) {
      params.minHeight = selectedBlock.value;
      params.maxHeight = selectedBlock.value;
      if (params.chainId) params.isCoinbase = true;
    }

    await fetchLastBlockHeight({ networkId: network.id });
    await fetchTransactions(params);
    loadingPage.value = false;
  },
  { immediate: true }
);

// 2) React to rows-per-page change: reset to page 1 and refetch first page
watch([rowsToShow, codeRowsToShow], async () => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (transactionsError.value) transactionsError.value = null as any;
  if (blocksError.value) blocksError.value = null as any;
  currentPage.value = 1;
  if (codeMode.value) {
    await fetchTransactionsByCode({ networkId: network.id, pactCode: String(route.query.code) });
  } else {
    const params: { networkId: string; chainId?: string; isCoinbase?: boolean; minHeight?: number; maxHeight?: number } = { networkId: network.id };
    params.isCoinbase = false;
    if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
    if (selectedBlock.value !== null) {
      params.minHeight = selectedBlock.value;
      params.maxHeight = selectedBlock.value;
      if (params.chainId) params.isCoinbase = true;
    }
    await fetchLastBlockHeight({ networkId: network.id });
    await fetchTransactions(params);
  }
  loadingPage.value = false;
});

// 3) React to page change only: fetch the next/prev page using cursors
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (transactionsError.value) transactionsError.value = null as any;
  if (blocksError.value) blocksError.value = null as any;
  if (!newPage || newPage === oldPage) return;

  if (codeMode.value) {
    const params: { networkId: string; after?: string; before?: string } = { networkId: network.id };
    if (newPage === 1) {
      // Explicit jump to FIRST page in code mode
      await fetchTransactionsByCode({ ...params, pactCode: String(route.query.code) });
      loadingPage.value = false;
      return;
    }
    if (newPage > oldPage) params.after = codePageInfo.value?.endCursor as string | undefined;
    else if (newPage < oldPage) params.before = codePageInfo.value?.startCursor as string | undefined;
    await fetchTransactionsByCode({ ...params, pactCode: String(route.query.code) });
    loadingPage.value = false;
    return;
  }

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

  if (newPage === 1) {
    // Explicit jump to FIRST page
    params.after = undefined;
    params.before = undefined;
  } else if (newPage > oldPage) {
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

  await fetchLastBlockHeight({ networkId: network.id });
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

// Normalize short code query (remove if < 4 chars)
watch(() => route.query.code, (code) => {
  if (typeof code === 'string' && code.length > 0 && code.length < 4) {
    const q: any = { ...route.query };
    delete q.code;
    router.replace({ query: q });
  }
});


function downloadData() {
  // Map items to include export-friendly fields for Status and Fee (12-decimal string)
  const rows = (filteredTransactions.value || []).map((item: any) => {
    const statusText = transactionStatus(item.height, item.canonical, item.badResult)?.text || ''
    const feeStr = getFeeInKda(item)
    return {
      ...item,
      time: item?.timeUtc || item?.time,
      status: statusText,
      fee: feeStr,
      gasLimit: item?.rawGasLimit ?? item?.gasLimit ?? '',
    }
  })

  const csv = exportableToCsv(rows, tableHeaders)
  downloadCSV(csv, `kadena-transactions-page-${currentPage.value}.csv`)
}
</script>

<template>
  <ErrorOverlay v-if="transactionsError || blocksError || codeError" :message="(transactionsError || blocksError || codeError)?.message" />
  <div v-else>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#f5f5f5]">
        Transactions
      </h1>
    </div>

    <SkeletonTable v-if="isLoading" />

    <DataTable
      v-else
      :headers="tableHeaders"
      :items="filteredTransactions"
      :totalItems="totalCount || 0"
      itemNamePlural="transactions"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      v-model:loadingPage="loadingPage"
      :has-next-page="codeMode ? codePageInfo?.hasNextPage : pageInfo?.hasNextPage"
      :has-previous-page="codeMode ? codePageInfo?.hasPreviousPage : pageInfo?.hasPreviousPage"
      :unknownTotal="codeMode"
      customTitle="Searching with code"
    >
      <template #actions>
        <template v-if="!codeMode">
          <FilterSelect
            :modelValue="selectedChain"
            @update:modelValue="selectedChain = $event"
            :items="chainOptions"
            urlParamName="chain"
            :enableBlockFilter="true"
            blockUrlParamName="block"
          />
        </template>
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#f5f5f5] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          <span class="hidden md:inline">Download Page Data</span>
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
            <span class="px-2 py-1.5 bg-[#151515] rounded-md border border-[#292929] text-[11px] text-[#f5f5f5] font-normal inline-flex items-center justify-center leading-none w-[120px]">
              {{ formatMethod(item.method) }}
            </span>
          </Tooltip>
        </div>
      </template>
      <template #fee="{ item }">
        <span class="text-[#f5f5f5]">{{ getFeeInKda(item) }}</span>
      </template>
    </DataTable>
  </div>
</template>
