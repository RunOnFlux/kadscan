<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue';
import { useWebSocketSubscription } from '~/composables/useWebSocketSubscription';

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

const displayedBlockGroups = ref(new Map());

const sortedBlockGroups = computed(() => {
  return Array.from(displayedBlockGroups.value.values()).sort((a, b) => b.height - a.height);
});

function updateTotalTransactions(blockGroup: any) {
  blockGroup.totalTransactions = Array.from(blockGroup.chains.values()).reduce((sum, chain: any) => sum + (chain.transactions?.totalCount || 0), 0);
}

const { startSubscription, newBlocks } = useWebSocketSubscription();

onMounted(() => {
  startSubscription();
});

watch(newBlocks, (latestBlocks) => {
  latestBlocks.forEach((block: any) => {
    let blockToUpdate = displayedBlockGroups.value.get(block.height);

    if (blockToUpdate) {
      blockToUpdate.chains.set(block.chainId, block);
      updateTotalTransactions(blockToUpdate);
    } else {
      const heights = Array.from(displayedBlockGroups.value.keys());
      if (heights.length === 0) { // First block ever
        const newGroup = {
          height: block.height,
          chains: new Map([[block.chainId, block]]),
          createdAt: block.creationTime,
          totalTransactions: block.transactions?.totalCount || 0,
          displayChainId: block.chainId,
        };
        displayedBlockGroups.value.set(block.height, newGroup);
        return;
      }

      const minHeight = Math.min(...heights);

      if (block.height > minHeight || displayedBlockGroups.value.size < 6) {
        const newGroup = {
          height: block.height,
          chains: new Map([[block.chainId, block]]),
          createdAt: block.creationTime,
          totalTransactions: block.transactions?.totalCount || 0,
          displayChainId: block.chainId,
        };
        displayedBlockGroups.value.set(block.height, newGroup);

        if (displayedBlockGroups.value.size > 6) {
            const sortedHeights = Array.from(displayedBlockGroups.value.keys()).sort((a,b) => a-b);
            displayedBlockGroups.value.delete(sortedHeights[0]);
        }
      }
    }
  });
}, { deep: true });
</script>

<template>
  <div
    class="flex flex-col gap-4 lg:gap-10 lg:pt-4"
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
        label="Recent Blocks"
        path="/blocks"
      >
        <HomeBlock
          :key="blockGroup.height"
          :height="blockGroup.height"
          :chain-id="blockGroup.displayChainId"
          :chain-count="blockGroup.chains.size"
          :total-transactions="blockGroup.totalTransactions"
          :created-at="blockGroup.createdAt"
          v-for="blockGroup in sortedBlockGroups"
        />
      </HomeList>
    </div>
  </div>
</template>
