import { defineEventHandler, getQuery, createError } from 'h3'

function isHttpUrl(u: string): boolean {
  try {
    const url = new URL(u)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower.endsWith('.localhost') ||
    lower === '0.0.0.0'
  ) return true
  // Block common private networks by prefix match (best-effort; real SSRF protection requires DNS/IP resolution)
  if (/^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|169\.254\.)/.test(lower)) return true
  return false
}

function ipfsToGateway(input: string): string {
  if (!input) return input
  if (input.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${input.replace('ipfs://', '')}`
  }
  return input
}

// Single-attempt policy: no gateway fallbacks

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const rawUrl = (q.url as string) || ''
  const urlStr = ipfsToGateway(rawUrl.trim())

  if (!isHttpUrl(urlStr)) {
    throw createError({ statusCode: 400, statusMessage: 'Only http/https URLs are allowed' })
  }

  const { hostname } = new URL(urlStr)
  if (isBlockedHost(hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Blocked host' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
        'Accept': 'application/json,text/plain;q=0.9,*/*;q=0.8',
        'Referer': 'https://kadscan.io/',
      },
    })
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10)

    // Treat as JSON only if the header indicates JSON-ish content
    const headerSaysJson = (
      contentType.includes('application/json') ||
      contentType.includes('application/ld+json') ||
      contentType.includes('+json') ||
      contentType.includes('text/plain')
    )

    // If not JSON by header, do not download/parse body; consider it non-JSON
    if (!headerSaysJson) {
      return { ok: false, reason: 'non-json', finalUrl: res.url || urlStr, contentType }
    }

    // Enforce limits only for JSON-like responses
    if (contentLength && contentLength > 1_800_000) {
      throw createError({ statusCode: 413, statusMessage: 'JSON too large' })
    }

    const text = await res.text()
    if (text.length > 2_000_000) {
      throw createError({ statusCode: 413, statusMessage: 'JSON too large' })
    }

    try {
      const data = JSON.parse(text)
      return { ok: true, data, finalUrl: res.url || urlStr, contentType }
    } catch {
      return { ok: false, reason: 'invalid-json', finalUrl: res.url || urlStr, contentType }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Upstream fetch failed. IPFS link might not exist.' })
  } finally {
    clearTimeout(timeout)
  }
})


