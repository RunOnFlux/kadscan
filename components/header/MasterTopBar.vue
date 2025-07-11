<script setup lang="ts">
import { computed } from 'vue';
import { useSharedData } from '~/composables/useSharedData';
import { Listbox, ListboxButton } from '@headlessui/vue'
import SelectOptions from '~/components/SelectOptions.vue';

const {
  kdaPrice,
  kdaVariation,
  gasPriceStats,
  availableNetworks,
  selectedNetwork,
  setNetwork
} = useSharedData();

// Simple number formatter
const formatNumber = (value: number, decimals: number = 2) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '...';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formattedKdaPrice = computed(() => {
  return kdaPrice.value ? `$${formatNumber(kdaPrice.value, 4)}` : '-';
});

const formattedVariation = computed(() => {
  return kdaVariation.value ? `${formatNumber(kdaVariation.value, 2)}%` : '';
});

const variationColor = computed(() => {
  return kdaVariation.value && kdaVariation.value >= 0
    ? 'text-[#00a186]'
    : 'text-[#dc3545]';
});

const medGasPrice = computed(() => {
  if (gasPriceStats.value.txCount === 0) return null;
  const avg = gasPriceStats.value.totalGasPrice / gasPriceStats.value.txCount;
  return formatNumber(avg, 10);
});

const selectedNetworkModel = computed({
  get: () => selectedNetwork.value,
  set: (option) => setNetwork(option.value),
});

const networkOptions = computed(() => {
  return availableNetworks.value.map(network => ({
    value: network,
    label: network.name,
  }));
});
</script>

<template>
  <div>
    <div
      class="w-full h-[47px] z-50 bg-[#111111] border-b border-[#222222] fixed top-0 left-0 hidden md:flex"
    >
      <div class="w-full max-w-[1400px] mx-auto flex items-center justify-between h-full px-5">
        <div class="flex items-center text-[12.5px] text-[#bbbbbb]">
          <span class="mr-1">KDA Price:</span>
          <span class="text-[#6ab5db] hover:text-[#9ccee7]">{{ formattedKdaPrice }}</span>
          <span :class="variationColor" class="ml-1">{{ formattedVariation ? `(${formattedVariation})` : '' }}</span>

          <span class="ml-4 mr-1">Med Gas Price:</span>
          <span class="text-[#6ab5db] hover:text-[#9ccee7]">{{ medGasPrice ? medGasPrice + ' KDA' : '-' }}</span>
        </div>

        <Listbox
          v-model="selectedNetworkModel"
          as="div"
          class="relative inline-block text-left"
        >
          <ListboxButton class="w-[35px] h-[35px] rounded-lg bg-[#151515] border border-[#222222] flex items-center justify-center hover:bg-[#222222]">
            <IconKadena class="h-4 w-4" />
          </ListboxButton>
          <SelectOptions :items="networkOptions" position="bottom-right" />
        </Listbox>
      </div>
    </div>
    <div class="h-[47px] hidden md:block"></div>
  </div>
</template> 