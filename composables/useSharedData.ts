import { ref, computed, onMounted } from 'vue';
import { useGasPriceStats, useIsInitialGasPrice } from '~/composables/useAverageGasPrice';

// State for CoinGecko data
const kadenaCoinData = ref({
  price: null,
  variation: null,
  marketCap: null,
});

// Function to fetch CoinGecko data
export async function fetchSharedKadenaData() {
  const { $coingecko } = useNuxtApp();
  try {
    const data = await $coingecko.request('coins/kadena');
    kadenaCoinData.value.price = data?.market_data?.current_price?.usd ?? null;
    kadenaCoinData.value.variation = data?.market_data?.price_change_percentage_24h ?? null;
    kadenaCoinData.value.marketCap = data?.market_data?.market_cap?.usd ?? null;
  } catch (error) {
    console.error('Failed to fetch Kadena coin data:', error);
  }
}

// --- Network State & Persistence ---
const availableNetworks = [
  { name: 'Mainnet', id: 'mainnet01' },
  { name: 'Testnet', id: 'testnet04' },
];
const selectedNetwork = ref<{ name: string; id: string; } | null>(null);
const STORAGE_KEY = 'kadscan-selected-network';

function setNetwork(network: { name: string; id: string; }) {
  selectedNetwork.value = network;
  if (process.client) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(network));
  }
}

function initializeNetwork() {
  if (process.client) {
    const savedNetwork = localStorage.getItem(STORAGE_KEY);
    if (savedNetwork) {
      selectedNetwork.value = JSON.parse(savedNetwork);
    } else {
      selectedNetwork.value = availableNetworks[0]; // Default to Mainnet if nothing is saved
    }
  }
}

// The main composable that components will use
export function useSharedData() {
  onMounted(initializeNetwork);

  // Expose the gas stats directly from its own composable, called here in the correct context
  const gasPriceStats = useGasPriceStats();
  const isInitialGasPrice = useIsInitialGasPrice();

  return {
    kdaPrice: computed(() => kadenaCoinData.value.price),
    kdaVariation: computed(() => kadenaCoinData.value.variation),
    kdaMarketCap: computed(() => kadenaCoinData.value.marketCap),
    gasPriceStats: gasPriceStats, // Pass through the reactive stats
    isInitialGasPrice: isInitialGasPrice,

    // Network properties
    availableNetworks: computed(() => availableNetworks),
    selectedNetwork: computed(() => selectedNetwork.value),
    setNetwork,
  };
} 