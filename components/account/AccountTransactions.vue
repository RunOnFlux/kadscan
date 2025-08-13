<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import { useStatus } from '~/composables/useStatus';
import StatusBadge from '~/components/StatusBadge.vue';
import DataTable from '~/components/DataTable.vue';
import FilterSelect from '~/components/FilterSelect.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import ColumnGas from '~/components/column/Gas.vue';
import { useAccountTransactions } from '~/composables/useAccountTransactions';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv, downloadCSV } from '~/composables/csv';
import { useBlocks } from '~/composables/useBlocks';

const props = defineProps<{
  accountName: string;
}>();

const route = useRoute();
const router = useRouter();
const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();
const { isMobile } = useScreenSize();

const { 
  transactions,
  loading,
  fetchAccountTransactions,
  pageInfo,
  totalCount,
  fetchTotalCount,
  rowsToShow,
  updateRowsToShow,
  clearState: clearTransactionsState,
} = useAccountTransactions();

const { 
  totalCount: lastBlockHeight, 
  fetchTotalCount: fetchLastBlockHeight, 
  error: blocksError, 
  clearState: clearBlocksState 
} = useBlocks();

const selectedChain = ref({ label: 'All', value: null as string | null });
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null as string | null }];
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() });
  }
  return options;
});

const initChainFromUrl = () => {
  const q = route.query.chainId as string | undefined;
  if (q === undefined) return;
  const n = parseInt(q, 10);
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19;
  if (isValid) {
    selectedChain.value = { label: n.toString(), value: n.toString() };
  } else {
    const newQuery: Record<string, any> = { ...route.query };
    delete newQuery.chainId;
    router.replace({ query: newQuery });
    selectedChain.value = { label: 'All', value: null };
  }
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
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
];

const currentPage = ref(1);
const loadingPage = ref(false);

const selectedRowOption = computed({
  get: () => rowOptions.find(option => option.value === rowsToShow.value) || rowOptions[0],
  set: (value) => {
    if (value) updateRowsToShow(value);
  },
});

const totalPages = computed(() => {
  if (!totalCount.value) return 1;
  return Math.ceil(totalCount.value / rowsToShow.value);
});

const subtitle = computed(() => {
  if (!transactions.value || loading.value || !totalCount.value) return '';
  const itemsBefore = (currentPage.value - 1) * rowsToShow.value;
  const remaining = Math.max(totalCount.value - itemsBefore, 0);
  const pageCount = Math.min(rowsToShow.value, remaining);
  const newestTxIndex = totalCount.value - itemsBefore;
  const oldestTxIndex = Math.max(newestTxIndex - pageCount + 1, 1);
  const formattedNewest = new Intl.NumberFormat().format(newestTxIndex);
  const formattedOldest = new Intl.NumberFormat().format(oldestTxIndex);
  return `(Showing transactions between #${formattedOldest} to #${formattedNewest})`;
});

function getFeeInKda(item: any) {
  if (!item.gas || !item.rawGasPrice) return '0.0 KDA';
  const feeInKda = item.gas * item.rawGasPrice;
  if (feeInKda === 0) return '0.0 KDA';
  const formattedFee = new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 12 }).format(feeInKda);
  return `${formattedFee} KDA`;
}

const { transactionStatus } = useStatus(lastBlockHeight);

// Filter out transactions from orphaned blocks
const filteredTransactions = computed(() => {
  if (!transactions.value || !lastBlockHeight || !lastBlockHeight.value) return [] as any[];
  return transactions.value.filter((tx: any) => !(lastBlockHeight.value - 10 >= tx.height && !tx.canonical));
});

// Clear state on mount to show skeleton
onMounted(() => {
  initChainFromUrl();
  clearTransactionsState();
  clearBlocksState();
});

// Keep selectedChain in sync with the URL even when the table is not rendered
watch(() => route.query.chainId, (q) => {
  const str = typeof q === 'string' ? q : undefined;
  if (str === undefined) {
    selectedChain.value = { label: 'All', value: null };
    return;
  }
  const n = parseInt(str, 10);
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19;
  selectedChain.value = isValid
    ? { label: n.toString(), value: n.toString() }
    : { label: 'All', value: null };
});

// 1) React to network or chain change: reset to page 1 and refresh counts
watch(
  [selectedNetwork, selectedChain],
  async ([network], [oldNetwork, oldChain]) => {
    if (!network || !props.accountName) return;

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    const chainChanged = !!oldChain && selectedChain.value.value !== oldChain.value;

    if (networkChanged || chainChanged) {
      await fetchLastBlockHeight({ networkId: network.id });
      currentPage.value = 1;
      const params: { networkId: string; accountName: string; chainId?: string } = {
        networkId: network.id,
        accountName: props.accountName,
      };
      if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
      await fetchAccountTransactions(params);
      loadingPage.value = false;
    }
  },
  { immediate: true }
);

// 2) React to rows-per-page change: reset to page 1 and refetch
watch(rowsToShow, async (newRows, oldRows) => {
  const network = selectedNetwork.value;
  if (!network || !props.accountName) return;
  if (newRows === oldRows) return;
  currentPage.value = 1;
  const params: { networkId: string; accountName: string; chainId?: string } = {
    networkId: network.id,
    accountName: props.accountName,
  };
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
  await fetchAccountTransactions(params);
  loadingPage.value = false;
});

// 3) React to page change only: fetch the next/prev page using cursors
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value;
  if (!network || !props.accountName) return;
  if (!newPage || newPage === oldPage) return;

  const params: { networkId: string; accountName: string; after?: string; before?: string; toLastPage?: boolean; chainId?: string } = {
    networkId: network.id,
    accountName: props.accountName,
  };
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;

  if (newPage > oldPage) {
    params.after = pageInfo.value?.endCursor;
  } else if (newPage < oldPage) {
    params.before = pageInfo.value?.startCursor;
  }

  if (newPage === totalPages.value) {
    params.after = null as any;
    params.before = null as any;
    params.toLastPage = true;
  }

  await fetchAccountTransactions(params);
  loadingPage.value = false;
});

// CSV download
function downloadData() {
  const csv = exportableToCsv(filteredTransactions.value, tableHeaders);
  downloadCSV(csv, `kadena-account-transactions-page-${currentPage.value}.csv`);
}
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else-if="filteredTransactions && filteredTransactions.length > 0"
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
          urlParamName="chainId"
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
    
    <!-- Empty state -->
    <div v-else class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No transactions" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-[#fafafa] text-lg font-medium mb-2">No transactions yet</h3>
        <p class="text-[#bbbbbb] text-sm text-center">
          This account hasn't made any transactions yet.
        </p>
      </div>
    </div>
  </div>
</template>