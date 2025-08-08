import { ref } from 'vue';

const GQL_QUERY = `
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
query Transfers($accountName: String, $last: Int) {
  transfers(accountName: $accountName, last: $last) {
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

const CHAIN_ACCOUNT_QUERY = `
query FungibleChainAccount($accountName: String!, $chainId: String!) {
  fungibleChainAccount(accountName: $accountName, chainId: $chainId) {
    chainId
    transactions {
      totalCount
    }
    balance
    guard {
      ... on KeysetGuard {
        predicate
        keys
        raw
      }
    }
    accountName
    fungibleName
  }
}
`;

const accountData = ref<any>(null);
const chainAccount = ref<any>(null);
const loading = ref(false);
const error = ref<any>(null);
const transfersLoading = ref(false);
const firstTransaction = ref<any>(null);
const lastTransaction = ref<any>(null);

export const useAccount = () => {
  const clearState = () => {
    accountData.value = null;
    loading.value = false;
    error.value = null;
    transfersLoading.value = false;
    firstTransaction.value = null;
    lastTransaction.value = null;
    chainAccount.value = null;
  };

  const fetchFirstAndLastTransfers = async ({
    networkId,
    accountName,
  }: {
    networkId: string;
    accountName: string;
  }) => {
    if (!networkId || !accountName || !accountData.value) return;
    
    transfersLoading.value = true;
    
    try {
      // Fetch first and last transfers in parallel
      // Note: In our indexer, 'first' returns the most recent transfer, 'last' returns the earliest
      const [firstResponse, lastResponse] = await Promise.all([
        $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: TRANSFERS_QUERY,
            variables: {
              accountName,
              first: 1, // Gets the most recent transfer
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
              last: 1, // Gets the most old transfer
            },
            networkId,
          }
        })
      ]);

      // I know it's counter intuitive, but the first transfer is the most recent one, and the last transfer is the oldest one
      const lastTransferData = lastResponse?.data?.transfers?.edges?.[0]?.node;
      if (lastTransferData) {
        lastTransaction.value = {
          requestKey: lastTransferData.requestKey,
          creationTime: lastTransferData.creationTime,
        };

        // Determine who funded this account (sender of the earliest transfer that brought assets IN)
        let senderAccount = lastTransferData.senderAccount;
        let receiverAccount = lastTransferData.receiverAccount;

        // Handle cross-chain transfers - get the actual sender/receiver
        if (lastTransferData.crossChainTransfer) {
          // For cross-chain transfers, prioritize the crossChainTransfer data if available
          senderAccount = lastTransferData.crossChainTransfer.senderAccount || senderAccount;
          receiverAccount = lastTransferData.crossChainTransfer.receiverAccount || receiverAccount;
          lastTransaction.value.height = lastTransferData.crossChainTransfer.block.height;
          lastTransaction.value.chainId = lastTransferData.crossChainTransfer.block.chainId;
        } else {
          lastTransaction.value.height = lastTransferData.block.height;
          lastTransaction.value.chainId = lastTransferData.block.chainId;
        }

        lastTransaction.value.fundedBy = senderAccount;
      }

      // Process most recent transfer (from firstResponse since 'first' gets most recent)
      const firstTransferData = firstResponse?.data?.transfers?.edges?.[0]?.node;
      if (firstTransferData) {
        firstTransaction.value = {
          requestKey: firstTransferData.requestKey,
          creationTime: firstTransferData.creationTime,      
        };
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
    
    loading.value = true;
    error.value = null;
    
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
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
      
      // Fetch first and last transfers after successful account fetch
      await fetchFirstAndLastTransfers({ networkId, accountName });
      
    } catch (e) {
      console.error('Error fetching account data:', e);
      error.value = e;
      accountData.value = null;
    } finally {
      loading.value = false;
    }
  };

  const fetchChainAccount = async ({
    networkId,
    accountName,
    chainId,
  }: {
    networkId: string;
    accountName: string;
    chainId: string;
  }) => {
    if (!networkId || !accountName || !chainId) return;
    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: CHAIN_ACCOUNT_QUERY,
          variables: { accountName, chainId },
          networkId,
        },
      });
      chainAccount.value = response?.data?.fungibleChainAccount || null;
    } catch (e) {
      console.error('Error fetching chain account data:', e);
      chainAccount.value = null;
    }
  };

  return {
    accountData,
    chainAccount,
    loading,
    error,
    transfersLoading,
    firstTransaction,
    lastTransaction,
    fetchAccount,
    fetchChainAccount,
    fetchFirstAndLastTransfers,
    clearState,
  };
}; 