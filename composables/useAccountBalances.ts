import { ref, readonly } from 'vue'

const GQL_QUERY = `
  query Query($accountName: String!, $first: Int, $before: String, $after: String, $last: Int, $chainIds: [String!]) {
    lastBlockHeight
    balance(accountName: $accountName, first: $first, before: $before, after: $after, last: $last, chainIds: $chainIds) {
      edges {
        cursor
        node {
          balance
          chainId
          module
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
`

const loading = ref(false)
const error = ref<any>(null)
const pageInfo = ref<any>(null)
const lastBlockHeight = ref<number | null>(null)
const balances = ref<Array<{ balance: string; chainId: string; module: string }>>([])

export const useAccountBalances = () => {
  const clearState = () => {
    loading.value = false
    error.value = null
    pageInfo.value = null
    lastBlockHeight.value = null
    balances.value = []
  }

  const fetchAccountBalances = async ({
    networkId,
    accountName,
    chainIds,
    first,
    last,
    before,
    after,
  }: {
    networkId: string
    accountName: string
    chainIds?: string[]
    first?: number | null
    last?: number | null
    before?: string | null
    after?: string | null
  }) => {
    if (!networkId || !accountName) return
    loading.value = balances.value.length === 0
    error.value = null

    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            accountName,
            first: first ?? null,
            last: last ?? null,
            before: before ?? null,
            after: after ?? null,
            chainIds: chainIds && chainIds.length > 0 ? chainIds : null,
          },
          networkId,
        },
      })

      const data = response?.data
      lastBlockHeight.value = data?.lastBlockHeight ?? null
      const result = data?.balance
      pageInfo.value = result?.pageInfo || null
      const edges = Array.isArray(result?.edges) ? result.edges : []
      balances.value = edges.map((e: any) => e?.node).filter(Boolean)
    } catch (e: any) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    pageInfo: readonly(pageInfo),
    lastBlockHeight: readonly(lastBlockHeight),
    balances: readonly(balances),
    fetchAccountBalances,
    clearState,
  }
}


