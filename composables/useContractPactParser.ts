import type { Ref } from 'vue'
import { computed } from 'vue'
import { unescapeCodeString } from '~/composables/useString'

export type PactFunction = {
  name: string
  params: { name: string; type?: string }[]
  doc?: string
}

// Roughly extract defun blocks and their signatures
export function useContractPactParser(code: Ref<string | undefined>) {
  const normalizedCode = computed(() => unescapeCodeString(code.value || ''))

  const functions = computed<PactFunction[]>(() => {
    const src = normalizedCode.value
    if (!src) return []

    const results: PactFunction[] = []

    // Regex to match: (defun name[:type]? ( params ) ... ) capturing name and param list
    const defunRegex = /\(defun\s+([a-zA-Z0-9_\-]+)(?::[a-zA-Z0-9_\-]+)?\s*\(\s*([^)]*)\)\s*/g
    // Optional docstrings are often right below defun as @doc "..."; we'll try a lightweight sniff
    // We'll post-process each match for params

    let match: RegExpExecArray | null
    while ((match = defunRegex.exec(src)) !== null) {
      const fnName = match[1]
      const rawParams = (match[2] || '').trim()
      const params: { name: string; type?: string }[] = []
      if (rawParams.length) {
        // Params look like: name:type, name:string, guard:guard, amount:decimal
        // also can include destructuring but we ignore those for first version
        rawParams.split(/\s+/).forEach((p) => {
          const m = /([^:]+):?(.+)?/.exec(p)
          if (m) {
            const name = (m[1] || '').trim()
            const type = (m[2] || '').trim() || undefined
            if (name) params.push({ name, type })
          }
        })
      }

      // Try to find a near @doc "..." after the defun match position (small window)
      let doc: string | undefined
      const after = src.slice(defunRegex.lastIndex, defunRegex.lastIndex + 300)
      const docMatch = /@doc\s+\"([^\"]*)\"/.exec(after)
      if (docMatch && docMatch[1]) doc = docMatch[1]

      results.push({ name: fnName, params, doc })
    }

    return results
  })

  return {
    normalizedCode,
    functions,
  }
}



