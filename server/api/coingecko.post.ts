import {H3Event} from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const {
    CG_URL: baseUrl,
  } = useRuntimeConfig().public;

  const {endpoint, params} = await readBody(event);

  if (!endpoint) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing endpoint in request body',
    });
  }

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const fullUrl = new URL(`${cleanBaseUrl}/${cleanEndpoint}`);

  if (params && Object.keys(params as object).length > 0) {
    fullUrl.search = new URLSearchParams(params).toString();
  }

  try {
    const response = await fetch(fullUrl.toString(), {
      method: 'GET',
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