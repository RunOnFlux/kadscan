import type { Ref } from 'vue'
import { ref, watch, computed } from 'vue'
import { parseJsonSafely, unescapeCodeString } from '~/composables/string'
import { useSharedData } from '~/composables/useSharedData'

type PactQueryItem = {
  code: string
  chainId?: string
}

export type PactModuleInfo = {
  name: string
  hash?: string
  interfaces?: string[]
  code: string
}

const GQL_QUERY = `
  query PactContract($pactQuery: [PactQuery!]!) {
    pactQuery(pactQuery: $pactQuery) { result }
  }
`

export function useContractPact(
  moduleName: Ref<string | undefined>,
  chainId?: Ref<string | number | undefined>
) {
  const { selectedNetwork } = useSharedData()

  const loading = ref<boolean>(false)
  const error = ref<any>(null)
  const moduleInfo = ref<PactModuleInfo | null>(null)
  const moduleByChain = ref<Record<string, PactModuleInfo>>({})
  const availableChains = ref<string[]>([])
  const allChainsLoaded = ref<boolean>(false)
  const fetchingAll = ref<boolean>(false)
  const lastFetchedKey = ref<string>('')

  const normalizedModule = computed(() => (moduleName.value || '').trim())
  const normalizedChainId = computed(() => {
    const c = chainId?.value
    if (c === undefined || c === null || c === '') return undefined
    const asNum = typeof c === 'string' ? parseInt(c, 10) : Number(c)
    if (Number.isNaN(asNum) || asNum < 0 || asNum > 19) return undefined
    return String(asNum)
  })

  const setActiveModuleFromCache = () => {
    const activeChain = normalizedChainId.value || availableChains.value[0]
    if (activeChain && moduleByChain.value[activeChain]) {
      moduleInfo.value = moduleByChain.value[activeChain]
    } else {
      moduleInfo.value = null
    }
  }

  const fetchAllChains = async () => {
    const name = normalizedModule.value
    if (!name) return
    const key = `${selectedNetwork.value?.id || 'mainnet01'}::${name}`
    if (allChainsLoaded.value && lastFetchedKey.value === key) {
      setActiveModuleFromCache()
      return
    }
    if (fetchingAll.value) return
    fetchingAll.value = true
    loading.value = true
    error.value = null
    allChainsLoaded.value = false
    moduleByChain.value = {}
    availableChains.value = []
    lastFetchedKey.value = key
    try {
      const pactQuery: PactQueryItem[] = []
      for (let i = 0; i <= 19; i++) {
        pactQuery.push({ code: `(describe-module \"${name}\")`, chainId: String(i) })
      }

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: { pactQuery },
          networkId: selectedNetwork.value?.id,
        },
      })

      const results: any[] = response?.data?.pactQuery || []
      const byChain: Record<string, PactModuleInfo> = {}
      const chains: string[] = []
      results.forEach((entry: any, idx: number) => {
        const rawResult = entry?.result
        const parsed = parseJsonSafely(rawResult) || {}
        const codeStr: string = typeof parsed.code === 'string' ? unescapeCodeString(parsed.code) : ''
        if (codeStr && codeStr.trim().length > 0) {
          const chainKey = String(idx)
          byChain[chainKey] = {
            name: parsed.name || name,
            hash: parsed.hash,
            interfaces: parsed.interfaces || [],
            code: codeStr,
          }
          chains.push(chainKey)
        }
      })

      // Sort numerically just in case
      chains.sort((a, b) => Number(a) - Number(b))
      moduleByChain.value = byChain
      availableChains.value = chains
      allChainsLoaded.value = true
      setActiveModuleFromCache()
    } catch (e) {
      console.error('[useContractPact] fetchAllChains error', e)
      error.value = e
      moduleInfo.value = null
    } finally {
      fetchingAll.value = false
      loading.value = false
    }
  }

  const fetchModule = async () => {
    const name = normalizedModule.value
    if (!name) return
    loading.value = moduleInfo.value === null
    error.value = null
    try {
      const pactQuery: PactQueryItem[] = [
        {
          code: `(describe-module \"${name}\")`,
          ...(normalizedChainId.value ? { chainId: normalizedChainId.value } : {}),
        },
      ]

      const response: any = await $fetch('/api/graphql', {
        method: 'POST',
        body: {
          query: GQL_QUERY,
          variables: { pactQuery },
          networkId: selectedNetwork.value?.id,
        },
      })

      let rawResult = response?.data?.pactQuery?.[0]?.result

      // Fallback: Some endpoints require an explicit chainId. If not provided and
      // no result was returned, retry with chainId "0".
      if ((rawResult === undefined || rawResult === null) && !normalizedChainId.value) {
        const pactQueryFallback: PactQueryItem[] = [
          { code: `(describe-module \"${name}\")`, chainId: '0' },
        ]
        const resp2: any = await $fetch('/api/graphql', {
          method: 'POST',
          body: {
            query: GQL_QUERY,
            variables: { pactQuery: pactQueryFallback },
            networkId: selectedNetwork.value?.id,
          },
        })
        rawResult = resp2?.data?.pactQuery?.[0]?.result
      }
      const parsed = parseJsonSafely(rawResult) || {}
      const codeStr: string = typeof parsed.code === 'string' ? unescapeCodeString(parsed.code) : ''
      moduleInfo.value = {
        name: parsed.name || name,
        hash: parsed.hash,
        interfaces: parsed.interfaces || [],
        code: codeStr,
      }
    } catch (e) {
      console.error('[useContractPact] fetchModule error', e)
      error.value = e
      moduleInfo.value = null
    } finally {
      loading.value = false
    }
  }

  // Fetch all chains whenever module or network changes
  watch([normalizedModule, selectedNetwork], () => {
    fetchAllChains()
  }, { immediate: true })

  // Update active module when chain selection or cache changes
  watch([normalizedChainId, availableChains, moduleByChain], () => {
    setActiveModuleFromCache()
  })

  return {
    loading,
    error,
    moduleInfo,
    moduleByChain,
    availableChains,
    allChainsLoaded,
    fetchModule,
    fetchAllChains,
  }
}


