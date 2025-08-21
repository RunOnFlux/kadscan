import { ref, readonly } from 'vue'
import { useSharedData } from '~/composables/useSharedData'

type NftHolding = {
  balance: number
  chainId: string
  tokenId: string
  info?: {
    precision?: number
    supply?: number
    uri?: string | null
  } | null
}

type MetadataRecord = Record<string, any>

const GQL_QUERY = `
  query NonFungibleAccount($accountName: String!) {
    nonFungibleAccount(accountName: $accountName) {
      nonFungibleTokenBalances {
        balance
        chainId
        tokenId
        info {
          precision
          supply
          uri
        }
      }
    }
  }
`

// Module-scope state so multiple components on the page share it
const loading = ref(false)
const error = ref<any>(null)
const nfts = ref<NftHolding[]>([])
const metadataByKey = ref<MetadataRecord>({})
const metadataErrors = ref<Record<string, { url: string; reason: string } | null>>({})

// Track current cache key and a simple cache so repeated navigations within the same view reuse data
const currentCacheKey = ref<string | null>(null)
const cache = new Map<string, { nfts: NftHolding[]; metadataByKey: MetadataRecord }>()

// Background queue controls
let abortController: AbortController | null = null
let queueStartedForKey: string | null = null

function ipfsToHttp(uri: string): string {
  if (!uri) return uri
  if (uri.startsWith('ipfs://')) {
    const path = uri.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${path}`
  }
  return uri
}

function keyFor(h: Pick<NftHolding, 'chainId' | 'tokenId'>): string {
  return `${h.chainId}:${h.tokenId}`
}

export const useAccountNFTs = () => {
  const { selectedNetwork } = useSharedData()

  const clearState = () => {
    loading.value = false
    error.value = null
    nfts.value = []
    metadataByKey.value = {}
    metadataErrors.value = {}
    currentCacheKey.value = null
    queueStartedForKey = null
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const fetchAccountNFTs = async ({
    networkId,
    accountName,
  }: {
    networkId: string
    accountName: string
  }) => {
    if (!networkId || !accountName) return

    const cacheKey = `${networkId}:${accountName}`
    currentCacheKey.value = cacheKey

    // Serve from cache if available
    const cached = cache.get(cacheKey)
    if (cached) {
      nfts.value = cached.nfts
      metadataByKey.value = { ...cached.metadataByKey }
      loading.value = false
      error.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: { accountName },
          networkId,
        },
      })
      console.log('response', response)

      const list = response?.data?.nonFungibleAccount?.nonFungibleTokenBalances
      const arr: NftHolding[] = Array.isArray(list) ? list : []
      nfts.value = arr

      // Initialize empty metadata entries to allow reactive updates
      const dict: MetadataRecord = {}
      for (const h of arr) {
        dict[keyFor(h)] = metadataByKey.value[keyFor(h)] || null
      }
      metadataByKey.value = dict
      metadataErrors.value = {}

      // Prime cache now (metadata may fill in later)
      cache.set(cacheKey, { nfts: arr, metadataByKey: { ...dict } })
    } catch (e: any) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  const startMetadataQueue = async (accountName: string) => {
    const networkId = selectedNetwork.value?.id
    const cacheKey = networkId && accountName ? `${networkId}:${accountName}` : null
    if (!cacheKey) return

    // Prevent re-running for the same key
    if (queueStartedForKey === cacheKey) return
    queueStartedForKey = cacheKey

    if (abortController) abortController.abort()
    abortController = new AbortController()

    const signal = abortController.signal

    // Sequentially fetch each metadata URI
    for (const item of nfts.value) {
      if (signal.aborted) break
      const uri = item?.info?.uri
      if (!uri) continue
      const k = keyFor(item)
      if (metadataByKey.value[k]) continue // already fetched

      const url = ipfsToHttp(uri)
      try {
        const res = await fetch(url, { signal })
        if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`)
        const json = await res.json().catch(() => ({}))
        metadataByKey.value = { ...metadataByKey.value, [k]: json }
        metadataErrors.value = { ...metadataErrors.value, [k]: null }

        // Keep cache updated
        const existing = cache.get(currentCacheKey.value || '')
        if (existing) {
          existing.metadataByKey[k] = json
        }
      } catch (_e: any) {
        // Ignore individual failures and continue; record error info
        metadataByKey.value = { ...metadataByKey.value, [k]: null }
        metadataErrors.value = { ...metadataErrors.value, [k]: { url, reason: 'blocked-or-unreachable' } }
      }
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    nfts: readonly(nfts),
    metadataByKey: readonly(metadataByKey),
    metadataErrors: readonly(metadataErrors),
    fetchAccountNFTs,
    startMetadataQueue,
    clearState,
  }
}


