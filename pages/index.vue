<script setup lang="ts">
import { useBlockFeed } from '~/composables/useBlockFeed';
import { useTransactionFeed } from '~/composables/useTransactionFeed';

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Kadscan'
})

const defaultChartData = {
  market_caps: [],
  prices: [],
  total_volumes: []
}

const { $coingecko } = useNuxtApp();

const { data: cgData, status: cgStatus, error: cgError } = await useAsyncData('home-cg-etl', async () => {
  const [
    token,
    chartData,
  ] = await Promise.all([
    $coingecko.request('coins/kadena'),
    $coingecko.request('coins/kadena/market_chart', {
      days: 14,
      interval: 'daily',
      vs_currency: 'usd',
    })
  ]);

  return {
    token,
    chartData,
  };
}, {
  // remove
  lazy: true,
});

const isCustomizeModalOpen = ref(false);
const currentCardType = ref<import('~/composables/useCustomCardSettings').CardType>('blocks');

watch(isCustomizeModalOpen, (isOpen) => {
  const body = document.body;
  if (isOpen) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    body.classList.add('overflow-hidden');
  } else {
    body.style.paddingRight = '';
    body.classList.remove('overflow-hidden');
  }
});

onUnmounted(() => {
  document.body.style.paddingRight = '';
  document.body.classList.remove('overflow-hidden');
});

function openModal(cardType: import('~/composables/useCustomCardSettings').CardType) {
  currentCardType.value = cardType;
  isCustomizeModalOpen.value = true;
}

const { sortedBlockGroups } = useBlockFeed();
const { sortedTransactionGroups } = useTransactionFeed();
</script>

<template>
  <div
    class="flex flex-col lg:pt-4"
  >
    <HomeHero />

    <Container
      class="lg:!p-8 gap-4 lg:gap-6 grid lg:grid-cols-2"
    >
      <div
        class="
          p-3 lg:p-4 gap-2 lg:gap-4 flex-grow grid lg:grid-cols-2 bg-gray-700 rounded-lg lg:rounded-xl
        "
      >
        <HomeCard
          :isLoading="cgStatus === 'pending'"
          :label="'Kadena Price'"
          :description="moneyCompact.format(cgData?.token?.market_data?.current_price?.usd || 0)"
          :delta="cgData?.token?.market_data?.price_change_percentage_24h_in_currency?.usd || 0"
        />

        <HomeCard
          isDark
          label="Total volume 24h"
          :isLoading="cgStatus === 'pending'"
          :delta="cgData?.token?.market_data?.price_change_percentage_24h"
          :description="moneyCompact.format(cgData?.token?.market_data?.total_volume?.usd || 0)"
        />

        <HomeCard
          label="Market Capital"
          :isLoading="cgStatus === 'pending'"
          :description="moneyCompact.format(cgData?.token?.market_data?.market_cap?.usd || 0)"
        />

        <HomeCard
          label="Circulating Supply"
          :isLoading="cgStatus === 'pending'"
          :description="moneyCompact.format(cgData?.token?.market_data?.circulating_supply || 0)"
        />
      </div>

      <div
        v-if="cgStatus !== 'pending'"
        class="w-full h-full flex flex-col gap-3 lg:gap-6"
      >
        <span
          class="text-font-400"
        >
          KDA Price 14 days
        </span>

        <div
          class="h-full max-h-[216px]"
        >
          <Chart
            :key="cgStatus"
            v-bind="cgData?.chartData || defaultChartData"
          />
        </div>
      </div>
    </Container>

    <HomeDashboard />

    <div
      class="grid lg:grid-cols-2 gap-4 mb-4"
    >
      <div
        v-if="sortedBlockGroups.length === 0"
        class="grid lg:grid-cols-1 gap-4 lg:gap-6"
      >
        <SkeletonHomeBlockList />
      </div>
      <div
        v-else
        class="grid lg:grid-cols-1 gap-4 lg:gap-6"
      >
        <HomeList
          label="Latest Blocks"
          path="/blocks"
          :is-customizable="true"
          @customize="openModal('blocks')"
        >
          <HomeBlock
            :key="blockGroup.height"
            :height="blockGroup.height"
            :chain-count="blockGroup.chains.size"
            :total-transactions="blockGroup.totalTransactions"
            :created-at="blockGroup.createdAt"
            v-for="(blockGroup, index) in sortedBlockGroups"
            :index="index"
            :total-items="sortedBlockGroups.length"
          />
        </HomeList>
      </div>
      <div
        v-if="sortedTransactionGroups.length === 0"
        class="grid lg:grid-cols-1 gap-4 lg:gap-6"
      >
        <SkeletonHomeTransactionList />
      </div>
      <div
        v-else
        class="grid lg:grid-cols-1 gap-4 lg:gap-6"
      >
        <HomeList
          label="Latest Transactions"
          path="/transactions"
          :is-customizable="true"
          @customize="openModal('transactions')"
        >
          <HomeTransaction
            :key="transaction.hash"
            :hash="transaction.hash"
            :sender="transaction.sender"
            :chain-id="transaction.chainId"
            :created-at="transaction.createdAt"
            :fee="transaction.fee"
            v-for="(transaction, index) in sortedTransactionGroups"
            :index="index"
            :total-items="sortedTransactionGroups.length"
          />
        </HomeList>
      </div>
    </div>
    <CustomizeModal
      :is-open="isCustomizeModalOpen"
      :card-type="currentCardType"
      @close="isCustomizeModalOpen = false"
    />
  </div>
</template>
