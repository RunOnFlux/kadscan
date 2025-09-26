<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import DataTable from '~/components/DataTable.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import Copy from '~/components/Copy.vue';
import FilterSelect from '~/components/FilterSelect.vue';
import Tooltip from '~/components/Tooltip.vue';
import { useAccountNFTTransfers } from '~/composables/useAccountNFTTransfers';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv, downloadCSV } from '~/composables/useCSV';

const props = defineProps<{
  address: string;
}>();

const route = useRoute();
const router = useRouter();
const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();
const { isMobile } = useScreenSize();

const {
  tokenTransfers,
  loading,
  pageInfo,
  totalCount,
  rowsToShow,
  error,
  fetchAccountTokenTransfers,
  updateRowsToShow,
  clearState
} = useAccountNFTTransfers();

const selectedChain = ref({ label: 'All', value: null as string | null });
const chainOptions = computed(() => {
  const options = [{ label: 'All', value: null as string | null }];
  for (let i = 0; i <= 19; i++) {
    options.push({ label: i.toString(), value: i.toString() });
  }
  return options;
});

const initChainFromUrl = () => {
  const q = route.query.chain as string | undefined;
  if (q === undefined) return;
  const n = parseInt(q, 10);
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19;
  if (isValid) {
    selectedChain.value = { label: n.toString(), value: n.toString() };
  } else {
    const newQuery: Record<string, any> = { ...route.query };
    delete newQuery.chain;
    router.replace({ query: newQuery });
    selectedChain.value = { label: 'All', value: null };
  }
};

const tableHeaders = [
  { key: 'requestKey', label: 'Request Key' },
  { key: 'action', label: 'Action' },
  { key: 'height', label: 'Block' },
  { key: 'chainId', label: 'Chain' },
  { key: 'time', label: 'Age' },
  { key: 'sender', label: 'Sender' },
  { key: 'direction', label: '' },
  { key: 'receiver', label: 'Receiver' },
  { key: 'amount', label: 'Amount' },
  { key: 'token', label: 'Token ID' },
];

const rowOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
];

const currentPage = ref(1);
const loadingPage = ref(false);
const isInitialized = ref(false);

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
  if (!tokenTransfers.value || loading.value || !totalCount.value) return '';
  const itemsBefore = (currentPage.value - 1) * rowsToShow.value;
  const remaining = Math.max(totalCount.value - itemsBefore, 0);
  const pageCount = Math.min(rowsToShow.value, remaining);
  const newestIndex = totalCount.value - itemsBefore;
  const oldestIndex = Math.max(newestIndex - pageCount + 1, 1);
  const formattedNewest = new Intl.NumberFormat().format(newestIndex);
  const formattedOldest = new Intl.NumberFormat().format(oldestIndex);
  return `Showing transfers between #${formattedOldest} to #${formattedNewest}`;
});

// Clear state and perform the initial fetch after initializing chain from URL
onMounted(async () => {
  initChainFromUrl();
  clearState();

  const network = selectedNetwork.value;
  if (network && props.address) {
    loadingPage.value = true;
    const params: { networkId: string; accountName: string; chainId?: string } = {
      networkId: network.id,
      accountName: props.address,
    };
    if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
    await fetchAccountTokenTransfers(params);
    loadingPage.value = false;
  }

  isInitialized.value = true;
});

// System address display for mint/burn
const SYSTEM_ADDRESS = 'k:system';

// Keep selectedChain in sync with the URL
watch(() => route.query.chain, (q) => {
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

// 1) React to network or chain change
watch(
  [selectedNetwork, selectedChain, () => props.address],
  async ([network], [oldNetwork, oldChain]) => {
    if (!isInitialized.value) return;
    if (!network || !props.address) return;

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    const chainChanged = !!oldChain && selectedChain.value.value !== oldChain.value;

    if (networkChanged || chainChanged) {
      currentPage.value = 1;
      const params: { networkId: string; accountName: string; chainId?: string } = {
        networkId: network.id,
        accountName: props.address,
      };
      if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
      loadingPage.value = true;
      await fetchAccountTokenTransfers(params);
      loadingPage.value = false;
    }
  }
);

// 2) React to rows-per-page change
watch(rowsToShow, async (newRows, oldRows) => {
  const network = selectedNetwork.value;
  if (!network || !props.address) return;
  if (newRows === oldRows) return;
  currentPage.value = 1;
  const params: { networkId: string; accountName: string; chainId?: string } = {
    networkId: network.id,
    accountName: props.address,
  };
  if (selectedChain.value.value !== null) params.chainId = selectedChain.value.value as string;
  await fetchAccountTokenTransfers(params);
  loadingPage.value = false;
});

// 3) React to page change only: fetch next/prev using cursors
watch(currentPage, async (newPage, oldPage) => {
  const network = selectedNetwork.value;
  if (!network || !props.address) return;
  if (!newPage || newPage === oldPage) return;

  const params: { networkId: string; accountName: string; after?: string; before?: string; toLastPage?: boolean; chainId?: string } = {
    networkId: network.id,
    accountName: props.address,
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

  await fetchAccountTokenTransfers(params);
  loadingPage.value = false;
});

// CSV download
function downloadData() {
  const rows = (tokenTransfers.value || []).map((it: any) => ({
    ...it,
    time: it?.timeUtc || it?.time,
  }))
  const csv = exportableToCsv(rows, tableHeaders);
  downloadCSV(csv, `kadena-account-token-transfers-page-${currentPage.value}.csv`);
}
</script>

<template>
  <div>
    <SkeletonTable v-if="loading" />

    <DataTable
      v-else-if="tokenTransfers && tokenTransfers.length > 0"
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
      <template #actions>
        <FilterSelect
          :modelValue="selectedChain"
          @update:modelValue="selectedChain = $event"
          :items="chainOptions"
          urlParamName="chain"
        />
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-font-primary bg-surface-disabled border border-[#222222] rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-font-secondary" />
          <span class="hidden md:inline">Download</span>
        </button>
      </template>

      <template #requestKey="{ item }">
        <div class="flex items-center">
          <Tooltip :value="item.requestKey" variant="hash">
            <NuxtLink :to="`/transactions/${item.requestKey}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.requestKey, 10, 8) }}</NuxtLink>
          </Tooltip>
          <Copy :value="item.requestKey" tooltipText="Copy Transaction Request Key" />
        </div>
      </template>
      <template #height="{ item }">
        <span v-if="item.time === 0 || item.height === 0" class="text-font-primary">Genesis</span>
        <NuxtLink v-else :to="`/blocks/${item.height}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.height }}</NuxtLink>
      </template>
      <template #sender="{ item }">
        <div class="flex items-center">
          <template v-if="item.sender && item.sender !== 'N/A'">
            <template v-if="item.sender === SYSTEM_ADDRESS">
              <span class="text-font-primary">{{ item.sender }}</span>
            </template>
            <template v-else>
              <Tooltip :value="item.sender" variant="hash">
                <NuxtLink :to="`/account/${item.sender}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.sender, 10, 10) }}</NuxtLink>
              </Tooltip>
              <Copy :value="item.sender" tooltipText="Copy Address" />
            </template>
          </template>
          <span v-else class="text-font-primary">NaN</span>
        </div>
      </template>
      <template #action="{ item }">
        <span class="px-2 py-1.5 rounded-md border border-[#333333] bg-surface-disabled text-[11px] text-font-primary font-normal inline-flex items-center justify-center leading-none w-[92px]">
          {{ item.action }}
        </span>
      </template>
      <template #receiver="{ item }">
        <div class="flex items-center">
          <template v-if="item.receiver && item.receiver !== 'N/A'">
            <template v-if="item.receiver === SYSTEM_ADDRESS">
              <span class="text-font-primary">{{ item.receiver }}</span>
            </template>
            <template v-else>
              <Tooltip :value="item.receiver" variant="hash">
                <NuxtLink :to="`/account/${item.receiver}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.receiver, 10, 10) }}</NuxtLink>
              </Tooltip>
              <Copy :value="item.receiver" tooltipText="Copy Address" />
            </template>
          </template>
          <span v-else class="text-font-primary">NaN</span>
        </div>
      </template>
      <template #direction="{ item }">
        <div class="flex items-center">
          <span
            :class="[
              'py-1.5 text-[11px] rounded-md border inline-flex items-center justify-center leading-none w-[48px]',
              item.direction === 'IN' 
                ? 'bg-[#0f1f1d] border-[#00a18680] text-font-accent'
                : 'bg-[#17150d] border-[#fbbf2480] text-[#fbbf24]'
            ]"
          >
            {{ item.direction }}
          </span>
        </div>
      </template>
      <template #amount="{ item }">
        <div class="inline-flex items-center justify-start">
          <span class="text-font-primary">{{ item.amount }}</span>
        </div>
      </template>
      <template #token="{ item }">
        <div class="flex items-center">
          <Tooltip :value="item.token" variant="hash">
            <span class="text-font-primary">{{ truncateAddress(item.token, 8, 10) }}</span>
          </Tooltip>
          <Copy :value="item.token" tooltipText="Copy Token ID" />
        </div>
      </template>
    </DataTable>

    <!-- Empty state -->
    <div v-else class="bg-surface-primary border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex flex-col items-center justify-center py-12">
        <img src="/empty/txs.png" alt="No token transfers" class="w-24 h-24 mb-4 opacity-50" />
        <h3 class="text-font-primary text-lg font-medium mb-2">No token transfers yet</h3>
        <p class="text-font-secondary text-sm text-center">
          This account hasn't made any token transfers yet.
        </p>
      </div>
    </div>
  </div>
</template> 