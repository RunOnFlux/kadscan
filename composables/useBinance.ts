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

  const fetchKadenaPriceAtTimestamp = async (timestamp: string) => {
    try {
      const response: any = await $fetch('/api/binance', {
        method: 'POST',
        body: {
          action: 'getKadenaCandlestickData',
          params: {
            symbol: 'KDAUSDT',
            interval: '1m',
            startTime: new Date(timestamp).getTime(),
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
      console.error('Error fetching Kadena historical price:', error);
      return null;
    }
  };

  return {
    fetchKadenaPrice,
    fetchKadenaTickerData,
    fetchKadenaCandlestickData,
    fetchKadenaPriceAtTimestamp,
  };
}; 