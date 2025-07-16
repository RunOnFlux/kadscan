<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import { useBlocks } from '~/composables/useBlocks';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
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

const {
  blocks,
  loading,
  fetchBlocks,
  pageInfo,
  totalCount,
  fetchTotalCount,
  rowsToShow,
  updateRowsToShow
} = useBlocks();

/// TODO: get real analytics
// const mockedCards = [
//   { label: 'NETWORK UTILIZATION (24H)', value: '--' },
//   { label: 'LAST SAFE BLOCK', value: '--' },
//   { label: 'BLOCKS PRODUCED (24H)', value: '--' },
//   { label: 'REWARDS GIVEN (24H)', value: '--' },
// ];

const subtitle = computed(() => {
  if (blocks.value.length === 0 || loading.value) {
    return '';
  }
  const blockNumbers = blocks.value.map((b: any) => b.block);
  const oldestBlock = Math.min(...blockNumbers);
  const latestBlock = Math.max(...blockNumbers);
  return `(Showing blocks between #${oldestBlock} to #${latestBlock})`;
});

const tableHeaders = [
  { key: 'block', label: 'Block' },
  { key: 'chainId', label: 'Chain ID' },
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
  [() => route.query.page, selectedNetwork, rowsToShow],
  ([page, network], [oldPage, oldNetwork, oldRows]) => {
    if (!network) {
      return;
    }

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    if (networkChanged) {
      fetchTotalCount({ networkId: network.id });
    }

    if (rowsToShow.value !== oldRows && Number(page) !== 1) {
      router.push({ query: { page: 1 } });
      return;
    }

    if (networkChanged && Number(page) !== 1) {
      router.push({ query: { page: 1 } });
      return;
    }

    const pageNumber = Number(page) || 1;
    const oldPageNumber = Number(oldPage) || 1;

    const params: { networkId: string; after?: string, before?: string } = {
      networkId: network.id,
    };

    if (pageNumber > 1) {
      if (pageNumber > oldPageNumber) {
        params.after = pageInfo.value?.endCursor;
      } else {
        params.before = pageInfo.value?.startCursor;
      }
    }
    
    fetchBlocks(params);
    currentPage.value = pageNumber;
  },
  {
    immediate: true,
    deep: true,
  }
);

function downloadData() {
  const csv = exportableToCsv(blocks.value, tableHeaders);
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
      :items="blocks"
      :totalItems="totalCount"
      itemNamePlural="blocks"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRowOption"
      :rowOptions="rowOptions"
      :has-next-page="pageInfo?.hasNextPage"
      :has-previous-page="pageInfo?.hasPreviousPage"
    >
      <template #actions>
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          Download Page Data
        </button>
      </template>

      <template #block="{ item }">
        <NuxtLink :to="`/blocks/${item.block}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.block }}</NuxtLink>
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
      <template #gasLimit="{ item }">
        <span class="text-[#f5f5f5]">{{ item.gasLimit }}</span>
      </template>
    </DataTable>
  </div>
</template>
