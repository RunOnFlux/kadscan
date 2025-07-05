<script setup lang="ts">
import { useBlockFeed } from '~/composables/useBlockFeed';
import { useTransactionFeed } from '~/composables/useTransactionFeed';
import { useTransactionCount, fetchInitialTransactionCount } from '~/composables/useTransactionCount';
import { useGasPriceStats } from '~/composables/useAverageGasPrice';
import { useCustomCardSettings } from '~/composables/useCustomCardSettings';

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
const gasPriceStats = useGasPriceStats();
const transactionStats = useTransactionCount();
const { getPreset } = useCustomCardSettings();
const transactionCardPreset = getPreset('transactions');

const transactionListTitle = computed(() => {
  return transactionCardPreset.value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

await useAsyncData('initial-transaction-count', () => fetchInitialTransactionCount());
</script>

<template>
  <div
    class="flex flex-col"
  >
    <HomeHero />

    <HomeDashboard
      :is-loading="cgStatus === 'pending'"
      :chart-data="cgData?.chartData"
      :kadena-price="cgData?.token?.market_data?.current_price?.usd ?? null"
      :kadena-price-variation="cgData?.token?.market_data?.price_change_percentage_24h ?? null"
      :market-cap="cgData?.token?.market_data?.market_cap?.usd ?? null"
      :block-groups="sortedBlockGroups"
      :transactions-count="transactionStats"
      :gas-price-stats="gasPriceStats"
    />

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
          <TransitionGroup name="block-list" tag="div">
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
          </TransitionGroup>
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
          :label="transactionListTitle"
          path="/transactions"
          :is-customizable="true"
          @customize="openModal('transactions')"
        >
        <TransitionGroup name="transaction-list" tag="div">
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
          </TransitionGroup>
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

<style scoped>
.transaction-list-move,
.transaction-list-enter-active,
.transaction-list-leave-active {
  transition: all 0.5s ease;
}

.transaction-list-enter-from,
.transaction-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.transaction-list-leave-active {
  position: absolute;
  width: 100%;
}

.block-list-move,
.block-list-enter-active,
.block-list-leave-active {
  transition: all 0.5s ease;
}

.block-list-enter-from,
.block-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.block-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
