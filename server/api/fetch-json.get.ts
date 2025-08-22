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

// Build a list of candidate URLs to try when the source is an IPFS URL
function buildIpfsCandidates(input: string): string[] {
  if (!input) return []
  const gateways = [
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://dweb.link',
    'https://nftstorage.link',
  ]

  // ipfs://CID[/path]
  if (input.startsWith('ipfs://')) {
    const path = input.replace('ipfs://', '').replace(/^[/,]+/, '')
    return gateways.map(g => `${g}/ipfs/${path}`)
  }

  // https?://host/(ipfs|ipns)/...
  try {
    const u = new URL(input)
    const m = u.pathname.match(/^\/(ipfs|ipns)\/(.+)$/)
    if (m) {
      const path = `${m[1]}/${m[2]}`
      return gateways.map(g => `${g}/${path}`)
    }
  } catch {
    // ignore
  }

  return [input]
}

// Basic CID matcher (CIDv0 and lenient CIDv1 base32)
const CID_REGEX = /(Qm[1-9A-HJ-NP-Za-km-z]{44}|[abcdefghijklmnopqrstuvwxyz234567]{20,})/i

function extractHttpUrl(input: string): string | null {
  if (!input) return null
  const m = input.match(/https?:\/\/[^\s"'<>()]+/i)
  return m ? m[0] : null
}

function recoverResourceUrlFromText(text: string): string | null {
  if (!text) return null
  // Prefer explicit ipfs:// URIs first
  const ipfsMatch = text.match(/ipfs:\/\/[^\s"'<>()]+/i)
  if (ipfsMatch) return ipfsMatch[0]
  // Then bare CIDs
  const cidMatch = text.match(CID_REGEX)
  if (cidMatch) return `https://ipfs.io/ipfs/${cidMatch[1]}`
  // Finally, plain http(s) URLs
  const http = extractHttpUrl(text)
  if (http) return http
  return null
}

// Single-attempt policy: no gateway fallbacks

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const rawUrl = (q.url as string) || ''
  const urlStr = rawUrl.trim()

  if (!isHttpUrl(urlStr)) {
    throw createError({ statusCode: 400, statusMessage: 'Only http/https URLs are allowed' })
  }

  const { hostname } = new URL(urlStr)
  if (isBlockedHost(hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Blocked host' })
  }
  const candidates = buildIpfsCandidates(urlStr)

  for (const candidate of candidates) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1_000)
    try {
      const res = await fetch(candidate, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!res.ok) {
        // Try next gateway on non-OK
        continue
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase()
      const contentLength = parseInt(res.headers.get('content-length') || '0', 10)

      const headerSaysJson = (
        contentType.includes('application/json') ||
        contentType.includes('application/ld+json') ||
        contentType.includes('+json') ||
        contentType.includes('text/plain')
      )

      if (!headerSaysJson) {
        return { ok: false, reason: 'non-json', finalUrl: res.url || candidate, contentType }
      }

      if (contentLength && contentLength > 1_800_000) {
        throw createError({ statusCode: 413, statusMessage: 'JSON too large' })
      }

      const text = await res.text()
      if (text.length > 2_000_000) {
        throw createError({ statusCode: 413, statusMessage: 'JSON too large' })
      }

      try {
        const data = JSON.parse(text)
        return { ok: true, data, finalUrl: res.url || candidate, contentType }
      } catch {
        const recovered = recoverResourceUrlFromText(text)
        console.log('recovered', recovered)
        if (recovered) {
          return { ok: true, data: { image: recovered }, finalUrl: recovered, contentType }
        }
        return { ok: false, reason: 'invalid-json', finalUrl: res.url || candidate, contentType }
      }
    } catch (err: any) {
      // On timeout/network error, try next candidate
      if (err?.statusCode && err.statusCode !== 408 && err.statusCode !== 502) {
        // For non-network errors like 413, bubble up immediately
        throw err
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw createError({ statusCode: 502, statusMessage: 'Upstream fetch failed' })
})


