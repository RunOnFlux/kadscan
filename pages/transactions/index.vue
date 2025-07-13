<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import IconDownload from '~/components/icon/Download.vue';
import DataTable from '~/components/DataTable.vue';
import Tooltip from '~/components/Tooltip.vue';
import Copy from '~/components/Copy.vue';
import { useTransactions } from '~/composables/useTransactions';
import { useFormat } from '~/composables/useFormat';
import { useSharedData } from '~/composables/useSharedData';

definePageMeta({
  layout: 'app',
});

useHead({
  title: 'Transactions'
});

const route = useRoute();
const router = useRouter();
const { transactions, loading, fetchTransactions, pageInfo, totalCount } = useTransactions();
const { truncateAddress } = useFormat();
const { selectedNetwork } = useSharedData();

const subtitle = computed(() => {
  if (transactions.value.length === 0 || loading.value) {
    return '';
  }
  const formattedTotal = new Intl.NumberFormat().format(totalCount.value);
  return `(Showing ${transactions.value.length} of ${formattedTotal} transactions)`;
});

const tableHeaders = [
  { key: 'requestKey', label: 'Request Key' },
  { key: 'block', label: 'Block' },
  { key: 'chainId', label: 'Chain ID' },
  { key: 'time', label: 'Time' },
  { key: 'sender', label: 'Sender' },
  { key: 'gasPrice', label: 'Gas Price' },
  { key: 'gas', label: 'Gas' },
];

const rowOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];
const rowsToShow = ref(rowOptions[0]);
const currentPage = ref(Number(route.query.page) || 1);

const totalPages = computed(() => {
  if (!totalCount.value) return 1;
  return Math.ceil(totalCount.value / rowsToShow.value.value);
});

watch(
  [currentPage, rowsToShow],
  ([newPage, newRows], [oldPage, oldRows]) => {
    const query = { ...route.query, page: newPage };
    if (newRows.value !== oldRows?.value) {
      query.page = 1;
      currentPage.value = 1;
    }
    router.push({ query });
  },
  { deep: true }
);

watch(
  [() => route.query.page, selectedNetwork],
  ([page, network], [oldPage, oldNetwork]) => {
    if (!network) {
      return;
    }

    const networkChanged = !oldNetwork || network.id !== oldNetwork.id;

    if (networkChanged) {
      if (Number(page) !== 1) {
        router.push({ query: { page: 1 } });
        return;
      }
    }

    const pageNumber = Number(page) || 1;
    const oldPageNumber = Number(oldPage) || 1;

    const params: { networkId: string; limit: number, after?: string, before?: string } = {
      networkId: network.id,
      limit: rowsToShow.value.value
    };

    if (pageNumber > 1) {
      if (pageNumber > oldPageNumber) {
        params.after = pageInfo.value?.endCursor;
      } else {
        params.before = pageInfo.value?.startCursor;
      }
    }
    
    fetchTransactions(params);
    currentPage.value = pageNumber;
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>

<template>
  <div>
    <div class="flex items-center justify-between pb-5 border-b border-[#222222] mb-6">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Transactions
      </h1>
    </div>

    <div v-if="loading" class="text-white text-center p-8">Loading...</div>
    <DataTable
      v-else
      :headers="tableHeaders"
      :items="transactions"
      :totalItems="totalCount"
      itemNamePlural="transactions"
      :subtitle="subtitle"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      v-model:selectedRows="rowsToShow"
      :rowOptions="rowOptions"
      :has-next-page="pageInfo?.hasNextPage"
      :has-previous-page="pageInfo?.hasPreviousPage"
    >
      <template #actions>
        <button class="flex items-center gap-2 px-2 py-1 text-[12px] font-normal text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap">
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
          Download Page Data
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
      <template #block="{ item }">
        <NuxtLink :to="`/blocks/${item.block}/chain/${item.chainId}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ item.block }}</NuxtLink>
      </template>
      <template #sender="{ item }">
        <div class="flex items-center">
          <Tooltip :value="item.sender" variant="hash">
            <NuxtLink :to="`/account/${item.sender}`" class="text-[#6ab5db] hover:text-[#9ccee7]">{{ truncateAddress(item.sender, 10, 10) }}</NuxtLink>
          </Tooltip>
          <Copy :value="item.sender" tooltipText="Copy Address" />
        </div>
      </template>
    </DataTable>
  </div>
</template>
