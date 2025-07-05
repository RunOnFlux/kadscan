import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const { query, variables, networkId } = await readBody(event);
  const { 
    kadindexerMainnetApiUrl, 
    kadindexerMainnetApiKey,
    kadindexerTestnetApiUrl,
    kadindexerTestnetApiKey,
  } = useRuntimeConfig();

  const isTestnet = networkId === 'testnet04';
  
  const apiUrl = isTestnet ? kadindexerTestnetApiUrl : kadindexerMainnetApiUrl;
  const apiKey = isTestnet ? kadindexerTestnetApiKey : kadindexerMainnetApiKey;

  try {
    const response = await $fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: { query, variables },
    });

    return response;
  } catch (error: any) {
    // Forward the error from the GraphQL server
    return error.data;
  }
}); 