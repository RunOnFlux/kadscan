import {H3Event} from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const {
    CG_URL: configUrl,
    CG_KEY: apiKey,
  } = useRuntimeConfig().public;

  const {endpoint, params} = await readBody(event);

  if (!endpoint) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing endpoint in request body',
    });
  }

  // Use Pro API URL if API key is provided, otherwise use free tier URL
  const baseUrl = apiKey
    ? (configUrl || 'https://pro-api.coingecko.com/api/v3')
    : (configUrl || 'https://api.coingecko.com/api/v3');

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const fullUrl = new URL(`${cleanBaseUrl}/${cleanEndpoint}`);

  if (params && Object.keys(params as object).length > 0) {
    fullUrl.search = new URLSearchParams(params).toString();
  }

  // Prepare headers with API key if available
  // Use Pro API header when API key is provided, otherwise use free tier
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  try {
    const response = await fetch(fullUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinGecko API Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`CoinGecko API responded with ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error proxying CoinGecko request',
    });
  }
}); 