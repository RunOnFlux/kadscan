<script setup lang="ts">
import { computed, watch } from 'vue';
import { useSharedData } from '~/composables/useSharedData';
import { fetchInitialGasPriceStats } from '~/composables/useAverageGasPrice';
import { Listbox, ListboxButton } from '@headlessui/vue'
import SelectOptions from '~/components/SelectOptions.vue';

const {
  kdaPrice,
  kdaVariation,
  gasPriceStats,
  isInitialGasPrice,
  availableNetworks,
  selectedNetwork,
  setNetwork
} = useSharedData();

watch(selectedNetwork, (network) => {
  if (network) {
    fetchInitialGasPriceStats(network.id);
  }
}, { immediate: true });

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

        <Menu as="div" class="relative inline-block text-left">
          <div>
            <MenuButton class="h-8 w-8 rounded-lg flex items-center justify-center border border-[#222222]">
              <IconKadena class="h-4 w-4" />
            </MenuButton>
          </div>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems class="absolute right-0 mt-1 border border-[#222222] w-32 origin-top-right rounded-lg bg-[#111111] shadow-[0_0_15px_rgba(255,255,255,0.0625)] ring-1 ring-black/5 focus:outline-none px-2 py-1">
              <div class="px-1 py-1">
                <MenuItem v-for="network in availableNetworks" :key="network.id" v-slot="{ active }">
                  <button
                    @click="setNetwork(network)"
                    :class="[
                      active ? 'bg-[#222222]' : '',
                      selectedNetwork.id === network.id ? 'text-[#6ab5db]' : 'text-[#fafafa]',
                      'group flex w-full items-center hover:bg-[#222222] justify-start rounded-md px-3 py-2 text-sm',
                    ]"
                  >
                    <span>{{ network.name }}</span>
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </div>
    <div class="h-[47px] hidden md:block"></div>
  </div>
</template> 