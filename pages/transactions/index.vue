<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import IconHourglass from '~/components/icon/Hourglass.vue';
import IconCancel from '~/components/icon/Cancel.vue';
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue';
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

const { totalCount: lastBlockHeight, fetchTotalCount: fetchLastBlockHeight } = useBlocks();

const { 
  transactions, 
  loading, 
  fetchTransactions,
  pageInfo, 
  totalCount, 
  fetchTotalCount, 
  rowsToShow, 
  updateRowsToShow,
  clearState,
} = useTransactions();

// Chain filter state - initialize from URL parameters (commented due to query glitch)
const selectedChain = ref({ label: 'All', value: null });

// Clear global state on mount to show skeleton on page navigation
onMounted(() => {
  clearState();
});

// Initialize chain filter from URL parameter on component mount (commented due to query glitch)
// onMounted(() => {
//   const chainParam = route.query.chain;
//   if (chainParam && chainParam !== 'all') {
//     const chainValue = parseInt(chainParam as string);
//     if (!isNaN(chainValue) && chainValue >= 0 && chainValue <= 19) {
//       selectedChain.value = { label: chainValue.toString(), value: chainValue.toString() };
//     }
//   }
// });

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

  const newestTxIndex = totalCount.value - ((currentPage.value - 1) * rowsToShow.value);
  const oldestTxIndex = newestTxIndex - filteredTransactions.value.length + 1;

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

function blockStatus(blockHeight: number, canonical: boolean, badResult: any) {
  if((lastBlockHeight.value - 10 >= blockHeight && !canonical) || badResult !== null) {
    return {
      text: 'Failed',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f8717180] text-[#f87171]',
      description: 'Transaction failed to execute',
    };
  }

  if(canonical) {
    return {
      text: 'Success',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a18680] text-[#00a186]',
      description: 'Transaction executed successfully',
    };
  }

  return {
    text: 'Pending',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#44464980] text-[#989898]',
    description: 'Transaction is pending to be finalized',
  };
};

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

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    const chainChanged = oldChain && selectedChain.value.value !== oldChain.value;
    
    if (networkChanged) {
      await fetchTotalCount({ networkId: network.id });
      await fetchLastBlockHeight({ networkId: network.id }); // Fetch lastBlockHeight from useBlocks
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

    const params: { networkId: string; after?: string, before?: string, toLastPage?: boolean, chainId?: string } = {
      networkId: network.id,
    };

    // Add chainIds filter if a specific chain is selected
    if (selectedChain.value.value !== null) {
      console.log("selectedChain.value.value", selectedChain.value.value);
      params.chainId = selectedChain.value.value;
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

    await fetchTransactions(params);
    currentPage.value = pageNumber;
    loadingPage.value = false;
  },
  {
    immediate: true,
    deep: true,
  }
);

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
        <!-- TODO: fix filter select (query glitch with chainId variable) -->
        <!-- <FilterSelect
          :modelValue="selectedChain"
          @update:modelValue="selectedChain = $event"
          :items="chainOptions"
          urlParamName="chain"
        /> -->
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
        <Tooltip :value="blockStatus(item.height, item.canonical, item.badResult).description" :offset-distance="8">
          <div
            v-if="blockStatus"
            class="px-2 py-1.5 text-[11px] rounded-md border flex items-center gap-1 leading-none"
            :class="blockStatus(item.height, item.canonical, item.badResult).classes"
          >
            <component :is="blockStatus(item.height, item.canonical, item.badResult).icon" class="w-2.5 h-2.5" />
            <span>
              {{ blockStatus(item.height, item.canonical, item.badResult).text }}
            </span>
          </div>
        </Tooltip>
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
