import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const { query, variables } = await readBody(event);
  const runtimeConfig = useRuntimeConfig();
  const { kadindexerApiUrl, kadindexerApiKey } = runtimeConfig;

  try {
    const response = await $fetch(kadindexerApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': kadindexerApiKey,
      },
      body: { query, variables },
    });

    return response;
  } catch (error: any) {
    // Forward the error from the GraphQL server
    return error.data;
  }
}); 