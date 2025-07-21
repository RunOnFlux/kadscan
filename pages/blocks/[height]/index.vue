<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import SkeletonTable from '~/components/skeleton/Table.vue';
import IconHourglass from '~/components/icon/Hourglass.vue';
import IconCancel from '~/components/icon/Cancel.vue';
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue';
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
  fetchBlocksByHeight,
  totalCount: lastBlockHeight,
  fetchTotalCount,
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

function blockStatus(blockHeight: number, canonical: boolean) {
  if(lastBlockHeight.value - 10 >= blockHeight && !canonical) {
    return {
      text: 'Orphaned',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f87171] text-[#f87171]',
      description: 'Block is not part of the canonical chain and is orphaned',
    };
  }

  if(canonical) {
    return {
      text: 'Finalized',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a186] text-[#00a186]',
      description: 'Block is part of the canonical chain and safe to use',
    };
  }

  return {
    text: 'Pending',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#444649] text-[#989898]',
    description: 'Block is not part of the canonical chain and is pending to be finalized or orphaned',
  };
};

watch(
  [height, selectedNetwork],
  async ([newHeight, network], [oldHeight, oldNetwork]) => {
    if (!network || !newHeight) {
      return;
    }

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;
    if (networkChanged) {
      await fetchTotalCount({ networkId: network.id });
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
        <Tooltip :value="blockStatus(item.height, item.canonical).description" :offset-distance="8">
          <div
            v-if="blockStatus"
            class="px-2 py-1.5 text-[11px] rounded-md border flex items-center gap-1 leading-none"
            :class="blockStatus(item.height, item.canonical).classes"
          >
            <component :is="blockStatus(item.height, item.canonical).icon" class="w-2.5 h-2.5" />
            <span>
              {{ blockStatus(item.height, item.canonical).text }}
            </span>
          </div>
        </Tooltip>
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