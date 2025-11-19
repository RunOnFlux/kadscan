import { gql } from 'graphql-request';

const GET_NETWORK_INFO = gql`
  query NetworkInfo {
    networkInfo {
      coinsInCirculation
    }
  }
`;

export const useNetworkInfo = () => {
  const fetchCirculatingSupply = async () => {
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: { query: GET_NETWORK_INFO },
      });
      if (response.data && response.data.networkInfo) {
        return response.data.networkInfo;
      }
      return null;
    } catch (error) {
      console.error('Error fetching circulating supply:', error);
      return null;
    }
  };

  return {
    fetchCirculatingSupply,
  };
}; 