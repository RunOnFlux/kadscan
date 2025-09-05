import { defineEventHandler, getRequestURL, readRawBody } from 'h3'

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res

  const runtimeConfig = useRuntimeConfig()
  const host = (runtimeConfig.public?.posthogHost as string) || 'https://us.i.posthog.com'

  const url = getRequestURL(event)
  // Build the upstream URL preserving the rest of the path and query
  const upstream = new URL(url.pathname.replace(/^\/aquaticpanda/, '') + (url.search || ''), host)

  const method = req.method || 'GET'

  const headers = new Headers()
  // Forward headers except host/connection/encoding
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue
    const lower = key.toLowerCase()
    if (['host', 'connection', 'content-length'].includes(lower)) continue
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '))
    } else {
      headers.set(key, value)
    }
  }

  // Preserve client IP for enrichment
  const clientIp =
    (req.headers['x-forwarded-for'] as string) ||
    (event.node.req.socket && (event.node.req.socket as any).remoteAddress) ||
    ''
  if (clientIp) headers.set('X-Forwarded-For', clientIp)

  let body: BodyInit | undefined
  if (!['GET', 'HEAD'].includes(method)) {
    // IMPORTANT: read as raw Buffer to preserve gzip-js payload bytes
    const raw = (await (readRawBody as any)(event, false)) as Buffer | null
    if (raw) body = raw
  }

  const response = await fetch(upstream.toString(), { method, headers, body })

  // Relay status and headers
  res.statusCode = response.status
  let responseBodyBuffer: Buffer | null = null
  response.headers.forEach((v, k) => {
    // Avoid hop-by-hop and content-encoding (body already decompressed by fetch)
    if (!['transfer-encoding', 'connection', 'content-encoding', 'content-length'].includes(k.toLowerCase())) {
      res.setHeader(k, v)
    }
  })

  // Buffer the upstream response exactly as-is to avoid stream lock issues
  if (method === 'HEAD' || response.status === 304) {
    if (response.status >= 400) {
      try {
        console.error('[aquaticpanda] upstream error', {
          method,
          upstream: upstream.toString(),
          status: response.status,
        })
      } catch {}
    }
    return res.end()
  }

  const arrayBuffer = await response.arrayBuffer()
  responseBodyBuffer = Buffer.from(arrayBuffer)
  if (response.status >= 400) {
    try {
      const preview = responseBodyBuffer.toString('utf8').slice(0, 500)
      console.error('[aquaticpanda] upstream error', {
        method,
        upstream: upstream.toString(),
        status: response.status,
        bodyPreview: preview,
      })
    } catch {}
  }
  res.end(responseBodyBuffer)
})


