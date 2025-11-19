import { ref, readonly } from 'vue'

const GQL_QUERY = `
  query Balance($module: String, $after: String, $before: String, $first: Int, $last: Int, $chainIds: [String!]) {
    balance(module: $module, after: $after, before: $before, first: $first, last: $last, chainIds: $chainIds) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        cursor
        node {
          accountName
          balance
          chainId
          module
        }
      }
    }
  }
`

const holders = ref<any[]>([])
const loading = ref(true)
const pageInfo = ref<any>(null)
const rowsToShow = ref(25)
const error = ref<any>(null)

export function useTokenHolders() {
  const clearState = () => {
    holders.value = []
    loading.value = true
    pageInfo.value = null
    error.value = null
  }

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value
  }

  const fetchTokenHolders = async ({
    networkId,
    module,
    after,
    before,
    chainIds,
  }: {
    networkId: string
    module: string
    after?: string
    before?: string
    chainIds?: string[]
  }) => {
    if (!networkId || !module) return
    loading.value = holders.value.length === 0
    error.value = null

    try {
      const isPrev = !!before && !after
      const first = isPrev ? null : rowsToShow.value
      const last = isPrev ? rowsToShow.value : null

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            module,
            first,
            last,
            after: isPrev ? null : after,
            before: isPrev ? before : null,
            chainIds,
          },
          networkId,
        },
      })

      const result = response?.data?.balance
      pageInfo.value = result?.pageInfo || null
      if (!result || result.edges.length === 0) {
        holders.value = []
        return
      }
      holders.value = (result.edges || []).map((edge: any) => {
        const n = edge.node || {}
        return {
          address: n.accountName,
          balance: n.balance,
          chainId: n.chainId,
          module: n.module,
          cursor: edge.cursor,
        }
      })
    } catch (e) {
      error.value = new Error('Unable to load token holders. Please try again.')
      holders.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    holders: readonly(holders),
    loading: readonly(loading),
    pageInfo: readonly(pageInfo),
    rowsToShow: readonly(rowsToShow),
    error: readonly(error),
    fetchTokenHolders,
    updateRowsToShow,
    clearState,
  }
}

