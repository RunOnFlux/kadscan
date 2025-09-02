import { ref, readonly } from 'vue'
import { useFormat } from './useFormat'

const GQL_QUERY = `
  query Transfers($chainId: String, $after: String, $before: String, $first: Int, $last: Int, $fungibleName: String) {
    transfers(chainId: $chainId, after: $after, before: $before, first: $first, last: $last, fungibleName: $fungibleName) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        cursor
        node {
          amount
          block {
            chainId
            height
          }
          creationTime
          moduleName
          receiverAccount
          senderAccount
          requestKey
          crossChainTransfer {
            senderAccount
            receiverAccount
          }
        }
      }
    }
  }
`

const tokenTransfers = ref<any[]>([])
const loading = ref(true)
const pageInfo = ref<any>(null)
const totalCount = ref(0)
const rowsToShow = ref(10)
const error = ref<any>(null)

const { formatRelativeTime, removeTrailingZeros } = useFormat()

export function useTokenTransfers() {
  const clearState = () => {
    tokenTransfers.value = []
    loading.value = true
    pageInfo.value = null
    error.value = null
  }

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value
  }

  const shapeTransfer = (edge: any) => {
    const node = edge.node || {}
    const block = node.block || {}
    const cross = node.crossChainTransfer || null
    let sender: string | null = node.senderAccount || null
    let receiver: string | null = node.receiverAccount || null
    if (cross) {
      if (!sender) sender = cross.senderAccount || null
      if (!receiver) receiver = cross.receiverAccount || null
    }

    return {
      requestKey: node.requestKey,
      action: cross ? 'Cross-Chain' : 'Transfer',
      height: block.height,
      chainId: block.chainId,
      time: formatRelativeTime(node.creationTime),
      sender: sender || 'N/A',
      receiver: receiver || 'N/A',
      amount: removeTrailingZeros(node.amount ?? ''),
      cursor: edge.cursor,
    }
  }

  const fetchTokenTransfers = async ({
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
    loading.value = tokenTransfers.value.length === 0
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
            fungibleName,
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? lastPageSize : isForward ? null : rowsToShow.value,
            after,
            before,
            chainId,
          },
          networkId,
        },
      })

      const result = response?.data?.transfers
      pageInfo.value = result?.pageInfo || null
      totalCount.value = result?.totalCount || 0

      if (!result || result.edges.length === 0) {
        tokenTransfers.value = []
        return
      }

      tokenTransfers.value = (result.edges || []).map((edge: any) => shapeTransfer(edge))
    } catch (e) {
      error.value = e
      tokenTransfers.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    tokenTransfers: readonly(tokenTransfers),
    loading: readonly(loading),
    pageInfo: readonly(pageInfo),
    totalCount: readonly(totalCount),
    rowsToShow: readonly(rowsToShow),
    error: readonly(error),
    fetchTokenTransfers,
    updateRowsToShow,
    clearState,
  }
}

