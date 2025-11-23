export const useBinance = () => {
  const fetchKadenaPrice = async () => {
    try {
      const response = await $fetch('/api/binance', {
        method: 'POST',
        body: {
          action: 'getKadenaPrice',
          params: {
            symbol: 'KDAUSDT',
          },
        },
      });

      return response;
    } catch (error) {
      console.error('Error fetching Kadena price:', error);
      return null;
    }
  };

  const fetchKadenaTickerData = async () => {
    try {
      const response = await $fetch('/api/binance', {
        method: 'POST',
        body: {
          action: 'getKadenaTickerData',
          params: {
            symbol: 'KDAUSDT',
          },
        },
      });

      return response;
    } catch (error) {
      console.error('Error fetching Kadena ticker data:', error);
      return null;
    }
  };

  const fetchKadenaCandlestickData = async (
    interval: string = '1d',
    limit: number = 30
  ) => {
    try {
      const response = await $fetch('/api/binance', {
        method: 'POST',
        body: {
          action: 'getKadenaCandlestickData',
          params: {
            symbol: 'KDAUSDT',
            interval,
            limit,
          },
        },
      });

      return response;
    } catch (error) {
      console.error('Error fetching Kadena candlestick data:', error);
      return null;
    }
  };

  const fetchKadenaPriceAtDate = async (timestamp: Date) => {
    const { $coingecko } = useNuxtApp();

    // Try CoinGecko first (primary source for historical data)
    try {
      const fromTimestamp = Math.floor(timestamp.getTime() / 1000);
      const toTimestamp = fromTimestamp + 86400; // +1 day

      const response: any = await $coingecko.request('coins/kadena/market_chart/range', {
        vs_currency: 'usd',
        from: fromTimestamp.toString(),
        to: toTimestamp.toString(),
      });

      // CoinGecko returns { prices: [[timestamp, price], ...], market_caps: [...], total_volumes: [...] }
      if (response?.prices && response.prices.length > 0) {
        // Get the first price point (closest to our requested timestamp)
        const price = response.prices[0][1];
        return { price };
      }
    } catch (error) {
      console.error('Error fetching Kadena historical price from CoinGecko:', error);
    }

    // Fallback to Binance
    try {
      const response: any = await $fetch('/api/binance', {
        method: 'POST',
        body: {
          action: 'getKadenaCandlestickData',
          params: {
            symbol: 'KDAUSDT',
            interval: '1d',
            startTime: timestamp.getTime(),
            limit: 1,
          },
        },
      });

      // The response for a single kline is an array within an array, e.g., [[timestamp, open, high, low, close, ...]]
      // We return the close price.
      if (response.data && response.data.length > 0 && response.data[0].length > 4) {
        return { price: response.data[0][4] };
      }

      return null;
    } catch (error) {
      console.error('Error fetching Kadena historical price from Binance:', error);
      return null;
    }
  };

  return {
    fetchKadenaPrice,
    fetchKadenaTickerData,
    fetchKadenaCandlestickData,
    fetchKadenaPriceAtDate,
  };
}; 