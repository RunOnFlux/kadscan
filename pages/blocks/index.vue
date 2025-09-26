<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import ErrorOverlay from '~/components/error/Overlay.vue';
import SkeletonStatsGrid from '~/components/skeleton/StatsGrid.vue';
import { useBlocksMetrics } from '~/composables/useBlocksMetrics';
import DataTable from '~/components/DataTable.vue';
import FilterSelect from '~/components/FilterSelect.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import { useStatus } from '~/composables/useStatus';
import StatusBadge from '~/components/StatusBadge.vue';
import { useBlocks } from '~/composables/useBlocks';
import IconRefresh from '~/components/icon/Refresh.vue';
import { useBlockCountWss } from '~/composables/useBlockWss';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv, downloadCSV } from '~/composables/useCSV';

definePageMeta({
  layout: 'app',
  middleware: ['sanitize-chain'],
});

useHead({
  title: 'Blocks'
});

const route = useRoute();
const router = useRouter();
const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();
const { isMobile } = useScreenSize();

const {
  error,
  blocks,
  loading,
  fetchBlocks,
  pageInfo,
  totalCount,
  lastBlockHeight,
  fetchLastBlockHeight,
  rowsToShow,
  updateRowsToShow,
  clearState,
} = useBlocks();

// Chain filter state (middleware ensures query.chain is valid or absent)
const selectedChain = ref(route.query.chain ? { label: String(route.query.chain), value: String(route.query.chain) } : { label: 'All', value: null });

// Initialize chain filter from URL parameter on component mount
onMounted(() => {
  // Clear global state to show skeleton on page navigation
  clearState();
  
  const chainParam = route.query.chain;
  if (chainParam && chainParam !== 'all') {
    const chainValue = parseInt(chainParam as string);
    if (!isNaN(chainValue) && chainValue >= 0 && chainValue <= 19) {
      selectedChain.value = { label: chainValue.toString(), value: chainValue.toString() };
    }
  }
});

// Generate chain filter options (All + 0-19)
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null }];
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() });
  }
  return options;
});

const { cards: metricsCards, loading: metricsLoading, error: metricsError } = useBlocksMetrics(selectedNetwork);

const subtitle = computed(() => {
  if (filteredBlocks.value.length === 0 || loading.value) {
    return '';
  }
  const blockNumbers = filteredBlocks.value.map((b: any) => b.height);
  const oldestBlock = Math.min(...blockNumbers);
  const latestBlock = Math.max(...blockNumbers);
  return `Showing blocks between #${oldestBlock} to #${latestBlock}`;
});

const tableHeaders = [
  { key: 'height', label: 'Block' },
  { key: 'chainId', label: 'Chain' },
  { key: 'status', label: 'Status' },
  { key: 'age', label: 'Age' },
  { key: 'txn', label: 'Txn' },
  { key: 'miner', label: 'Miner Account' },
  { key: 'gasLimit', label: 'Gas Limit' },
  { key: 'gasPrice', label: 'Gas Price' },
  { key: 'reward', label: 'Block Reward' },
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

const totalBlocksCount = computed(() => {
  if (!totalCount.value) return 0;
  return totalCount.value;
});

const { blockStatus } = useStatus(lastBlockHeight);

// Computed property to filter out orphaned blocks
const filteredBlocks = computed(() => {
  if (!blocks.value || !lastBlockHeight || !lastBlockHeight.value) return [];
  return blocks.value.filter((block: any) => Boolean(block.canonical));
});

// Live incoming blocks counter via WSS (identical logic to transactions)
const {
  startSubscription: startIncomingSub,
  incomingCount,
  baseline,
  hasSeenBaseline,
  setBaselineHash,
  resetCountStream,
  overLimit,
  maxIncomingCount,
} = useBlockCountWss();

onMounted(() => {
  startIncomingSub();
});

// Baseline guard: only set once per reset cycle
const hasSetBaseline = ref(false);

watch([filteredBlocks, currentPage], () => {
  if (currentPage.value !== 1) return;
  if (hasSetBaseline.value) return;
  const first = (filteredBlocks.value?.[0]?.hash) || null;
  if (first) {
    setBaselineHash(first);
    hasSetBaseline.value = true;
  }
});

async function refreshTopPage() {
  if (process.client) {
    hasSetBaseline.value = false;
    window.location.reload();
    return;
  }
}

watch(
  [currentPage, rowsToShow],
  ([newPage, newRows], [oldPage, oldRows]) => {
    // Don't update URL if there's an error (prevents race condition with error redirect)
    if (error.value) return;
    
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
  [selectedNetwork, selectedChain],
  async ([network], [oldNetwork, oldChain]) => {
    if (!network) return;
    if (error.value) error.value = null as any;

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    const chainChanged = !!oldChain && selectedChain.value.value !== oldChain.value;

    if (networkChanged || chainChanged) {
      await fetchLastBlockHeight({ networkId: network.id });
      currentPage.value = 1;
      const params: { networkId: string; chainIds?: string[] } = { networkId: network.id };
      if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string];
      await fetchBlocks(params);
      loadingPage.value = false;
    }
  },
  { immediate: true }
);

// 2) React to rows-per-page change: reset to page 1 and refetch first page
watch(rowsToShow, async (newRows, oldRows) => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (error.value) error.value = null as any;
  if (newRows === oldRows) return;
  currentPage.value = 1;
  const params: { networkId: string; chainIds?: string[] } = { networkId: network.id };
  if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string];
  await fetchBlocks(params);
  loadingPage.value = false;
});

// 3) React to page change only: fetch the next/prev page using cursors
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value;
  if (!network) return;
  if (error.value) error.value = null as any;
  if (!newPage || newPage === oldPage) return;

  const params: { networkId: string; after?: string; before?: string; toLastPage?: boolean; chainIds?: string[] } = {
    networkId: network.id,
  };
  if (selectedChain.value.value !== null) params.chainIds = [selectedChain.value.value as string];

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

  await fetchBlocks(params);
  loadingPage.value = false;
});

function downloadData() {
  const exportData = filteredBlocks.value.map((item: any) => ({
    ...item,
    age: item?.timeUtc || item?.age,
    status: blockStatus(item.height, item.canonical).text,
  }));
  const csv = exportableToCsv(exportData, tableHeaders);
  downloadCSV(csv, `kadena-blocks-page-${currentPage.value}.csv`);
}
</script>

<template>
  <ErrorOverlay v-if="error" :message="error?.message" />
  <div v-else>
    <div class="flex items-center justify-between pb-5 border-b border-line-default mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-font-primary">
        Blocks
      </h1>
    </div>

    <SkeletonStatsGrid v-if="loading" />
    <StatsGrid v-else-if="!metricsError && metricsCards.length" :cards="metricsCards" />
    
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else
      :headers="tableHeaders"
      :items="filteredBlocks"
      :totalItems="totalBlocksCount"
      itemNamePlural="blocks"
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
        <button
          v-if="incomingCount > 0"
          @click="refreshTopPage"
          class="hidden lg:flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-font-primary bg-surface-disabled border border-line-default rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconRefresh class="w-4 h-4" style="color: #00a186;" />
          <span class="text-font-accent font-medium">+{{ incomingCount }} New Blocks</span>
        </button>
        <FilterSelect
          :modelValue="selectedChain"
          @update:modelValue="selectedChain = $event"
          :items="chainOptions"
          urlParamName="chain"
        />
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-font-primary bg-surface-disabled border border-line-default rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-font-secondary" />
          <span class="hidden md:inline">Download</span>
        </button>
      </template>

      <template #height="{ item }">
        <NuxtLink :to="`/blocks/${item.height}/chain/${item.chainId}`" class="text-link hover:text-link-hover">{{ item.height }}</NuxtLink>
      </template>
      <template #status="{ item }">
        <StatusBadge :status="blockStatus(item.height, item.canonical)" />
      </template>
      <template #txn="{ item }">
        <NuxtLink :to="`/transactions/${item.txn}`" class="text-link hover:text-link-hover">{{ item.txn }}</NuxtLink>
      </template>
      <template #miner="{ item }">
        <div class="flex items-center">
          <Tooltip v-if="item.miner!=='N/A'" :value="item.miner" variant="hash">
            <NuxtLink :to="`/account/${item.miner}`" class="text-link hover:text-link-hover">{{ truncateAddress(item.miner, 10, 10) }}</NuxtLink>
          </Tooltip>
          <Copy v-if="item.miner!=='N/A'" :value="item.miner" tooltipText="Copy Address" />
            <span v-else class="text-font-primary">{{ item.miner }}</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>
