import {H3Event} from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const {
    CG_URL: configUrl,
    CG_KEY: apiKey,
    CG_IS_DEMO_API_KEY: isDemoApiKey,
  } = useRuntimeConfig().public;

  const {endpoint, params} = await readBody(event);

  if (!endpoint) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing endpoint in request body',
    });
  }

  const isDemo = isDemoApiKey === 'true' || isDemoApiKey === true;

  // Use Pro API URL if API key is provided and it's not a demo key
  const baseUrl = apiKey && !isDemo
    ? (configUrl || 'https://pro-api.coingecko.com/api/v3')
    : (configUrl || 'https://api.coingecko.com/api/v3');

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const fullUrl = new URL(`${cleanBaseUrl}/${cleanEndpoint}`);

  if (params && Object.keys(params as object).length > 0) {
    fullUrl.search = new URLSearchParams(params).toString();
  }

  // Prepare headers with API key if available
  // Use the appropriate header based on whether it's a demo or pro key
  const headers: Record<string, string> = {};
  if (apiKey) {
    if (isDemo) {
      headers['x-cg-demo-api-key'] = apiKey;
    } else {
      headers['x-cg-pro-api-key'] = apiKey;
    }
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