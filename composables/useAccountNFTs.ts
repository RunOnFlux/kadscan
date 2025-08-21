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
  guard?: {
    keys?: string[]
    predicate?: string
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
        guard {
          ... on KeysetGuard {
            keys
            predicate
          }
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
    let path = uri.replace('ipfs://', '')
    // Trim whitespace and strip leading separators or commas that sometimes appear malformed
    path = path.trim().replace(/^[/,]+/, '')
    return `https://ipfs.io/ipfs/${path}`
  }
  return uri
}

// CIDv0 and CIDv1 matcher
const CID_REGEX = /(Qm[1-9A-HJ-NP-Za-km-z]{44}|[abcdefghijklmnopqrstuvwxyz234567]{20,})/i

function extractHttpUrl(input: string): string | null {
  if (!input) return null
  const m = input.match(/https?:\/\/[^\s,]+/i)
  return m ? m[0] : null
}

function normalizeResourceUri(raw: string): string | null {
  if (!raw) return null
  // Direct http(s) inside the string takes precedence
  const httpFound = extractHttpUrl(raw)
  if (httpFound) return httpFound
  // ipfs:// scheme
  if (raw.includes('ipfs://')) return ipfsToHttp(raw.slice(raw.indexOf('ipfs://')))
  // data:ipfs://,CID or data:ipfs,CID
  const cidMatch = raw.match(CID_REGEX)
  if (cidMatch) {
    return `https://ipfs.io/ipfs/${cidMatch[1]}`
  }
  return null
}

function proxyUrl(url: string | null): string | null {
  if (!url) return null
  return `/api/proxy?url=${encodeURIComponent(url)}`
}

// Removed proxy-based image checks; upstream non-JSON implies image path

function safeString(val: any): string | null {
  return typeof val === 'string' && val ? val : null
}

// Walk object and collect first URL or CID-like string
function findImageLikeInObject(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null
  const preferKeys = ['image', 'image_url', 'imageUri', 'thumbnail', 'asset', 'uri']
  for (const key of preferKeys) {
    const v = (obj as any)[key]
    if (typeof v === 'string') {
      const norm = normalizeResourceUri(v) || ipfsToHttp(v)
      if (norm) return norm
    } else if (v && typeof v === 'object') {
      // Handle { uri: { data: 'ipfs://...', scheme: 'ipfs' } }
      const maybeData = safeString((v as any).data)
      if (maybeData) {
        const norm = normalizeResourceUri(maybeData) || ipfsToHttp(maybeData)
        if (norm) return norm
      }
    }
  }
  // Fallback: scan all string values
  const stack = [obj]
  while (stack.length) {
    const cur = stack.pop() as any
    for (const k of Object.keys(cur)) {
      const v = cur[k]
      if (typeof v === 'string') {
        const norm = normalizeResourceUri(v) || ipfsToHttp(v)
        if (norm) return norm
      } else if (v && typeof v === 'object') {
        stack.push(v)
      }
    }
  }
  return null
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

  const startMetadataQueue = async (accountName: string, opts?: { batchSize?: number }) => {
    const networkId = selectedNetwork.value?.id
    const cacheKey = networkId && accountName ? `${networkId}:${accountName}` : null
    if (!cacheKey) return

    // Prevent re-running for the same key
    if (queueStartedForKey === cacheKey) return
    queueStartedForKey = cacheKey

    if (abortController) abortController.abort()
    abortController = new AbortController()

    const signal = abortController.signal

    const batchSize = Math.max(1, Math.min(50, opts?.batchSize ?? 10))

    const items = nfts.value.slice()

    const worker = async (item: NftHolding) => {
      if (signal.aborted) return
      const uri = item?.info?.uri
      if (!uri) return
      const k = keyFor(item)
      if (metadataByKey.value[k]) return // already fetched

      const initial = normalizeResourceUri(uri) || ipfsToHttp(uri)
      if (!initial) {
        metadataByKey.value = { ...metadataByKey.value, [k]: null }
        metadataErrors.value = { ...metadataErrors.value, [k]: { url: String(uri), reason: 'unrecognized-uri' } }
        return
      }
      try {
        const jsonRes: any = await $fetch('/api/fetch-json', { method: 'GET', params: { url: initial } })
        if (jsonRes?.ok && jsonRes?.data && typeof jsonRes.data === 'object') {
          const imgCandidate = findImageLikeInObject(jsonRes.data)
          const merged = { ...jsonRes.data, image: imgCandidate ? proxyUrl(imgCandidate) : null }
          metadataByKey.value = { ...metadataByKey.value, [k]: merged }
          metadataErrors.value = { ...metadataErrors.value, [k]: null }
        } else {
          // Non-JSON response; treat initial as image
          const minimal = { image: proxyUrl(initial) }
          metadataByKey.value = { ...metadataByKey.value, [k]: minimal }
          metadataErrors.value = { ...metadataErrors.value, [k]: null }
        }

        const existing = cache.get(currentCacheKey.value || '')
        if (existing) {
          existing.metadataByKey[k] = metadataByKey.value[k]
        }
      } catch (_e: any) {
        metadataByKey.value = { ...metadataByKey.value, [k]: null }
        metadataErrors.value = { ...metadataErrors.value, [k]: { url: initial, reason: 'blocked-or-unreachable' } }
      }
    }

    for (let i = 0; i < items.length; i += batchSize) {
      if (signal.aborted) break
      const slice = items.slice(i, i + batchSize)
      await Promise.all(slice.map(worker))
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


