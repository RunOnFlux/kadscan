import { ref, type Ref, watch } from 'vue';
import { useFormat } from '~/composables/useFormat';

type NetworkRef = Ref<{ id: string } | null | undefined>;

const QUERY_NETWORK_HASH_RATE = `
  query NetworkHashRate { 
    networkInfo { 
      networkHashRate 
    } 
  }
`;

const QUERY_TOTAL_DIFFICULTY = `
  query TotalDifficulty { 
    networkInfo { 
      totalDifficulty 
    } 
  }
`;

const QUERY_CHAINS_GAS = `
  query ChainsGas { 
    networkInfo { 
      countersOfEachChain { 
        chainId 
        totalGasUsed 
      } 
    } 
  }
`;

const QUERY_COINS_IN_CIRCULATION = `
  query CoinsInCirculation { 
    networkInfo { 
      coinsInCirculation 
    } 
  }
`;

export const useBlocksMetrics = (selectedNetwork: NetworkRef) => {
  const { formatKda } = useFormat();

  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const cards = ref<Array<{ label: string; value: string | number }>>([]);

  const fetchNetworkHashRate = async (networkId: string) => {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: QUERY_NETWORK_HASH_RATE,
        networkId,
      },
    });
    if (response.errors) throw new Error(response.errors.map((e: any) => e.message).join(', '));
    return response.data?.networkInfo?.networkHashRate as number | undefined;
  };

  const fetchTotalDifficulty = async (networkId: string) => {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: QUERY_TOTAL_DIFFICULTY,
        networkId,
      },
    });
    if (response.errors) throw new Error(response.errors.map((e: any) => e.message).join(', '));
    return response.data?.networkInfo?.totalDifficulty as number | undefined;
  };

  const fetchChainsGas = async (networkId: string) => {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: QUERY_CHAINS_GAS,
        networkId,
      },
    });
    if (response.errors) throw new Error(response.errors.map((e: any) => e.message).join(', '));
    return response.data?.networkInfo?.countersOfEachChain as Array<{ chainId: string; totalGasUsed: string }> | undefined;
  };

  const fetchCoinsInCirculation = async (networkId: string) => {
    const response: any = await $fetch('/api/graphql', {
      method: 'POST',
      body: {
        query: QUERY_COINS_IN_CIRCULATION,
        networkId,
      },
    });
    if (response.errors) throw new Error(response.errors.map((e: any) => e.message).join(', '));
    return response.data?.networkInfo?.coinsInCirculation as number | undefined;
  };

  const fetchAll = async () => {
    const networkId = selectedNetwork.value?.id;
    if (!networkId) {
      cards.value = [];
      return;
    }

    loading.value = true;
    error.value = null;
    cards.value = [];

    try {
      const [hashRate, difficulty, chainsGas, coins] = await Promise.all([
        fetchNetworkHashRate(networkId),
        fetchTotalDifficulty(networkId),
        fetchChainsGas(networkId),
        fetchCoinsInCirculation(networkId),
      ]);

      if (
        hashRate === undefined ||
        difficulty === undefined ||
        !Array.isArray(chainsGas) ||
        coins === undefined
      ) {
        throw new Error('Some metrics are unavailable');
      }

      const hashRatePhs = (Number(hashRate) / 1e15);
      const formattedHashRate = `${hashRatePhs.toFixed(1)} PH/s`;

      const difficultyEh = (Number(difficulty) / 1e18);
      const formattedDifficulty = `${difficultyEh.toFixed(2)} EH`;

      const totalGasUsed = chainsGas.reduce((acc, item) => acc + (parseFloat(item.totalGasUsed) || 0), 0);
      const formattedTotalGas = `${formatKda(totalGasUsed, 4)} KDA`;

      const metrics = [
        { label: 'Est. Network Hash Rate', value: formattedHashRate },
        { label: 'Total Difficulty', value: formattedDifficulty },
        { label: 'Total Gas Used', value: formattedTotalGas },
        { label: 'Coins in Circulation', value: coins },
      ];

      cards.value = metrics;
    } catch (e: any) {
      error.value = e?.message || 'Failed to load metrics';
      cards.value = [];
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => selectedNetwork.value?.id,
    () => {
      fetchAll();
    },
    { immediate: true }
  );

  return {
    cards,
    loading,
    error,
    refetch: fetchAll,
  };
};


