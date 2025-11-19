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

// Transactions by Pact code (code search)
const transactionsByPactCodeQuery = `
  query TransactionsByPactCode($pactCode: String!, $after: String, $before: String, $first: Int, $last: Int) {
    transactionsByPactCode(pactCode: $pactCode, after: $after, before: $before, first: $first, last: $last) {
      edges {
        cursor
        node {
          requestKey
          canonical
          chainId
          creationTime
          badResult
          gas
          gasLimit
          gasPrice
          height
          sender
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;

// Pact module describe query used to discover module presence across chains
const pactModuleQuery = `
  query PactContract($pactQuery: [PactQuery!]!) {
    pactQuery(pactQuery: $pactQuery) { result }
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
  {
    value: 'modules',
    label: 'Modules',
  },
];

export function useSearch () {
  const data = reactive<any>({
    query: '',
    open: false,
    error: null,
    loading: false,
    _bgPending: 0 as number,
    searched: null,
    filters,
    filter: filters[0],
    // Local search history (persisted in localStorage)
    history: [] as Array<{ query: string, type?: string | null, timestamp: number }>,
    _historyLoaded: false as boolean,
    // Prevent repeated Enter-triggered searches for the same query
    enterLockedForQuery: null as null | string,
    lastSearchWasEmpty: false as boolean,
    // Cache results from pre-redirect checks to avoid duplicate queries in searchImpl
    precheck: {
      query: null as string | null,
      accountExists: null as boolean | null,
      blockHashData: null as any | null, // if falsey but not null => checked and not found
      blockHeightInfo: null as { exists: boolean, chainId?: number, canonical?: boolean } | null,
      transactionData: null as any | null,
    },
  });

  const router = useRouter();
  const { selectedNetwork } = useSharedData();

  // Updated regex patterns - more flexible
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
        tokens: [] as any[],
        code: [] as any[],
        modules: [] as any[],
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
            console.warn('[SEARCH] Block height search failed:', error);
          }
        }
        
        // Search by block hash (for any non-numeric string >= 40 chars)
        if (value.length >= 40 && !numericRegex.test(value)) {
          // If pre-check already looked this up for the same query, reuse it
          if (data.precheck.query === value && data.precheck.blockHashData !== null) {
            const block = data.precheck.blockHashData as any;
            if (block) {
              results.blocks = [...(results.blocks || []), {
                chainId: block.chainId,
                hash: block.hash,
                height: block.height,
                transactionsCount: 0,
                creationTime: block.creationTime,
                canonical: block.canonical
              }];
            }
          } else {
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
                results.blocks = [...(results.blocks || []), {
                  chainId: block.chainId,
                  hash: block.hash,
                  height: block.height,
                  transactionsCount: 0,
                  creationTime: block.creationTime,
                  canonical: block.canonical
                }];
              }
            } catch (error) {
              console.warn('[SEARCH] Block hash search failed:', error);
            }
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
          console.warn('[SEARCH] Transaction search failed:', error);
        }
      }

      // Token search (symbol-focused, case-insensitive, supports leading $)
      if (shouldSearchAll || data.filter.value === 'tokens') {
        try {
          const q = (value || '').trim();
          const norm = q.replace(/^\$/,'').toLowerCase();

          // Exact symbol matches first (may produce multiple if duplicates exist)
          const exactSymbolMatches = staticTokens.filter(t => (t.symbol || '').toLowerCase() === norm);

          let matches = exactSymbolMatches;
          // If no exact symbol matches, fall back to substring search across module/name/symbol
          if (!matches.length) {
            matches = staticTokens.filter(token =>
              token.module.toLowerCase().includes(norm) ||
              (token.name || '').toLowerCase().includes(norm) ||
              (token.symbol || '').toLowerCase().includes(norm)
            );
          }

          results.tokens = matches.map((t) => ({
            type: 'fungible',
            module: t.module,
            name: t.name,
            symbol: t.symbol,
            chainId: 'all',
          }));
        } catch (error) {
          console.warn('[SEARCH] Token search failed:', error);
        }
      }

      // Address search - always try this as fallback, or if specifically searching addresses
      if (shouldSearchAll || data.filter.value === 'address') {
        // If pre-check already determined the account does NOT exist for this query, skip the request
        const canSkip = data.precheck.query === value && data.precheck.accountExists === false;
        if (!canSkip) {
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
            console.warn('[SEARCH] Address search failed:', error);
          }
        }
      }

      // Only update results if this search is still current
      if (value === data.query) {
        data.searched = results;
      }

      // Fire module search in background if the query matches exact namespace.module heuristic
      const looksLikeModule = (() => {
        const parts = (value || '').split('.')
        return parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0
      })();
      if ((shouldSearchAll || data.filter.value === 'modules') && looksLikeModule) {
        // mark background pending and flag items
        data._bgPending++;
        if (value === data.query) {
          const curr = { ...(data.searched || results) } as any;
          curr.__bgLoading = true;
          data.searched = curr;
        }
        (async (currentQuery: string) => {
          try {
            const pactQuery: Array<{ code: string; chainId: string }> = []
            for (let i = 0; i <= 19; i++) {
              pactQuery.push({ code: `(describe-module \"${currentQuery}\")`, chainId: String(i) })
            }

            const moduleResp: any = await $fetch('/api/graphql', {
              method: 'POST',
              body: {
                query: pactModuleQuery,
                variables: { pactQuery },
                networkId: selectedNetwork.value?.id,
              },
            });

            const edges: any[] = moduleResp?.data?.pactQuery || []
            const chains: string[] = []
            let resolvedName: string = currentQuery
            let anyFound = false
            edges.forEach((entry: any, idx: number) => {
              try {
                const raw = entry?.result
                if (!raw) return
                let parsed: any
                try { parsed = JSON.parse(raw) } catch { parsed = raw }
                const codeStr = typeof parsed?.code === 'string' ? parsed.code : ''
                if (codeStr && codeStr.trim().length > 0) {
                  anyFound = true
                  chains.push(String(idx))
                  if (parsed?.name && typeof parsed.name === 'string') {
                    resolvedName = parsed.name
                  }
                }
              } catch {}
            })

            if (anyFound && currentQuery === data.query) {
              const moduleItem = {
                name: resolvedName,
                chains,
                chainsCount: chains.length,
                allChains: chains.length === 20,
              }
              const current = { ...(data.searched || results) } as any
              current.modules = [moduleItem]
              data.searched = current
            }
          } catch (error) {
            console.warn('[SEARCH] Module search failed:', error);
          } finally {
            data._bgPending = Math.max(0, (data._bgPending || 0) - 1);
            if (data._bgPending === 0) {
              const curr = { ...(data.searched || {}) } as any;
              if (curr.__bgLoading) {
                delete curr.__bgLoading;
                data.searched = curr;
              }
            }
          }
        })(value)
      }

    } catch (error) {
      console.error('[SEARCH] Search error:', error);
      data.error = 'An error occurred while searching. Please try again.';
    } finally {
      data.loading = false;
      // Determine if results are empty to control Enter lock
      const isEmptyResults = (items: any) => {
        if (!items) return true;
        try {
          return Object.values(items).every((item: any) => item?.length === 0);
        } catch {
          return true;
        }
      };
      data.lastSearchWasEmpty = isEmptyResults(data.searched);
    }
  };

  const debouncedSearch = debounce((value: string) => {
    searchImpl(value);
  }, 500);

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

  // -------- History helpers --------
  const loadHistory = () => {
    if (data._historyLoaded) return;
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('searchHistory');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        data.history = parsed.slice(0, 20);
      }
      data._historyLoaded = true;
      
    } catch {}
  };

  const saveHistory = () => {
    if (typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify(data.history.slice(0, 20));
      localStorage.setItem('searchHistory', payload);
    } catch {}
  };

  const addToHistory = (query: string, type?: string | null) => {
    loadHistory();
    const trimmed = (query || '').trim();
    if (!trimmed) return;
    // De-duplicate by moving existing to front
    const existingIndex = data.history.findIndex((h: { query: string }) => h.query === trimmed);
    
    if (existingIndex !== -1) {
      const existing = data.history.splice(existingIndex, 1)[0];
      data.history.unshift({ ...existing, type: type ?? existing.type ?? null, timestamp: Date.now() });
    } else {
      data.history.unshift({ query: trimmed, type: type ?? null, timestamp: Date.now() });
    }
    // Cap length
    if (data.history.length > 20) data.history.length = 20;
    saveHistory();
    
  };

  // Public wrapper for result items to record history
  const recordHistory = (query: string, type?: string | null) => {
    addToHistory(query, type);
  };

  const selectHistoryItem = (query: string) => {
    data.open = true;
    data.query = query;
    // Start searching immediately for quick feedback
    search.cancel();
    // Use submit to also handle redirects and add to history
    submit(query);
  };

  async function shouldRedirectBeforeSearch(searchTerm: string) {
    loadHistory();
    // Prepare precheck cache for this query
    data.precheck.query = searchTerm;
    data.precheck.accountExists = null;
    data.precheck.blockHashData = null;
    data.precheck.blockHeightInfo = null;
    data.precheck.transactionData = null;

    // 1. Token symbol exact match (case-insensitive, supports leading $) - Highest Priority
    {
      const norm = (searchTerm || '').trim().replace(/^\$/,'').toLowerCase();
      if (norm.length > 0) {
        const matches = staticTokens.filter(t => (t.symbol || '').toLowerCase() === norm);
        if (matches.length > 0) {
          // Enter should trigger the first one
          return { type: 'token', module: matches[0].module } as any;
        }
      }
    }

    // 2. Block Height
    if (/^\d+$/.test(searchTerm)) {
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
            data.precheck.blockHeightInfo = { exists: true, chainId: firstEdge.chainId, canonical: firstEdge.canonical } as any;
            return { type: "blocks", chainId: firstEdge.chainId, canonical: firstEdge.canonical } as any;
          }
          data.precheck.blockHeightInfo = { exists: false } as any;
        } catch (error) {
          console.warn('[SEARCH] Block height verification failed:', error);
        }
        // If no block at that height, fall through to other checks (it could be an account like "1234567")
      }
    }

    // 3. Transaction Hash - Next Priority (query to verify it exists)
    if (/^[A-Za-z0-9\-_]{20,}$/.test(searchTerm)) {
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
          data.precheck.transactionData = txResponse.data.transaction;
          return { type: "transactions" } as any;
        }
      } catch (error) {
        console.warn('[SEARCH] Transaction verification failed:', error);
      }
    }

    // 4. Module exact match (namespace.module)
    const looksLikeModule = (() => {
      const parts = (searchTerm || '').split('.')
      return parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0
    })();
    if (looksLikeModule) {
      try {
        const pactQuery: Array<{ code: string; chainId: string }> = []
        for (let i = 0; i <= 19; i++) {
          pactQuery.push({ code: `(describe-module \"${searchTerm}\")`, chainId: String(i) })
        }
        const moduleResp: any = await $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: pactModuleQuery,
            variables: { pactQuery },
            networkId: selectedNetwork.value?.id,
          },
        });
        const edges: any[] = moduleResp?.data?.pactQuery || []
        const found = edges.some((entry: any) => {
          try {
            const raw = entry?.result
            if (!raw) return false
            let parsed: any
            try { parsed = JSON.parse(raw) } catch { parsed = raw }
            const codeStr = typeof parsed?.code === 'string' ? parsed.code : ''
            return codeStr && codeStr.trim().length > 0
          } catch { return false }
        })
        if (found) {
          return { type: 'module' } as any
        }
      } catch (error) {
        console.warn('[SEARCH] Module verification failed:', error);
      }
    }

    // 5. Block Hash (query to verify it exists)
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
        data.precheck.blockHashData = blockHashResponse.data.block;
        return { type: "block-hash" } as any;
      }
      data.precheck.blockHashData = false as any;
    } catch (error) {
      console.warn('[SEARCH] Block hash verification failed:', error);
    }

    // 6. Account (verify existence via fungibleAccount)
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
        data.precheck.accountExists = true;
        return { type: "account" } as any;
      }
      data.precheck.accountExists = false;
    } catch (error) {
      console.warn('[SEARCH] Fungible account verification failed:', error);
    }

    // 7. Code search - Last attempt (min 4 chars), but skip when > 12 chars
    if ((searchTerm || '').length >= 4 && (searchTerm || '').length <= 15) {
      try {
        const codeCheck: any = await $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: transactionsByPactCodeQuery,
            variables: {
              pactCode: searchTerm,
              first: 1,
            },
            networkId: selectedNetwork.value?.id,
          },
        });
        const hasAny = (codeCheck?.data?.transactionsByPactCode?.edges || []).length > 0;
        if (hasAny) {
          return { type: 'code' } as any;
        }
      } catch (error) {
        console.warn('[SEARCH] Code verification failed:', error);
      }
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
      router.push(`/token/${encodeURIComponent(token.module)}`);
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

    // Module - auto-redirect when there is exactly one module hit
    if (data?.searched?.modules && data?.searched?.modules?.length === 1) {
      const mod = data?.searched?.modules[0];
      router.push(`/module/${mod.name}`);
      return true;
    }

    return false;
  }

  const handleInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    data.query = value;
    // Ensure history is available when user starts interacting
    loadHistory();
    // If user changed the query, allow Enter again
    if (data.enterLockedForQuery !== null && data.enterLockedForQuery !== value) {
      data.enterLockedForQuery = null;
    }
    // Reset precheck cache when query text changes
    if (data.precheck.query !== value) {
      data.precheck.query = null;
      data.precheck.accountExists = null;
      data.precheck.blockHashData = null;
      data.precheck.blockHeightInfo = null;
      data.precheck.transactionData = null;
    }
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

    // If results are already visible, immediately open the first visible item
    const redirectToFirstResult = () => {
      const items: any = data.searched || {};
      if (!items) return false;
      // Render order in modal: addresses → code → transactions → tokens → blocks → modules
      if (items.addresses && items.addresses.length > 0) {
        const a = items.addresses[0];
        router.push(`/account/${a.account}`);
        return true;
      }
      if (items.code && items.code.length > 0) {
        router.push({ path: '/transactions', query: { code: data.query } });
        return true;
      }
      if (items.transactions && items.transactions.length > 0) {
        const t = items.transactions[0];
        router.push(`/transactions/${t.requestkey}`);
        return true;
      }
      if (items.tokens && items.tokens.length > 0) {
        const tk = items.tokens[0];
        router.push(`/token/${encodeURIComponent(tk.module)}`);
        return true;
      }
      if (items.blocks && items.blocks.length > 0) {
        const b = items.blocks[0];
        const baseUrl = `/blocks/${b.height}/chain/${b.chainId}`;
        const url = b.canonical === false ? `${baseUrl}?canonical=false` : baseUrl;
        router.push(url);
        return true;
      }
      if (items.modules && items.modules.length > 0) {
        const m = items.modules[0];
        router.push(`/module/${m.name}`);
        return true;
      }
      return false;
    };

    if (data.open && data.searched && !data.lastSearchWasEmpty) {
      if (redirectToFirstResult()) {
        cleanup();
        return;
      }
    }

    const redirectInfo: any = await shouldRedirectBeforeSearch(data.query);

    // Record this search attempt in history regardless of redirect
    {
      const historyType = redirectInfo?.type === 'token' ? 'tokens' : (redirectInfo?.type ?? null);
      addToHistory(data.query, historyType);
    }

    if (redirectInfo) {
      if (redirectInfo.type === "blocks") {
        const baseUrl = `/blocks/${data.query}/chain/${redirectInfo.chainId}`;
        const url = redirectInfo.canonical === false ? `${baseUrl}?canonical=false` : baseUrl;
        router.push(url);
        cleanup();
        return;
      } else if (redirectInfo.type === 'token') {
        router.push(`/token/${encodeURIComponent(redirectInfo.module)}`);
        cleanup();
        return;
      } else if (redirectInfo.type === "block-hash") {
        // For block hashes, we need to search first to get the block data
        // Don't redirect immediately, let the search complete first
      } else if (redirectInfo.type === 'code') {
        router.push({ path: '/transactions', query: { code: data.query } });
        cleanup();
        return;
      } else if (redirectInfo.type === 'module') {
        router.push(`/module/${data.query}`);
        cleanup();
        return;
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

  // Trigger a search programmatically (used by search button and history click)
  const submit = async (value?: string) => {
    const q = typeof value === 'string' ? value : data.query;
    if (!q) return;
    
    data.query = q;
    search.cancel();
    data.open = true;
    data.loading = true;
    data.error = null;

    const redirectInfo: any = await shouldRedirectBeforeSearch(q);
    
    {
      const historyType = redirectInfo?.type === 'token' ? 'tokens' : (redirectInfo?.type ?? null);
      addToHistory(q, historyType);
    }

    if (redirectInfo) {
      if (redirectInfo.type === "blocks") {
        const baseUrl = `/blocks/${q}/chain/${redirectInfo.chainId}`;
        const url = redirectInfo.canonical === false ? `${baseUrl}?canonical=false` : baseUrl;
        router.push(url);
        cleanup();
        return;
      } else if (redirectInfo.type === 'token') {
        router.push(`/token/${encodeURIComponent(redirectInfo.module)}`);
        cleanup();
        return;
      } else if (redirectInfo.type === "block-hash") {
        // Need to resolve block data first
      } else if (redirectInfo.type === 'code') {
        router.push({ path: '/transactions', query: { code: q } });
        cleanup();
        return;
      } else if (redirectInfo.type === 'module') {
        router.push(`/module/${q}`);
        cleanup();
        return;
      } else {
        router.push(`/${redirectInfo.type}/${q}`);
        cleanup();
        return;
      }
    }

    await searchImpl(q);
    

    if (shouldRedirect()) {
      cleanup();
      return;
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
    data.enterLockedForQuery = null
    data.lastSearchWasEmpty = false
    data.precheck.query = null
    data.precheck.accountExists = null
    data.precheck.blockHashData = null
    data.precheck.blockHeightInfo = null
    data.precheck.transactionData = null
    close()
  }

  return {
    data,
    close,
    search,
    submit,
    cleanup,
    handleKeyDown,
    handleInput,
    selectHistoryItem,
    loadHistory,
    recordHistory,
  };
}


