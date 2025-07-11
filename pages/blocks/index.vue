<script setup lang="ts">
import { ref, watch } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';
import { useBlocks } from '~/composables/useBlocks';
import { useFormat } from '~/composables/useFormat';

definePageMeta({
  layout: 'app',
});

useHead({
  title: 'Blocks'
});

const route = useRoute();
const router = useRouter();
const { blocks, loading, fetchBlocks } = useBlocks();
const { truncateAddress } = useFormat();

const mockedCards = [
  { label: 'NETWORK UTILIZATION (24H)', value: '--' },
  { label: 'LAST SAFE BLOCK', value: '--' },
  { label: 'BLOCKS PRODUCED (24H)', value: '--' },
  { label: 'REWARDS GIVEN (24H)', value: '--' },
];

const tableHeaders = [
  { key: 'block', label: 'Block' },
  { key: 'chainId', label: 'Chain ID' },
  { key: 'age', label: 'Age' },
  { key: 'txn', label: 'Txn' },
  { key: 'miner', label: 'Miner Account' },
  { key: 'gasLimit', label: 'Gas Limit' },
  { key: 'gasPrice', label: 'Gas Price' },
  { key: 'reward', label: 'Reward' },
];

const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];
const selectedRows = ref(rowOptions[0]);

const currentPage = ref(Number(route.query.page) || 1);
const totalPages = ref(915537); // This will likely need to be updated from API data later

watch(currentPage, (newPage) => {
  router.push({ query: { ...route.query, page: newPage } });
});

watch(selectedRows, (newSelectedRows) => {
  fetchBlocks(newSelectedRows.value);
}, { immediate: true });

</script>

<template>
  <div>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Blocks
      </h1>
    </div>

    <StatsGrid :cards="mockedCards" />
    
    <div v-if="loading" class="text-white text-center p-8">Loading...</div>
    <DataTable
      v-else
      :headers="tableHeaders"
      :items="blocks"
      :totalItems="22888423"
      itemNamePlural="blocks"
      subtitle="(Showing blocks between #22888398 to #22888422)"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="selectedRows"
      :rowOptions="rowOptions"
    >
      <template #actions>
        <button class="flex items-center gap-2 px-2 py-1 text-[12px] font-medium text-[#fafafa] bg-[#151515] border border-gray-600 rounded-md hover:bg-[#252525]">
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          Download Page Data
        </button>
      </template>

      <template #block="{ item }">
        <NuxtLink :to="`/blocks/${item.block}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.block }}</NuxtLink>
      </template>
      <template #txn="{ item }">
        <NuxtLink :to="`/blocks/${item.block}/chain/${item.chainId}/transactions`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.txn }}</NuxtLink>
      </template>
      <template #miner="{ item }">
        <NuxtLink to="#" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.miner, 10, 10) }}</NuxtLink>
      </template>
      <template #gasLimit="{ item }">
        <span class="text-[#f5f5f5]">{{ item.gasLimit }}</span>
      </template>
    </DataTable>
  </div>
</template>
