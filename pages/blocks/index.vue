<script setup lang="ts">
import { ref, watch } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import DataTable from '~/components/DataTable.vue';

definePageMeta({
  layout: 'app',
});

useHead({
  title: 'Blocks'
});

const route = useRoute();
const router = useRouter();

const mockedCards = [
  { label: 'NETWORK UTILIZATION (24H)', value: '50.5%' },
  { label: 'LAST SAFE BLOCK', value: '22888387' },
  { label: 'BLOCKS BY MEV BUILDERS (24H)', value: '94.3%' },
  { label: 'BURNED FEES', value: '4,598,326.61 KDA' },
];

const tableHeaders = [
  { key: 'block', label: 'Block' },
  { key: 'chainId', label: 'Chain ID' },
  { key: 'age', label: 'Age' },
  { key: 'txn', label: 'Txn' },
  { key: 'miner', label: 'Miner Account' },
  { key: 'gasUsed', label: 'Gas Used' },
  { key: 'gasLimit', label: 'Gas Limit' },
  { key: 'gasPrice', label: 'Gas Price' },
  { key: 'reward', label: 'Reward' },
];

const mockedBlocks = [
  {
    block: '22888422',
    chainId: '14',
    age: '14 secs ago',
    txn: '272',
    miner: 'BuilderNet',
    gasUsed: 18536889,
    gasUsedPercent: 51.49,
    gasLimit: '36,000,000',
    gasPrice: '2.209 Gwei',
    reward: '0.01983 KDA',
  },
  {
    block: '22888421',
    chainId: '1',
    age: '26 secs ago',
    txn: '344',
    miner: 'BuilderNet',
    gasUsed: 35984476,
    gasUsedPercent: 99.96,
    gasLimit: '36,000,000',
    gasPrice: '1.964 Gwei',
    reward: '0.07411 KDA',
  },
  {
    block: '22888420',
    chainId: '5',
    age: '38 secs ago',
    txn: '8',
    miner: 'rrsync-builder.eth',
    gasUsed: 1591017,
    gasUsedPercent: 4.42,
    gasLimit: '36,035,121',
    gasPrice: '2.216 Gwei',
    reward: '0.00275 KDA',
  },
];

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
}

const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];
const selectedRows = ref(rowOptions[0]);

const currentPage = ref(Number(route.query.page) || 1);
const totalPages = ref(915537);

watch(currentPage, (newPage) => {
  router.push({ query: { ...route.query, page: newPage } });
});

</script>

<template>
  <div>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Blocks
      </h1>
    </div>

    <StatsGrid :cards="mockedCards" />

    <DataTable
      :headers="tableHeaders"
      :items="mockedBlocks"
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
        <NuxtLink to="#" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.miner }}</NuxtLink>
      </template>
      <template #gasUsed="{ item }">
        <span class="text-[#f5f5f5]">{{ formatNumber(item.gasUsed) }}</span>
        <span class="text-[13px] text-[#bbbbbb]"> ({{ item.gasUsedPercent }}%)</span>
      </template>
    </DataTable>
  </div>
</template>
