<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';
import FilterSelect from '~/components/FilterSelect.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import { useStatus } from '~/composables/useStatus';
import StatusBadge from '~/components/StatusBadge.vue';
import { useBlocks } from '~/composables/useBlocks';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv, downloadCSV } from '~/composables/csv';

definePageMeta({
  layout: 'app',
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
  totalCount: lastBlockHeight,
  fetchTotalCount,
  rowsToShow,
  updateRowsToShow,
  clearState,
} = useBlocks();

// Chain filter state - initialize from URL parameters
const selectedChain = ref({ label: 'All', value: null });

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

/// TODO: get real analytics
// const mockedCards = [
//   { label: 'NETWORK UTILIZATION (24H)', value: '--' },
//   { label: 'LAST SAFE BLOCK', value: '--' },
//   { label: 'BLOCKS PRODUCED (24H)', value: '--' },
//   { label: 'REWARDS GIVEN (24H)', value: '--' },
// ];

const subtitle = computed(() => {
  if (filteredBlocks.value.length === 0 || loading.value) {
    return '';
  }
  const blockNumbers = filteredBlocks.value.map((b: any) => b.height);
  const oldestBlock = Math.min(...blockNumbers);
  const latestBlock = Math.max(...blockNumbers);
  return `(Showing blocks between #${oldestBlock} to #${latestBlock})`;
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
  if (!lastBlockHeight.value) return 1;
  return Math.ceil(lastBlockHeight.value / rowsToShow.value);
});

const { blockStatus } = useStatus(lastBlockHeight);

// Computed property to filter out orphaned blocks
const filteredBlocks = computed(() => {
  if (!blocks.value || !lastBlockHeight || !lastBlockHeight.value) return [];
  
  return blocks.value.filter((block: any) => {
    // Remove orphaned blocks (same logic as blockStatus function)
    const isOrphaned = lastBlockHeight.value - 10 >= block.height && !block.canonical;
    return !isOrphaned;
  });
});

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

watch(
  [() => route.query.page, selectedNetwork, rowsToShow, selectedChain],
  async ([page, network], [oldPage, oldNetwork, oldRows, oldChain]) => {
    if (!network) {
      return;
    }

    // Don't run pagination logic if there's an error (prevents race condition with error redirect)
    if (error.value) return;

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    const chainChanged = oldChain && selectedChain.value.value !== oldChain.value;
    
    if (networkChanged) {
      await fetchTotalCount({ networkId: network.id });
    }

    if (rowsToShow.value !== oldRows && Number(page) !== 1) {
      router.push({ query: { page: 1 } });
      return;
    }

    if ((networkChanged || chainChanged) && Number(page) !== 1) {
      router.push({ query: { page: 1 } });
      return;
    }

    const pageNumber = Number(page) || 1;
    const oldPageNumber = Number(oldPage) || 1;

    const params: { networkId: string; after?: string, before?: string, toLastPage?: boolean, chainIds?: string[] } = {
      networkId: network.id,
    };

    // Add chainIds filter if a specific chain is selected
    if (selectedChain.value.value !== null) {
      params.chainIds = [selectedChain.value.value];
    }

    if (pageNumber > 1) {
      if (pageNumber > oldPageNumber) {
        params.after = pageInfo.value?.endCursor;
      } else {
        params.before = pageInfo.value?.startCursor;
      }
    }

    if(pageNumber === totalPages.value) {
      params.after = null;
      params.before = null;
      params.toLastPage = true;
    }

    await fetchBlocks(params);
    currentPage.value = pageNumber;
    loadingPage.value = false;
  },
  {
    immediate: true,
    deep: true,
  }
);

// Redirect to error page when blocks are not found
watch(error, (newError) => {
  if (newError) {
    navigateTo('/error', { replace: true })
  }
})

function downloadData() {
  const csv = exportableToCsv(filteredBlocks.value, tableHeaders);
  downloadCSV(csv, `kadena-blocks-page-${currentPage.value}.csv`);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Blocks
      </h1>
    </div>

    <!-- TODO: get real analytics -->
    <!-- <StatsGrid :cards="mockedCards" /> -->
    
    <SkeletonTable v-if="loading" />
    <DataTable
      v-else
      :headers="tableHeaders"
      :items="filteredBlocks"
      :totalItems="lastBlockHeight"
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
        <FilterSelect
          :modelValue="selectedChain"
          @update:modelValue="selectedChain = $event"
          :items="chainOptions"
          urlParamName="chain"
        />
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          {{ isMobile ? 'Download' : 'Download Page Data' }}
        </button>
      </template>

      <template #height="{ item }">
        <NuxtLink :to="`/blocks/${item.height}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.height }}</NuxtLink>
      </template>
      <template #status="{ item }">
        <StatusBadge :status="blockStatus(item.height, item.canonical)" />
      </template>
      <template #txn="{ item }">
        <NuxtLink :to="`/transactions/${item.txn}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.txn }}</NuxtLink>
      </template>
      <template #miner="{ item }">
        <div class="flex items-center">
          <Tooltip v-if="item.miner!=='N/A'" :value="item.miner" variant="hash">
            <NuxtLink :to="`/account/${item.miner}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.miner, 10, 10) }}</NuxtLink>
          </Tooltip>
          <Copy v-if="item.miner!=='N/A'" :value="item.miner" tooltipText="Copy Address" />
            <span v-else class="text-[#f5f5f5]">{{ item.miner }}</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>
