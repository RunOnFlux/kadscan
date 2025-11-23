import { ref, readonly, watch } from 'vue'
import { useSharedData } from '~/composables/useSharedData'
import { useBinance } from '~/composables/useBinance'

type PriceCacheEntry = { price: number; ts: number }

const MODULE_PRICE_TTL_MS = 1000 * 60 * 60 * 2 // 2 hours
const KDA_PRICE_TTL_MS = 1000 * 60 * 15 // 15 minutes

const kdaUsdPrice = ref<number>(0)
const moduleUsdPrice: { value: Record<string, number> } = ref({}) as any

// In-flight promises to dedupe concurrent requests per key
const inflightModule: Map<string, Promise<number>> = new Map()
let inflightKda: Promise<number> | null = null

function storageGet(key: string): PriceCacheEntry | null {
  if (!process.client) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.price !== 'number' || typeof parsed?.ts !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function storageSet(key: string, entry: PriceCacheEntry) {
  if (!process.client) return
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {}
}

function now(): number { return Date.now() }

export const useAssetUsdPrices = () => {
  const { selectedNetwork } = useSharedData()
  const { $coingecko } = useNuxtApp()

  const networkId = () => selectedNetwork.value?.id || 'mainnet01'

  const kdaStorageKey = () => `usd:kda:${networkId()}`
  const moduleStorageKey = (module: string) => `usd:module:${networkId()}:${module}`

  const reset = () => {
    kdaUsdPrice.value = 0
    moduleUsdPrice.value = {}
    inflightModule.clear()
    inflightKda = null
  }

  async function getKdaUsd(): Promise<number> {
    if (kdaUsdPrice.value > 0) return kdaUsdPrice.value

    const cached = storageGet(kdaStorageKey())
    if (cached && now() - cached.ts < KDA_PRICE_TTL_MS && cached.price > 0) {
      kdaUsdPrice.value = cached.price
      return cached.price
    }

    if (!inflightKda) {
      inflightKda = (async () => {
        try {
          // Try CoinGecko first (primary source)
          const data: any = await $coingecko.request('coins/kadena')
          const price = Number(data?.market_data?.current_price?.usd || 0)
          if (!Number.isFinite(price) || price <= 0) throw new Error('Bad KDA price from CoinGecko')
          kdaUsdPrice.value = price
          storageSet(kdaStorageKey(), { price, ts: now() })
          return price
        } catch (error) {
          // Fallback to Binance
          try {
            const { fetchKadenaPrice } = useBinance()
            const res: any = await fetchKadenaPrice()
            const price = Number(res?.data?.price || 0)
            if (!Number.isFinite(price) || price <= 0) throw new Error('Bad KDA price from Binance')
            kdaUsdPrice.value = price
            storageSet(kdaStorageKey(), { price, ts: now() })
            return price
          } catch {
            // Keep existing value or 0
            return kdaUsdPrice.value || 0
          }
        } finally {
          inflightKda = null
        }
      })()
    }
    return inflightKda
  }

  async function fetchModuleUsd(module: string): Promise<number> {
    if (!module || moduleUsdPrice.value[module] !== undefined) return moduleUsdPrice.value[module] || 0

    // coin module equals KDA
    if (module === 'coin') {
      const kda = await getKdaUsd()
      moduleUsdPrice.value = { ...moduleUsdPrice.value, [module]: kda }
      return kda
    }

    const key = moduleStorageKey(module)
    const cached = storageGet(key)
    if (cached && now() - cached.ts < MODULE_PRICE_TTL_MS && cached.price > 0) {
      moduleUsdPrice.value = { ...moduleUsdPrice.value, [module]: cached.price }
      return cached.price
    }

    if (!inflightModule.has(module)) {
      inflightModule.set(module, (async () => {
        try {
          const kda = await getKdaUsd()
          if (kda <= 0) return 0
          const response: any = await $fetch('/api/graphql', {
            method: 'POST',
            body: {
              query: `query Query($moduleName: String!) {\n  lastTokenPriceInKda(moduleName: $moduleName)\n}`,
              variables: { moduleName: module },
              networkId: networkId(),
            },
          })
          const raw = response?.data?.lastTokenPriceInKda
          const kdaQuoted = typeof raw === 'string' ? parseFloat(raw) : Number(raw || 0)
          const usd = Number.isFinite(kdaQuoted) && kdaQuoted > 0 ? kdaQuoted * kda : 0
          moduleUsdPrice.value = { ...moduleUsdPrice.value, [module]: usd }
          storageSet(key, { price: usd, ts: now() })
          return usd
        } catch {
          if (process.client) {
            console.warn('[prices] failed to fetch price for', module)
          }
          moduleUsdPrice.value = { ...moduleUsdPrice.value, [module]: 0 }
          return 0
        } finally {
          inflightModule.delete(module)
        }
      })())
    }
    return inflightModule.get(module) as Promise<number>
  }

  async function primeModules(modules: string[]) {
    if (!Array.isArray(modules) || modules.length === 0) return
    // Ensure we have KDA first (may parallelize too)
    await getKdaUsd()
    const set = new Set<string>(modules.filter(Boolean))
    const promises: Promise<any>[] = []
    for (const m of set) {
      if (moduleUsdPrice.value[m] === undefined) {
        promises.push(fetchModuleUsd(m))
      }
    }
    // Fire in background; do not await all necessarily, but return promise for callers if they want
    await Promise.allSettled(promises)
  }

  function getUsdPerUnit(module: string): number {
    return moduleUsdPrice.value[module] || 0
  }

  return {
    kdaUsdPrice: readonly(kdaUsdPrice),
    moduleUsdPrice: readonly(moduleUsdPrice),
    getUsdPerUnit,
    getKdaUsd,
    fetchModuleUsd,
    primeModules,
    reset,
  }
}


