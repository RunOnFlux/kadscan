import { ref } from 'vue';

const ACCOUNT_QUERY = `
query FungibleAccount($accountName: String!) {
  fungibleAccount(accountName: $accountName) {
    fungibleName
    accountName
    totalBalance
    chainAccounts {
      balance
      chainId
      guard {
        ... on KeysetGuard {
          keys
          predicate   
        }
      }
    }
  }
}
`;

const TRANSFERS_QUERY = `
query Transfers($accountName: String, $first: Int, $last: Int, $chainId: String) {
  transfers(accountName: $accountName, first: $first, last: $last, chainId: $chainId) {
    totalCount
    edges {
      node {
        amount
        senderAccount
        receiverAccount
        crossChainTransfer {
          receiverAccount
          senderAccount
          block {
            chainId
            height
          }
        }
        requestKey
        creationTime
        block {
          height
          chainId
        }
      }
    }
  }
}
`;

const accountData = ref<any>(null);
const accountLoading = ref(false);
const error = ref<any>(null);
const transfersLoading = ref(false);
const firstTransaction = ref<any>(null);
const lastTransaction = ref<any>(null);

export const useAccount = () => {
  const clearState = () => {
    accountData.value = null;
    accountLoading.value = false;
    error.value = null;
    transfersLoading.value = false;
    firstTransaction.value = null;
    lastTransaction.value = null;
  };

  const fetchFirstAndLastTransfers = async ({
    networkId,
    accountName,
    chainId,
  }: {
    networkId: string;
    accountName: string;
    chainId?: string;
  }) => {
    if (!networkId || !accountName || !accountData.value) return;
    
    // Reset previous results to avoid showing stale data when chain has no history
    firstTransaction.value = null;
    lastTransaction.value = null;

    transfersLoading.value = true;
    
    try {
      // Fetch first and last transfers in parallel
      // Note: In our indexer, 'first' returns the oldest transfer, 'last' returns the most recent one
      const [firstResponse, lastResponse] = await Promise.all([
        $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: TRANSFERS_QUERY,
            variables: {
              accountName,
              first: 1,
              chainId,
            },
            networkId,
          }
        }),
        $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: TRANSFERS_QUERY,
            variables: {
              accountName,
              last: 1,
              chainId,
            },
            networkId,
          }
        })
      ]);
      console.log('firstResponse', firstResponse)
      console.log('lastResponse', lastResponse)

      const firstTransferData = firstResponse?.data?.transfers?.edges?.[0]?.node;
      if (firstTransferData) {
        firstTransaction.value = {
          requestKey: firstTransferData.requestKey,
          creationTime: firstTransferData.creationTime,
        };

        // Determine who funded this account (sender of the earliest transfer that brought assets IN)
        let senderAccount = firstTransferData.senderAccount;
        let receiverAccount = firstTransferData.receiverAccount;

        // Handle cross-chain transfers - get the actual sender/receiver
        if (firstTransferData.crossChainTransfer) {
          // For cross-chain transfers, prioritize the crossChainTransfer data if available
          senderAccount = firstTransferData.crossChainTransfer.senderAccount || senderAccount;
          receiverAccount = firstTransferData.crossChainTransfer.receiverAccount || receiverAccount;
          firstTransaction.value.height = firstTransferData.crossChainTransfer.block.height;
          firstTransaction.value.chainId = firstTransferData.crossChainTransfer.block.chainId;
        } else {
          firstTransaction.value.height = firstTransferData.block.height;
          firstTransaction.value.chainId = firstTransferData.block.chainId;
        }

        firstTransaction.value.fundedBy = senderAccount;
      } else {
        firstTransaction.value = null;
      }

      // Process most recent transfer (from firstResponse since 'first' gets most recent)
      const lastTransferData = lastResponse?.data?.transfers?.edges?.[0]?.node;
      if (lastTransferData) {
        lastTransaction.value = {
          requestKey: lastTransferData.requestKey,
          creationTime: lastTransferData.creationTime,      
        };
      } else {
        lastTransaction.value = null;
      }

    } catch (e) {
      console.error('Error fetching first and last transfers:', e);
      // Don't set error state for transfers as it's supplementary data
    } finally {
      transfersLoading.value = false;
    }
  };

  const fetchAccount = async ({
    networkId,
    accountName,
  }: {
    networkId: string;
    accountName: string;
  }) => {
    if (!networkId || !accountName) return;
    
    accountLoading.value = true;
    error.value = null;
    
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: ACCOUNT_QUERY,
          variables: {
            accountName,
          },
          networkId,
        }
      });

      const result = response?.data?.fungibleAccount;
      
      if (!result) {
        error.value = true;
        accountData.value = null;
        return;
      }

      accountData.value = result;
      
      // Transfers will be fetched separately with optional chain filter by callers
      
    } catch (e) {
      console.error('Error fetching account data:', e);
      error.value = e;
      accountData.value = null;
    } finally {
      accountLoading.value = false;
    }
  };

  // Removed fetchChainAccount; use chain filter on transfers instead

  return {
    accountData,
    accountLoading,
    error,
    transfersLoading,
    firstTransaction,
    lastTransaction,
    fetchAccount,
    fetchFirstAndLastTransfers,
    clearState,
  };
}; 