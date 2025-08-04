import {H3Event} from 'h3';

const getApiEndpoint = (action: string, params: Record<string, any>) => {
  const query = new URLSearchParams(params).toString();
  switch (action) {
    case 'getKadenaPrice':
      return `https://api.binance.us/api/v3/ticker/price?${query}`;
    case 'getKadenaTickerData':
      return `https://api.binance.us/api/v3/ticker/24hr?${query}`;
    case 'getKadenaCandlestickData':
      return `https://api.binance.us/api/v3/klines?${query}`;
    default:
      return null;
  }
};

export default defineEventHandler(async (event: H3Event) => {
  const {action, params} = await readBody(event);
  const apiUrl = getApiEndpoint(action, params);

  if (!apiUrl) {
    return {
      error: 'Invalid action',
    };
  }

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Binance API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      data,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
}); 