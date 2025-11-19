export default defineNuxtPlugin((nuxtApp) => {
  const app = nuxtApp.vueApp

  const previousWarnHandler = app.config.warnHandler
  const previousErrorHandler = app.config.errorHandler
  const originalConsoleError = console.error

  // Buffer recent hydration-related warnings to print if the runtime emits
  // the aggregated "Hydration completed but contains mismatches." error.
  const hydrationHints: Array<Record<string, any>> = []
  const pushHint = (hint: Record<string, any>) => {
    hydrationHints.push(hint)
    if (hydrationHints.length > 20) hydrationHints.shift()
  }

  app.config.warnHandler = (msg, instance, trace) => {
    try {
      const text = String(msg || '')
      const isHydration = /hydration|mismatch|vnode type mismatch/i.test(text)
      if (isHydration) {
        const route = (nuxtApp.$router as any)?.currentRoute?.value
        const name = (instance as any)?.type?.name || (instance as any)?.type?.__name
        const file = (instance as any)?.type?.__file
        // Bubble up some parent component names to help pinpoint
        const parent = (instance as any)?.parent
        const parentName = parent?.type?.name || parent?.type?.__name
        const grandParent = parent?.parent
        const grandParentName = grandParent?.type?.name || grandParent?.type?.__name

        const payload = {
          message: text,
          component: name,
          file,
          parent: parentName,
          grandParent: grandParentName,
          route: route ? { path: route.path, name: route.name, params: route.params, query: route.query } : null,
          trace
        }
        pushHint(payload)
        // eslint-disable-next-line no-console
        console.warn('[HYDRATION WARNING]', payload)
      }
    } catch {}

    if (previousWarnHandler) {
      try { previousWarnHandler(msg as any, instance as any, trace as any) } catch {}
    }
  }

  app.config.errorHandler = (err, instance, info) => {
    try {
      const text = `${(err as any)?.message || err}`
      const isHydration = /hydration|mismatch|vnode type mismatch/i.test(text) || /hydration/i.test(String(info || ''))
      if (isHydration) {
        const route = (nuxtApp.$router as any)?.currentRoute?.value
        const name = (instance as any)?.type?.name || (instance as any)?.type?.__name
        const file = (instance as any)?.type?.__file
        const payload = { message: text, info, component: name, file, route: route ? { path: route.path, name: route.name } : null }
        pushHint(payload)
        // eslint-disable-next-line no-console
        console.warn('[HYDRATION ERROR]', payload)
      }
    } catch {}

    if (previousErrorHandler) {
      try { previousErrorHandler(err as any, instance as any, info as any) } catch {}
    } else {
      throw err
    }
  }

  // Intercept the aggregated runtime-core error and flush buffered hints.
  console.error = (...args: any[]) => {
    try {
      const text = args?.[0] ? String(args[0]) : ''
      if (/Hydration completed but contains mismatches\./i.test(text)) {
        // eslint-disable-next-line no-console
        console.groupCollapsed('[HYDRATION SUMMARY] Flushing recent hints')
        hydrationHints.forEach((hint, i) => {
          // eslint-disable-next-line no-console
          console.log(`#${i + 1}`, hint)
        })
        // eslint-disable-next-line no-console
        console.groupEnd()
      }
    } catch {}
    return originalConsoleError.apply(console, args as any)
  }
})


