import type { Ref } from 'vue'
import { ref } from 'vue'
import { useSharedData } from '~/composables/useSharedData'

const GQL_QUERY = `
  query PactContract($pactQuery: [PactQuery!]!) {
    pactQuery(pactQuery: $pactQuery) { result }
  }
`

export function useContractPactRead() {
  const { selectedNetwork } = useSharedData()
  const loading = ref(false)
  const error = ref<any>(null)
  const result = ref<any>(null)

  const call = async (
    moduleName: Ref<string | undefined>,
    fn: string,
    args: any[],
    chainId?: string | number
  ) => {
    const mod = (moduleName.value || '').trim()
    if (!mod || !fn) return null

    loading.value = true
    error.value = null
    result.value = null
    try {
      // Build Pact expression: (mod.fn arg1 arg2 ...)
      const parts: string[] = []
      for (const arg of args) {
        if (typeof arg === 'string') {
          const trimmed = arg.trim()
          if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed.startsWith('(')) {
            parts.push(trimmed)
          } else if (trimmed === 'true' || trimmed === 'false' || /^-?\d+(\.\d+)?$/.test(trimmed)) {
            parts.push(trimmed)
          } else {
            parts.push(`\"${trimmed}\"`)
          }
        } else if (typeof arg === 'number' || typeof arg === 'boolean') {
          parts.push(String(arg))
        } else if (arg === null || arg === undefined) {
          parts.push('null')
        } else {
          parts.push(JSON.stringify(arg))
        }
      }

      const expression = `(${mod}.${fn} ${parts.join(' ')})`

      const body: any = {
        query: GQL_QUERY,
        variables: {
          pactQuery: [
            {
              code: expression,
              ...(chainId !== undefined && chainId !== null && chainId !== '' ? { chainId: String(chainId) } : {}),
            },
          ],
        },
        networkId: selectedNetwork.value?.id,
      }

      const response: any = await $fetch('/api/graphql', { method: 'POST', body })
      result.value = response?.data?.pactQuery?.[0]?.result ?? null
      return result.value
    } catch (e) {
      error.value = new Error('Unable to read from contract. Please try again.')
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, result, call }
}



