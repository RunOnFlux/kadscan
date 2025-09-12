<script setup lang="ts">
// Vue core
import { ref, watch, computed } from 'vue';

// Components
import StatusBadge from '~/components/StatusBadge.vue';
import DataTable from '~/components/DataTable.vue';
import FilterSelect from '~/components/FilterSelect.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import ErrorOverlay from '~/components/error/Overlay.vue';
import ColumnGas from '~/components/column/Gas.vue';
import IconDownload from '~/components/icon/Download.vue';
import IconRefresh from '~/components/icon/Refresh.vue';

// Composables
import { useStatus } from '~/composables/useStatus';
import { useTransactions } from '~/composables/useTransactions';
import { useTransactionsByPactCode } from '~/composables/useTransactionsByPactCode';
import { useBlocks } from '~/composables/useBlocks';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { useTransactionCountWss } from '~/composables/useTransactionWss';
import { useFormat } from '~/composables/useFormat';

// Utils
import { exportableToCsv, downloadCSV } from '~/composables/csv';

// Constants
definePageMeta({
  layout: 'app',
  middleware: ['sanitize-chain'],
});

useHead({ title: 'Transactions' });

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

// Reactive State (refs/reactive)
const route = useRoute();
const router = useRouter();
// Shared format helpers (method helpers moved from page-local to useFormat)
const { truncateAddress, formatKdaFee, formatTransactionMethod, formatTransactionMethodFull } = useFormat();
const { selectedNetwork } = useSharedData();
const { isMobile } = useScreenSize();

const { lastBlockHeight, fetchLastBlockHeight, error: blocksError, clearState: clearBlocksState } = useBlocks();

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
  filteredTransactions: txFilteredTransactions,
  totalPages: txTotalPages,
  subtitle: txSubtitle,
} = useTransactions();

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

// Chain and block filters (kept in page; reflected in URL via FilterSelect)
// Middleware ensures query.chain is valid when present.
const selectedChain = ref(route.query.chain ? { label: String(route.query.chain), value: String(route.query.chain) } : { label: 'All', value: null });
const selectedBlock = ref<number | null>(route.query.block ? Number(route.query.block) : null);

const currentPage = ref(Number(route.query.page) || 1);
const loadingPage = ref(false);

const { transactionStatus } = useStatus(lastBlockHeight);

// Live incoming transactions counter via WSS
const {
  startSubscription: startIncomingSub,
  incomingCount,
  baseline,
  hasSeenBaseline,
  setBaselineHash,
  resetCountStream,
  overLimit,
  maxIncomingCount,
} = useTransactionCountWss();

// Baseline guard: only set once per reset cycle
const hasSetBaseline = ref(false);

// Computed (UI-local only)
// UI-local mode switch: enables pact code search when query.code length >= 4
const codeMode = computed(() => typeof route.query.code === 'string' && route.query.code.length >= 4);

// UI-local: generate chain filter options (All + 0-19)
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null }];
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() });
  }
  return options;
});

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

// Domain-derived values wired from transactions composable
const filteredTransactions = computed(() => codeMode.value ? (codeTransactions.value || []) : (txFilteredTransactions?.value || []));
const totalPages = computed(() => codeMode.value ? 1 : (txTotalPages?.value || 1));
const subtitle = computed(() => codeMode.value ? '' : (txSubtitle?.value || ''));

// Use the correct loading state depending on mode
const isLoading = computed(() => codeMode.value ? codeLoading.value : loading.value);

// Watchers
watch([filteredTransactions, currentPage, codeMode], () => {
  if (codeMode.value) return;
  if (currentPage.value !== 1) return;
  if (hasSetBaseline.value) return;
  const first = filteredTransactions.value?.[0]?.requestKey || null;
  if (first) {
    setBaselineHash(first);
    hasSetBaseline.value = true;
  }
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

// 1) React to network/filters/code changes: reset to page 1 and fetch appropriately
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
      await fetchLastBlockHeight({ networkId: network.id });
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

// 2) Rows-per-page change: reset to page 1 and refetch
watch([rowsToShow, codeRowsToShow], async () => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (transactionsError.value) transactionsError.value = null as any;
  if (blocksError.value) blocksError.value = null as any;
  currentPage.value = 1;
  if (codeMode.value) {
    await fetchLastBlockHeight({ networkId: network.id });
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

// 3) Pagination: fetch next/prev page using cursors (code vs normal)
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (transactionsError.value) transactionsError.value = null as any;
  if (blocksError.value) blocksError.value = null as any;
  if (!newPage || newPage === oldPage) return;

  if (codeMode.value) {
    const params: { networkId: string; after?: string; before?: string } = { networkId: network.id };
    await fetchLastBlockHeight({ networkId: network.id });
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

// Lifecycle hooks
// Clear list state, then start incoming subscription (keeps initial skeleton)
onMounted(() => { clearTransactionsState(); clearCodeState(); clearBlocksState(); startIncomingSub(); });

// Functions (helpers, then event handlers)
// Forces a top-of-list refresh while preserving initial-skeleton semantics
async function refreshTopPage() {
  if (process.client) {
    hasSetBaseline.value = false;
    window.location.reload();
    return;
  }
}

// Export current page rows to CSV with formatted status and fee
function downloadData() {
  const rows = ((codeMode.value ? codeTransactions.value : transactions.value) || []).map((item: any) => {
    const statusText = transactionStatus(item.height, item.canonical, item.badResult)?.text || '';
    const feeStr = formatKdaFee(item?.gas, item?.rawGasPrice);
    return {
      ...item,
      time: item?.timeUtc || item?.time,
      status: statusText,
      fee: feeStr,
      gasLimit: item?.rawGasLimit ?? item?.gasLimit ?? '',
    };
  });

  const csv = exportableToCsv(rows, tableHeaders);
  downloadCSV(csv, `kadena-transactions-page-${currentPage.value}.csv`);
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
          <button
            v-if="incomingCount > 0"
            @click="refreshTopPage"
            class="hidden lg:flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#f5f5f5] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
          >
            <IconRefresh class="w-4 h-4" style="color: #00a186;" />
            <span class="text-[#00a186] font-medium">+{{ incomingCount }} New Transactions</span>
          </button>
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
          <Tooltip :value="formatTransactionMethodFull(item.method)">
            <span class="px-2 py-1.5 bg-[#151515] rounded-md border border-[#292929] text-[11px] text-[#f5f5f5] font-normal inline-flex items-center justify-center leading-none w-[120px]">
              {{ formatTransactionMethod(item.method) }}
            </span>
          </Tooltip>
        </div>
      </template>
      <template #fee="{ item }">
        <span class="text-[#f5f5f5]">{{ formatKdaFee(item?.gas, item?.rawGasPrice) }}</span>
      </template>
    </DataTable>
  </div>
</template>
