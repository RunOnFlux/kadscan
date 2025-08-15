import debounce from 'lodash/debounce'
import { staticTokens } from '~/constants/tokens';

// New individual queries for the updated indexer
const blocksQuery = `
  query BlocksFromHeight($startHeight: Int!, $endHeight: Int) {
    blocksFromHeight(startHeight: $startHeight, endHeight: $endHeight) {
      edges {
        node {
          hash
          height
          chainId
          canonical
          creationTime
        }
      }
    }
  }
`;

// Block hash search query
const blockHashQuery = `
  query Block($hash: String!) {
    block(hash: $hash) {
      hash
      chainId
      height
      canonical
      creationTime
    }
  }
`;

// Account existence check (works even for accounts without transactions)
const fungibleAccountQuery = `
  query FungibleAccount($accountName: String!) {
    fungibleAccount(accountName: $accountName) {
      fungibleName
      accountName
      totalBalance
    }
  }
`;

const transactionQuery = `
  query Query($requestKey: String!) {
    transaction(requestKey: $requestKey) {
      result {
        ... on TransactionResult {
          badResult
          goodResult
          block {
            height
            chainId
          }
        }
      }
      hash
      cmd {
        meta {
          creationTime
        }
      }
    }
  }
`;

const tokenQuery = `
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
  const { selectedNetwork } = useSharedData();

  // Updated regex patterns - more flexible
  const strictKadenaAddressRegex = /^k:[a-fA-F0-9]{64}$/;
  const likelyRequestKeyRegex = /^[A-Za-z0-9\-_]{20,}$/; // More flexible length
  const numericRegex = /^\d+$/;

  const searchImpl = async (value: string) => {
    if (!value) {
      data.searched = null;
      data.loading = false;
      data.error = null;
      return;
    }

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
      
      // Block search - if numeric input (height) or block hash
      if (shouldSearchAll || data.filter.value === 'blocks') {
        // Search by block height (numeric input)
        if (numericRegex.test(value)) {
          try {
            const height = parseInt(value);
            if (height >= 0 && height <= 20000000) { // Height range validation
              const blockResponse: any = await $fetch('/api/graphql', {
                method: 'POST',
                body: {
                  query: blocksQuery,
                  variables: {
                    startHeight: height,
                    endHeight: height
                  },
                  networkId: selectedNetwork.value?.id,
                },
              });
              
              if (blockResponse.data?.blocksFromHeight?.edges) {
                results.blocks = blockResponse.data.blocksFromHeight.edges.map((edge: any) => {
                  return {
                    chainId: edge.node.chainId,
                    hash: edge.node.hash,
                    height: edge.node.height,
                    transactionsCount: edge.node.transactions?.totalCount || 0,
                    creationTime: edge.node.creationTime,
                    canonical: edge.node.canonical
                  }
                });
              }
            }
          } catch (error) {
            console.warn('Block height search failed:', error);
          }
        }
        
        // Search by block hash (for any non-numeric string >= 40 chars)
        if (value.length >= 40 && !numericRegex.test(value)) {
          try {
            const blockHashResponse: any = await $fetch('/api/graphql', {
              method: 'POST',
              body: {
                query: blockHashQuery,
                variables: {
                  hash: value
                },
                networkId: selectedNetwork.value?.id,
              },
            });
            
            if (blockHashResponse.data?.block) {
              const block = blockHashResponse.data.block;
              // Add the block hash result to existing blocks array
              results.blocks = [...(results.blocks || []), {
                chainId: block.chainId,
                hash: block.hash,
                height: block.height,
                transactionsCount: 0, // Hash search doesn't return transaction count
                creationTime: block.creationTime,
                canonical: block.canonical
              }];
            }
          } catch (error) {
            console.warn('Block hash search failed:', error);
          }
        }
      }

      // Transaction search - if looks like request key
      if ((shouldSearchAll || data.filter.value === 'transactions') && likelyRequestKeyRegex.test(value)) {
        try {
          const txResponse: any = await $fetch('/api/graphql', {
            method: 'POST',
            body: {
              query: transactionQuery,
              variables: {
                requestKey: value
              },
              networkId: selectedNetwork.value?.id,
            },
          });
          
          if (txResponse.data?.transaction) {
            const transaction = txResponse.data.transaction;
            
            // Create a proper result string for useTransactionStatus
            let resultString = '';
            if (transaction.result?.badResult) {
              resultString = `{"status":"error","badResult":${JSON.stringify(transaction.result.badResult)}}`;
            } else if (transaction.result?.goodResult) {
              resultString = `{"status":"success","goodResult":${JSON.stringify(transaction.result.goodResult)}}`;
            } else {
              resultString = '{"status":"success"}'; // Default to success if no error
            }
            
            results.transactions = [{
              requestkey: value,
              sender: 'N/A', // Not available in this query  
              result: resultString,
              chainId: transaction.result?.block?.chainId || 'N/A',
              height: transaction.result?.block?.height || 'N/A',
              hash: transaction.hash,
              creationTime: transaction.cmd?.meta?.creationTime || null
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
            const tokenResponse: any = await $fetch('/api/graphql', {
              method: 'POST',
              body: {
                query: tokenQuery,
                variables: {
                  tokenAddress: staticToken.module
                },
                networkId: selectedNetwork.value?.id,
              },
            });
            
            if (tokenResponse.data?.tokenPrice) {
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
          const fungibleResponse: any = await $fetch('/api/graphql', {
            method: 'POST',
            body: {
              query: fungibleAccountQuery,
              variables: {
                accountName: value
              },
              networkId: selectedNetwork.value?.id,
            },
          });
          
          if (fungibleResponse?.data?.fungibleAccount) {
            results.addresses = [{
              account: value,
              id: value, // Use the account name as ID
              totalBalance: fungibleResponse.data.fungibleAccount.totalBalance
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

  const debouncedSearch = debounce((value: string) => {
    searchImpl(value);
  }, 250);

  type SearchFunction = ((value: string) => void) & { cancel: () => void };
  const search: SearchFunction = Object.assign(
    (value: string) => {
      if (!value) {
        debouncedSearch.cancel();
        data.searched = null;
        data.loading = false;
        data.error = null;
        return;
      }
      data.loading = true;
      data.error = null;
      data.open = true;
      debouncedSearch(value);
    },
    { cancel: () => debouncedSearch.cancel() }
  );

  async function shouldRedirectBeforeSearch(searchTerm: string) {
    // 1. Block Height - Highest Priority (numeric only)
    if (numericRegex.test(searchTerm)) {
      const height = parseInt(searchTerm);
      if (height >= 0 && height <= 20000000) {
        try {
          const blockResponse: any = await $fetch('/api/graphql', {
            method: 'POST',
            body: {
              query: blocksQuery,
              variables: {
                startHeight: height,
                endHeight: height
              },
              networkId: selectedNetwork.value?.id,
            },
          });

          const firstEdge = blockResponse?.data?.blocksFromHeight?.edges?.[0]?.node;
          if (firstEdge) {
            return { type: "blocks", chainId: firstEdge.chainId, canonical: firstEdge.canonical } as any;
          }
        } catch (error) {
          console.warn('Block height verification failed:', error);
        }
        // If no block at that height, fall through to other checks (it could be an account like "1234567")
      }
    }

    // 2. Transaction Hash - Second Priority (query to verify it exists)
    if (likelyRequestKeyRegex.test(searchTerm)) {
      try {
        const txResponse: any = await $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: transactionQuery,
            variables: {
              requestKey: searchTerm
            },
            networkId: selectedNetwork.value?.id,
          },
        });
        
        if (txResponse.data?.transaction) {
          return { type: "transactions" } as any;
        }
      } catch (error) {
        console.warn('Transaction verification failed:', error);
      }
    }

    // 3. Block Hash - Third Priority (query to verify it exists)
    try {
      const blockHashResponse: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: blockHashQuery,
          variables: {
            hash: searchTerm
          },
          networkId: selectedNetwork.value?.id,
        },
      });
      
      if (blockHashResponse.data?.block) {
        return { type: "block-hash" } as any;
      }
    } catch (error) {
      console.warn('Block hash verification failed:', error);
    }

    // 4. Account - Final Fallback (verify existence via fungibleAccount)
    try {
      const fungibleResponse: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: fungibleAccountQuery,
          variables: {
            accountName: searchTerm
          },
          networkId: selectedNetwork.value?.id,
        },
      });
      
      if (fungibleResponse?.data?.fungibleAccount) {
        return { type: "account" } as any;
      }
    } catch (error) {
      console.warn('Fungible account verification failed:', error);
    }

    // If nothing matched, return null to show no results
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
      const blockUrl = `/blocks/${block.height}/chain/${block.chainId}`;
      // Add canonical parameter if block is not canonical
      const url = block.canonical === false ? `${blockUrl}?canonical=false` : blockUrl;
      router.push(url);
      return true;
    }

    // If multiple blocks, redirect to first canonical or first available
    if (data?.searched?.blocks && data?.searched?.blocks?.length > 1) {
      const block = data?.searched?.blocks[0];
      const blockUrl = `/blocks/${block.height}/chain/${block.chainId}`;
      // Add canonical parameter if block is not canonical
      const url = block.canonical === false ? `${blockUrl}?canonical=false` : blockUrl;
      router.push(url);
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

    // Show loading while pre-redirect checks run
    data.open = true;
    data.loading = true;
    data.error = null;

    const redirectInfo: any = await shouldRedirectBeforeSearch(data.query);

    if (redirectInfo) {
      if (redirectInfo.type === "blocks") {
        const baseUrl = `/blocks/${data.query}/chain/${redirectInfo.chainId}`;
        const url = redirectInfo.canonical === false ? `${baseUrl}?canonical=false` : baseUrl;
        router.push(url);
        cleanup();
        return;
      } else if (redirectInfo.type === "block-hash") {
        // For block hashes, we need to search first to get the block data
        // Don't redirect immediately, let the search complete first
      } else {
        router.push(`/${redirectInfo.type}/${data.query}`);
        cleanup();
        return;
      }
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
    data.loading = false
    data.error = null
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
