export default defineNuxtPlugin(() => {
  const request = async (endpoint: string, params = {}) => {
    try {
      return await $fetch('/api/coingecko', {
        method: 'POST',
        body: {
          endpoint,
          params,
        },
      });
    } catch (error) {
      console.warn(`Fetching from proxy for ${endpoint} failed:`, error);
      return null;
    }
  };

  return {
    provide: {
      coingecko: {
        request,
      },
    },
  };
});
