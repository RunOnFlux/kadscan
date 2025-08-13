<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';
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
} = useBlocks();

useHead({
  title: `Blocks at Height #${height.value}`
});

const subtitle = computed(() => {
  if (blocks.value.length === 0 || loading.value) {
    return '';
  }
  return `(Showing all chains for block height #${height.value})`;
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

// Redirect to error page when transaction is not found
watch(error, (newError) => {
  if (newError) {
    navigateTo('/error', { replace: true })
  }
})

function downloadData() {
  const csv = exportableToCsv(blocks.value, tableHeaders);
  downloadCSV(csv, `kadena-blocks-height-${height.value}.csv`);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
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
        <NuxtLink :to="`/transactions?block=${item.height}&chainId=${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.txn }}</NuxtLink>
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