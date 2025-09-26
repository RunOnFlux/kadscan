<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue';
import { useSharedData } from '~/composables/useSharedData';
import { fetchInitialGasPriceStats } from '~/composables/useAverageGasPrice';
import { Listbox, ListboxButton, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import SelectOptions from '~/components/SelectOptions.vue';
import ThemeLight from '~/components/icon/ThemeLight.vue';
import ThemeDim from '~/components/icon/ThemeDim.vue';
import ThemeDark from '~/components/icon/ThemeDark.vue';

const route = useRoute();
// Stable id for Headless UI MenuButton to prevent SSR/client mismatch
const networkMenuButtonId = useId();

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
    ? 'text-font-accent'
    : 'text-[#dc3545]';
});

const medGasPrice = computed(() => {
  if (gasPriceStats.value.txCount === 0) return null;
  const avg = gasPriceStats.value.totalGasPrice / gasPriceStats.value.txCount;
  // Format with up to 10 decimals and remove trailing zeros using regex
  return avg.toFixed(10).replace(/\.?0+$/, '');
});

// Theme control using data-theme attribute (light | dim | dark)
const theme = ref<'light' | 'dim' | 'dark'>('light');

function applyThemeAttribute() {
  const root = document.documentElement;
  root.removeAttribute('class'); // ensure legacy .dark not interfering
  root.setAttribute('data-theme', theme.value);
}

function setTheme(next: 'light' | 'dim' | 'dark') {
  theme.value = next;
  try {
    localStorage.setItem('theme', theme.value);
  } catch {}
  applyThemeAttribute();
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('theme') as 'light' | 'dim' | 'dark' | null;
    theme.value = saved === 'dim' || saved === 'dark' ? saved : 'light';
  } catch {
    theme.value = 'light';
  }
  applyThemeAttribute();
});
</script>

<template>
  <div>
    <div
      :class="[
        'w-full z-50 bg-surface-primary border-b border-[#222222] fixed top-0 left-0 flex',
        route.path !== '/' ? 'h-[55px]' : 'h-[47px]'
      ]"
    >
        <div :class="[
          'w-full max-w-[1400px] mx-auto flex items-center justify-between h-full px-3 md:px-5',
          route.path !== '/' ? 'py-2' : 'py-4'
        ]">
        <div class="flex items-center text-[12.5px] text-font-secondary hidden md:flex">
          <span class="mr-1">KDA Price:</span>
          <span class="text-[#6ab5db] hover:text-[#9ccee7]">{{ formattedKdaPrice }}</span>
          <span :class="variationColor" class="ml-1">{{ formattedVariation ? `(${formattedVariation})` : '' }}</span>

          <span class="ml-4 mr-1 hidden lg:inline">Avg Gas Price:</span>
          <span class="text-[#6ab5db] hover:text-[#9ccee7] hidden lg:inline">{{ medGasPrice ? medGasPrice + ' KDA' : '-' }}</span>
          <NuxtLink
            to="https://forms.gle/f3RB1A8MUAf1Pvgx9"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-4 text-[#6ab5db] hover:text-[#9ccee7] hidden lg:inline"
          >
            Provide a Feedback!
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
          <SearchInputHeader v-if="route.path !== '/'" />
          <!-- Theme selector between searchbar and network switch -->
          <Menu as="div" class="relative inline-block text-left">
            <div>
              <MenuButton class="h-[36.5px] rounded-lg flex items-center gap-2 border border-[#222222] bg-surface-disabled hover:bg-surface-secondary px-3 text-font-primary">
                <component :is="theme === 'light' ? ThemeLight : (theme === 'dim' ? ThemeDim : ThemeDark)" class="h-4 w-4" />
              </MenuButton>
            </div>
            <MenuItems class="absolute right-0 mt-1 border border-[#222222] w-36 origin-top-right rounded-lg bg-surface-primary shadow-[0_0_15px_rgba(255,255,255,0.0625)] ring-1 ring-black/5 focus:outline-none px-2 py-1">
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button @click="setTheme('light')" :class="[ active ? 'bg-surface-secondary' : '', 'group flex w-full items-center justify-start rounded-md px-3 py-2 text-sm gap-2', theme==='light' ? 'text-[#00e19d]' : 'text-font-primary']">
                    <ThemeLight class="h-4 w-4" /><span>Light</span>
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button @click="setTheme('dim')" :class="[ active ? 'bg-surface-secondary' : '', 'group flex w-full items-center justify-start rounded-md px-3 py-2 text-sm gap-2', theme==='dim' ? 'text-[#00e19d]' : 'text-font-primary']">
                    <ThemeDim class="h-4 w-4" /><span>Dim</span>
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button @click="setTheme('dark')" :class="[ active ? 'bg-surface-secondary' : '', 'group flex w-full items-center justify-start rounded-md px-3 py-2 text-sm gap-2', theme==='dark' ? 'text-[#00e19d]' : 'text-font-primary']">
                    <ThemeDark class="h-4 w-4" /><span>Dark</span>
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
          <Menu as="div" class="relative inline-block text-left hidden md:block">
          <div>
            <MenuButton :id="networkMenuButtonId" class="h-[36.5px] rounded-lg flex items-center gap-2 border border-[#222222] bg-surface-disabled hover:bg-surface-secondary px-3">
              <IconKadena class="h-4 w-4" />
              <span v-if="selectedNetwork" class="text-[13px] text-font-primary">{{ selectedNetwork.name }}</span>
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
            <MenuItems class="absolute right-0 mt-1 border border-[#222222] w-32 origin-top-right rounded-lg bg-surface-primary shadow-[0_0_15px_rgba(255,255,255,0.0625)] ring-1 ring-black/5 focus:outline-none px-2 py-1">
              <div class="px-1 py-1">
                <MenuItem v-for="network in availableNetworks" :key="network.id" v-slot="{ active }">
                  <button
                    @click="setNetwork(network)"
                    :class="[
                      active ? 'bg-surface-secondary' : '',
                      selectedNetwork.id === network.id ? 'text-[#00e19d]' : 'text-font-primary',
                      'group flex w-full items-center hover:bg-surface-secondary justify-start rounded-md px-3 py-2 text-sm',
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
    </div>
    <div :class="[
      'block',
      route.path !== '/' ? 'h-[55px]' : 'h-[47px]'
    ]"></div>
  </div>
</template> 