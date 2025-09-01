export default defineNuxtRouteMiddleware((to) => {
  const raw = to.query.chain
  if (raw === undefined) return

  // Only accept a single string value. Remove otherwise.
  if (Array.isArray(raw)) {
    const query = { ...to.query }
    delete (query as any).chain
    return navigateTo({ path: to.path, query }, { replace: true })
  }

  if (typeof raw !== 'string') {
    const query = { ...to.query }
    delete (query as any).chain
    return navigateTo({ path: to.path, query }, { replace: true })
  }

  const n = parseInt(raw, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19

  if (!isValid) {
    const query = { ...to.query }
    delete (query as any).chain
    return navigateTo({ path: to.path, query }, { replace: true })
  }
})


