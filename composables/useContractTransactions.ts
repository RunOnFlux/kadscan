import { ref } from 'vue'
import { useFormat } from './useFormat'

const GQL_QUERY = `
  query Transactions(
    $first: Int,
    $last: Int,
    $after: String,
    $before: String,
    $chainId: String,
    $fungibleName: String,
  ) {
    transactions(
      first: $first,
      last: $last,
      after: $after,
      before: $before,
      chainId: $chainId,
      fungibleName: $fungibleName,
    ) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        node {
          hash
          cmd {
            meta {
              gasLimit
              chainId
              creationTime
              gasPrice
              sender
            }
          }
          result {
            ... on TransactionResult {
              badResult
              gas
              block {
                height
                canonical
              }
            }
          }
        }
        cursor
      }
    }
  }
`

const transactions = ref<any[]>([])
const loading = ref(true)
const pageInfo = ref<any>(null)
const totalCount = ref(0)
const rowsToShow = ref(25)
const error = ref<any>(null)
const { formatRelativeTime, formatGasPrice } = useFormat()

export function useContractTransactions() {
  const clearState = () => {
    transactions.value = []
    loading.value = true
    pageInfo.value = null
    error.value = null
    totalCount.value = 0
  }

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value
  }

  const fetchTransactionsByFungible = async ({
    networkId,
    fungibleName,
    after,
    before,
    toLastPage = false,
    chainId,
  }: {
    networkId: string
    fungibleName: string
    after?: string
    before?: string
    toLastPage?: boolean
    chainId?: string
  }) => {
    if (!networkId || !fungibleName) return
    loading.value = transactions.value.length === 0
    error.value = null

    try {
      const isForward = !!after || (!after && !before)
      const lastPageSize = (() => {
        const remainder = totalCount.value % rowsToShow.value
        return remainder === 0 ? rowsToShow.value : remainder
      })()

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: {
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? lastPageSize : isForward ? null : rowsToShow.value,
            after,
            before,
            chainId,
            fungibleName,
          },
          networkId,
        },
      })

      const result = response?.data?.transactions
      pageInfo.value = result?.pageInfo || null
      totalCount.value = result?.totalCount || 0

      if (result === undefined || result.edges.length === 0) {
        error.value = true
        transactions.value = []
        return
      }

      const rawTxs = result?.edges || []
      transactions.value = rawTxs.map((edge: any) => {
        return {
          requestKey: edge.node.hash,
          height: edge.node.result.block?.height,
          canonical: edge.node.result.block?.canonical,
          badResult: edge.node.result.badResult,
          chainId: edge.node.cmd.meta.chainId,
          time: formatRelativeTime(edge.node.cmd.meta.creationTime),
          sender: edge.node.cmd.meta.sender,
          gasPrice: formatGasPrice(parseFloat(edge.node.cmd.meta.gasPrice)),
          rawGasPrice: edge.node.cmd.meta.gasPrice,
          gas: edge.node.result.gas,
          gasLimit: new Intl.NumberFormat().format(edge.node.cmd.meta.gasLimit),
          rawGasLimit: edge.node.cmd.meta.gasLimit,
          cursor: edge.cursor,
        }
      })
    } catch (e) {
      console.error('Error fetching contract transactions:', e)
      error.value = e
      transactions.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    error,
    transactions,
    loading,
    fetchTransactionsByFungible,
    pageInfo,
    totalCount,
    rowsToShow,
    updateRowsToShow,
    clearState,
  }
}
