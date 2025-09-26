<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import ErrorOverlay from '~/components/error/Overlay.vue';
import { useStatus } from '~/composables/useStatus';
import StatusBadge from '~/components/StatusBadge.vue';
import { useBlocks } from '~/composables/useBlocks';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import { exportableToCsv, downloadCSV } from '~/composables/useCSV';

definePageMeta({
  layout: 'app',
});

const route = useRoute();
const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();
const { isMobile } = useScreenSize();

const height = computed(() => Number(route.params.height));

const {
  blocksByHeight: blocks,
  loadingByHeight: loading,
  error,
  fetchBlocksByHeight,
  lastBlockHeight,
  fetchLastBlockHeight,
  clearState,
} = useBlocks();

useHead({
  title: 'Blocks'
});

onMounted(() => {
  // Fresh page mount: clear state so skeleton shows correctly
  clearState();
});

const subtitle = computed(() => {
  if (blocks.value.length === 0 || loading.value) {
    return '';
  }
  return `Showing all chains for block height #${height.value}`;
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

const { blockStatus } = useStatus(lastBlockHeight);

watch(
  [height, selectedNetwork],
  async ([newHeight, network], [oldHeight, oldNetwork]) => {
    if (!network || !newHeight) {
      return;
    }

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    if (networkChanged) {
      // Fresh mount or network switch: clear state so skeleton shows
      clearState();
      await fetchLastBlockHeight({ networkId: network.id });
    }

    await fetchBlocksByHeight({
      networkId: network.id,
      height: newHeight,
    });
  },
  {
    immediate: true,
    deep: true,
  }
);


function downloadData() {
  const exportRows = (blocks.value || []).map((item: any) => ({
    ...item,
    age: item?.timeUtc || item?.age,
    status: blockStatus(item.height, item.canonical).text,
  }))
  const csv = exportableToCsv(exportRows, tableHeaders);
  downloadCSV(csv, `kadena-blocks-height-${height.value}.csv`);
}
</script>

<template>
  <ErrorOverlay v-if="error" :message="error?.message" />
  <div v-else>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-font-primary">
        Blocks
      </h1>
    </div>

    <SkeletonTable v-if="loading" />

    <DataTable
      v-else
      :headers="tableHeaders"
      :items="blocks"
      :totalItems="blocks.length"
      itemNamePlural="blocks"
      :subtitle="subtitle"
      :currentPage="1"
      :totalPages="1"
      :selectedRows="{ label: String(blocks.length), value: blocks.length }"
      :rowOptions="[{ label: String(blocks.length), value: blocks.length }]"
      :loadingPage="false"
      :has-next-page="false"
      :has-previous-page="false"
    >
      <template #actions>
        <button
          @click="downloadData"
          class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-font-primary bg-surface-disabled border border-[#222222] rounded-md hover:bg-surface-hover whitespace-nowrap"
        >
          <IconDownload class="w-4 h-4 text-font-secondary" />
          <span class="hidden md:inline">Download</span>
        </button>
      </template>

      <template #height="{ item }">
        <NuxtLink :to="`/blocks/${item.height}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.height }}</NuxtLink>
      </template>
      <template #status="{ item }">
        <StatusBadge :status="blockStatus(item.height, item.canonical)" />
      </template>
      <template #txn="{ item }">
        <NuxtLink :to="`/transactions?block=${item.height}&chain=${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.txn }}</NuxtLink>
      </template>
      <template #miner="{ item }">
        <div class="flex items-center">
          <Tooltip v-if="item.miner!=='N/A'" :value="item.miner" variant="hash">
            <NuxtLink :to="`/account/${item.miner}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.miner, 10, 10) }}</NuxtLink>
          </Tooltip>
          <Copy v-if="item.miner!=='N/A'" :value="item.miner" tooltipText="Copy Address" />
            <span v-else class="text-font-primary">{{ item.miner }}</span>
        </div>
      </template>
    </DataTable>
  </div>
</template> 