import { ref, computed, onMounted } from 'vue';
import { useGasPriceStats, useIsInitialGasPrice } from '~/composables/useAverageGasPrice';
import { useNetworkInfo } from '~/composables/useNetworkInfo';
import { useBinance } from '~/composables/useBinance';

// State for Kadena data
// Accessor ensures useState is called within a valid Nuxt context
function kadenaCoinState() {
  return useState('kadena-coin-data', () => ({
    price: null as number | null,
    variation: null as number | null,
    marketCap: null as number | null,
  }))
}

// Function to fetch Kadena data
export async function fetchSharedKadenaData() {
  // Capture reactive state and app/context-bound composables before any await
  const state = kadenaCoinState();
  const { $coingecko } = useNuxtApp();
  const { fetchKadenaTickerData } = useBinance();
  const { fetchCirculatingSupply } = useNetworkInfo();

  try {
    const [binanceData, networkInfo] = (await Promise.all([
      fetchKadenaTickerData(),
      fetchCirculatingSupply(),
    ])) as [any, any];

    if (binanceData?.data && networkInfo?.coinsInCirculation) {
      const price = parseFloat(binanceData.data.lastPrice);
      const circulatingSupply = networkInfo.coinsInCirculation;

      state.value.price = price;
      state.value.variation = parseFloat(binanceData.data.priceChangePercent);
      state.value.marketCap = price * circulatingSupply;
      return true;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch Kadena data from Binance or indexer:', message);
  }

  try {
    const data = await $coingecko.request('coins/kadena');
    state.value.price = data?.market_data?.current_price?.usd ?? null;
    state.value.variation = data?.market_data?.price_change_percentage_24h ?? null;
    state.value.marketCap = data?.market_data?.market_cap?.usd ?? null;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch Kadena data from CoinGecko:', message);
  }
  return true;
}

// --- Network State & Persistence ---
const availableNetworks = [
  { name: 'Mainnet', id: 'mainnet01' },
  { name: 'Testnet', id: 'testnet04' },
];
const selectedNetwork = ref<{ name: string; id: string; } | null>(null);
let networkInitialized = false;
const STORAGE_KEY = 'kadscan-selected-network';

function setNetwork(network: { name: string; id: string; }) {
  // Avoid unnecessary updates if the network hasn't changed
  if (selectedNetwork.value?.id === network.id) return;
  selectedNetwork.value = network;
  if (process.client) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(network));
  }
}

function initializeNetwork() {
  // Ensure we only initialize once, even if multiple components mount
  if (networkInitialized || !process.client) return;

  const savedNetwork = localStorage.getItem(STORAGE_KEY);
  const parsedSavedNetwork = savedNetwork ? JSON.parse(savedNetwork) : null;
  const target = parsedSavedNetwork ?? availableNetworks[0];

  if (!selectedNetwork.value || selectedNetwork.value.id !== target.id) {
    selectedNetwork.value = target;
  }

  networkInitialized = true;
}

// The main composable that components will use
export function useSharedData() {
  onMounted(initializeNetwork);

  // Expose the gas stats directly from its own composable, called here in the correct context
  const gasPriceStats = useGasPriceStats();
  const isInitialGasPrice = useIsInitialGasPrice();

  return {
    // Kadena token data
    kdaPrice: computed(() => kadenaCoinState().value.price),
    kdaVariation: computed(() => kadenaCoinState().value.variation),
    kdaMarketCap: computed(() => kadenaCoinState().value.marketCap),

    // Gas price stats
    gasPriceStats: gasPriceStats, // Pass through the reactive stats
    isInitialGasPrice: isInitialGasPrice,

    // Network properties
    availableNetworks: computed(() => availableNetworks),
    selectedNetwork: computed(() => selectedNetwork.value),
    setNetwork,
  };
} 