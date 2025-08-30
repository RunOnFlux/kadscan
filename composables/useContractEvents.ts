import { ref, readonly } from 'vue'
import { useFormat } from './useFormat'

const GQL_QUERY = `
  query Events($moduleName: String, $chainId: String, $after: String, $before: String, $first: Int, $last: Int) {
    events(moduleName: $moduleName, chainId: $chainId, after: $after, before: $before, first: $first, last: $last) {
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
          requestKey
          parameterText
          qualifiedName
          block {
            chainId
            height
            canonical
          }
          transaction {
            cmd {
              meta {
                creationTime
              }
            }
            result {
              ... on TransactionResult {
                badResult
              }
            }
          }
        }
      }
    }
  }
`

const events = ref<any[]>([])
const loading = ref(true)
const pageInfo = ref<any>(null)
const totalCount = ref(0)
const rowsToShow = ref(10)
const error = ref<any>(null)

export const useContractEvents = () => {
  const { formatRelativeTime } = useFormat()

  const clearState = () => {
    events.value = []
    loading.value = true
    pageInfo.value = null
    error.value = null
  }

  const updateRowsToShow = (rows: any) => {
    rowsToShow.value = rows.value
  }

  const fetchContractEvents = async ({
    networkId,
    moduleName,
    chainId,
    after,
    before,
    toLastPage = false,
  }: {
    networkId: string,
    moduleName: string,
    chainId?: string,
    after?: string,
    before?: string,
    toLastPage?: boolean,
  }) => {
    if (!networkId || !moduleName) return
    loading.value = events.value.length === 0
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
            moduleName,
            chainId,
            first: toLastPage ? null : isForward ? rowsToShow.value : null,
            last: toLastPage ? lastPageSize : isForward ? null : rowsToShow.value,
            after,
            before,
          },
          networkId,
        },
      })

      const result = response?.data?.events
      pageInfo.value = result?.pageInfo || null
      totalCount.value = result?.totalCount || 0

      if (!result || result.edges.length === 0) {
        events.value = []
        return
      }

      const rawEdges = result.edges || []
      events.value = rawEdges.map((edge: any) => {
        const node = edge.node || {}
        const creationTime = node?.transaction?.cmd?.meta?.creationTime
        return {
          requestKey: node.requestKey,
          qualifiedName: node.qualifiedName,
          parameterText: node.parameterText,
          height: node.block?.height,
          chainId: node.block?.chainId,
          canonical: node.block?.canonical,
          badResult: node?.transaction?.result?.badResult ?? null,
          time: creationTime ? formatRelativeTime(creationTime) : 'N/A',
          cursor: edge.cursor,
        }
      })
    } catch (e) {
      console.error('Error fetching contract events:', e)
      error.value = e
      events.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    error: readonly(error),
    events: readonly(events),
    loading: readonly(loading),
    fetchContractEvents,
    pageInfo: readonly(pageInfo),
    totalCount: readonly(totalCount),
    rowsToShow: readonly(rowsToShow),
    updateRowsToShow,
    clearState,
  }
}

