import debounce from 'lodash/debounce'
import { gql } from 'nuxt-graphql-request/utils';
import { staticTokens } from '~/constants/tokens';

// New individual queries for the updated indexer
const blocksQuery = gql`
  query BlocksFromHeight($startHeight: Int!, $endHeight: Int) {
    blocksFromHeight(startHeight: $startHeight, endHeight: $endHeight) {
      edges {
        node {
          hash
          height
          chainId
          creationTime
          transactions {
            totalCount
          }
        }
      }
    }
  }
`;

const addressQuery = gql`
  query FungibleAccount($accountName: String!) {
    fungibleAccount(accountName: $accountName) {
      id
      fungibleName
      totalBalance
      accountName
    }
  }
`;

const transactionQuery = gql`
  query Transaction($requestKey: String!) {
    transaction(requestKey: $requestKey) {
      hash
      requestKey
      sender
      result
      chainId
      creationTime
    }
  }
`;

const tokenQuery = gql`
  query TokenPrice($tokenAddress: String!) {
    tokenPrice(tokenAddress: $tokenAddress) {
      id
      name
      symbol
      module
    }
  }
`;

const filters = [
  {
    value: 'all',
    label: 'All Filters',
  },
  {
    value: 'blocks',
    label: 'Blocks',
  },
  {
    value: 'transactions',
    label: 'Transactions',
  },
  {
    value: 'address',
    label: 'Addresses',
  },
  {
    value: 'tokens',
    label: 'Tokens',
  },
];

export function useSearch () {
  const data = reactive<any>({
    query: '',
    open: false,
    error: null,
    loading: false,
    searched: null,
    filters,
    filter: filters[0],
  });

  const router = useRouter();
  const { $graphql } = useNuxtApp() as any;

  // Updated regex patterns - more flexible
  const strictKadenaAddressRegex = /^k:[a-fA-F0-9]{64}$/;
  const likelyRequestKeyRegex = /^[A-Za-z0-9\-_]{20,}$/; // More flexible length
  const numericRegex = /^\d+$/;

  const searchImpl = async (value: string) => {
    if (!value) {
      data.searched = null;
      return;
    }

    console.log('🔍 Searching for:', value);
    data.loading = true;
    data.error = null;

    try {
      const results = {
        blocks: [] as any[],
        addresses: [] as any[],
        transactions: [] as any[],
        tokens: [] as any[]
      };

      // Search based on filter or search all types
      const shouldSearchAll = data.filter.value === 'all';
      
      // Block search - if numeric input
      if ((shouldSearchAll || data.filter.value === 'blocks') && numericRegex.test(value)) {
        try {
          const height = parseInt(value);
          if (height >= 0 && height <= 20000000) { // Height range validation
            const blockResponse = await $graphql.default.request(blocksQuery, {
              startHeight: height,
              endHeight: height
            });
            
            if (blockResponse.blocksFromHeight?.edges) {
              results.blocks = blockResponse.blocksFromHeight.edges.map((edge: any) => ({
                chainId: edge.node.chainId,
                hash: edge.node.hash,
                height: edge.node.height,
                transactionsCount: edge.node.transactions?.totalCount || 0,
                creationTime: edge.node.creationTime
              }));
            }
          }
        } catch (error) {
          console.warn('Block search failed:', error);
        }
      }

      // Transaction search - if looks like request key
      if ((shouldSearchAll || data.filter.value === 'transactions') && likelyRequestKeyRegex.test(value)) {
        try {
          const txResponse = await $graphql.default.request(transactionQuery, {
            requestKey: value
          });
          
          if (txResponse.transaction) {
            results.transactions = [{
              requestkey: txResponse.transaction.requestKey || value,
              sender: txResponse.transaction.sender,
              result: txResponse.transaction.result,
              chainId: txResponse.transaction.chainId,
              hash: txResponse.transaction.hash,
              creationTime: txResponse.transaction.creationTime
            }];
          }
        } catch (error) {
          console.warn('Transaction search failed:', error);
        }
      }

      // Token search
      if (shouldSearchAll || data.filter.value === 'tokens') {
        try {
          // Try to find token in static tokens first
          const staticToken = staticTokens.find(token => 
            token.module.toLowerCase().includes(value.toLowerCase()) ||
            token.name.toLowerCase().includes(value.toLowerCase()) ||
            token.symbol.toLowerCase().includes(value.toLowerCase())
          );

          if (staticToken) {
            const tokenResponse = await $graphql.default.request(tokenQuery, {
              tokenAddress: staticToken.module
            });
            
            if (tokenResponse.tokenPrice) {
              results.tokens = [{
                type: 'fungible',
                module: staticToken.module,
                name: staticToken.name,
                symbol: staticToken.symbol,
                chainId: 'all' // Tokens are cross-chain
              }];
            }
          }
        } catch (error) {
          console.warn('Token search failed:', error);
        }
      }

      // Address search - always try this as fallback, or if specifically searching addresses
      if (shouldSearchAll || data.filter.value === 'address') {
        try {
          const addressResponse = await $graphql.default.request(addressQuery, {
            accountName: value
          });
          
          if (addressResponse.fungibleAccount) {
            results.addresses = [{
              account: addressResponse.fungibleAccount.accountName || value,
              id: addressResponse.fungibleAccount.id,
              totalBalance: addressResponse.fungibleAccount.totalBalance
            }];
          }
        } catch (error) {
          console.warn('Address search failed:', error);
        }
      }

      // Only update results if this search is still current
      if (value === data.query) {
        data.searched = results;
      }

    } catch (error) {
      console.error('Search error:', error);
      data.error = 'An error occurred while searching. Please try again.';
    } finally {
      data.loading = false;
    }
  };

  const search = debounce(searchImpl, 1500);

  function shouldRedirectBeforeSearch(searchTerm: string) {
    // Strict Kadena address - direct redirect
    if (strictKadenaAddressRegex.test(searchTerm)) {
      return "account";
    }

    // Very likely request key (longer, alphanumeric with dashes/underscores)
    if (likelyRequestKeyRegex.test(searchTerm) && searchTerm.length >= 40) {
      return "transactions";
    }

    // Block height - numeric only
    if (numericRegex.test(searchTerm)) {
      const height = parseInt(searchTerm);
      if (height >= 0 && height <= 20000000) {
        return "blocks";
      }
    }

    return null;
  }

  function shouldRedirect() {
    // Check for single results and redirect
    if (data?.searched?.addresses && data?.searched?.addresses?.length === 1) {
      const address = data?.searched?.addresses[0];
      router.push(`/account/${address.account}`);
      return true;
    }

    if (data?.searched?.transactions && data?.searched?.transactions?.length === 1) {
      const transaction = data?.searched?.transactions[0];
      router.push(`/transactions/${transaction.requestkey}`);
      return true;
    }

    if (data?.searched?.tokens && data?.searched?.tokens?.length === 1) {
      const token = data?.searched?.tokens[0];
      const staticMetadata = staticTokens.find(({ module }) => module === token.module);
      router.push(`/tokens/${staticMetadata?.id || token.module}`);
      return true;
    }

    if (data?.searched?.blocks && data?.searched?.blocks?.length === 1) {
      const block = data?.searched?.blocks[0];
      router.push(`/blocks/${block.height}/chain/${block.chainId}`);
      return true;
    }

    // If multiple blocks, redirect to first canonical or first available
    if (data?.searched?.blocks && data?.searched?.blocks?.length > 1) {
      const block = data?.searched?.blocks[0];
      router.push(`/blocks/${block.height}/chain/${block.chainId}`);
      return true;
    }

    return false;
  }

  const handleInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    data.query = value;
    search(value);
  };

  const handleKeyDown = async (event: KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    search.cancel();

    const redirectType = shouldRedirectBeforeSearch(data.query);

    if (redirectType) {
      if (redirectType === "blocks") {
        // For blocks, we need to search first to get chainId, default to chain 0
        router.push(`/blocks/${data.query}/chain/0`);
      } else {
        router.push(`/${redirectType}/${data.query}`);
      }
      cleanup();
      return;
    }

    if (!data.loading && data.searched) {
      if (shouldRedirect()) {
        cleanup();
        return;
      }
    }

    await searchImpl(data.query);

    if (shouldRedirect()) {
      cleanup();
    }
  };

  const close = () => {
    data.open = false
  }

  const cleanup = () => {
    data.query = ''
    data.searched = null
    close()
  }

  return {
    data,
    close,
    search,
    cleanup,
    handleKeyDown,
    handleInput,
  };
}
