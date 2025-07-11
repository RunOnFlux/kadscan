<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import Select from '~/components/Select.vue';
import StatsGrid from '~/components/StatsGrid.vue';
import IconChevron from '~/components/icon/Chevron.vue';
import PaginationControls from '~/components/PaginationControls.vue';

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

    <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-[15px] text-normal text-[#f5f5f5]">
            Total of 22,888,423 blocks
          </h2>
          <p class="text-[13px] text-[#bbbbbb]">
            (Showing blocks between #22888398 to #22888422)
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="flex items-center gap-2 px-2 py-1 text-[12px] font-medium text-[#fafafa] bg-[#151515] border border-gray-600 rounded-md hover:bg-[#252525]">
            <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
            Download Page Data
          </button>
          <PaginationControls
            v-model:currentPage="currentPage"
            :totalPages="totalPages"
          />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[#222222]">
          <thead class="bg-transparent">
            <tr>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Block</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Chain ID</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Age</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Txn</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Miner Account</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Gas Used</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Gas Limit</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Gas Price</th>
              <th scope="col" class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]">Reward</th>
            </tr>
          </thead>
          <tbody class="bg-transparent divide-y divide-[#222222]">
            <tr v-for="block in mockedBlocks" :key="block.block">
              <td class="px-4 py-3 whitespace-nowrap text-[15px]">
                <NuxtLink :to="`/blocks/${block.block}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ block.block }}</NuxtLink>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px] text-[#f5f5f5]">{{ block.chainId }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px] text-[#f5f5f5]">{{ block.age }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px]">
                <NuxtLink :to="`/blocks/${block.block}/chain/${block.chainId}/transactions`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ block.txn }}</NuxtLink>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px]">
                <NuxtLink to="#" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ block.miner }}</NuxtLink>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px] text-[#f5f5f5]">
                {{ formatNumber(block.gasUsed) }} <span class="text-[13px] text-[#bbbbbb]">({{ block.gasUsedPercent }}%)</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px] text-[#f5f5f5]">{{ block.gasLimit }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px] text-[#f5f5f5]">{{ block.gasPrice }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-[15px] text-[#f5f5f5]">{{ block.reward }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pt-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-[15px] text-[#bbbbbb]">Show rows:</span>
          <div class="border border-gray-600 rounded-md">
            <Select
              v-model="selectedRows"
              :items="rowOptions"
              position="top-left"
            />
          </div>
        </div>
        <PaginationControls
          v-model:currentPage="currentPage"
          :totalPages="totalPages"
        />
      </div>
    </div>
  </div>
</template>
