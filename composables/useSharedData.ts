import { ref, computed } from 'vue';
import { useGasPriceStats } from '~/composables/useAverageGasPrice';

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

// The main composable that components will use
export function useSharedData() {
  // Expose the gas stats directly from its own composable, called here in the correct context
  const gasPriceStats = useGasPriceStats();

  return {
    kdaPrice: computed(() => kadenaCoinData.value.price),
    kdaVariation: computed(() => kadenaCoinData.value.variation),
    kdaMarketCap: computed(() => kadenaCoinData.value.marketCap),
    gasPriceStats: gasPriceStats, // Pass through the reactive stats
  };
} 