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

function findUrlNearImageKey(text: string): string | null {
  if (!text) return null
  const keys = ['image', 'image_url', 'imageUri', 'imageURI', 'imageUrl', 'thumbnail']
  for (const key of keys) {
    const re = new RegExp(`"${key}"\\s*:\\s*(?:\"|)(ipfs:\\/\\/[^\\s\"'<>()]+|https?:\\/\\/[^\\s\"'<>()]+)`, 'i')
    const m = text.match(re)
    if (m && m[1]) return m[1]
  }
  return null
}

function collectAllHttpUrls(text: string): string[] {
  const urls: string[] = []
  if (!text) return urls
  const re = /https?:\/\/[^\s"'<>()]+/ig
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    urls.push(m[0])
  }
  // de-duplicate
  return Array.from(new Set(urls))
}

function scoreHttpUrl(text: string, url: string): number {
  let score = 0
  const lower = url.toLowerCase()
  // Prefer image-like extensions
  if (/(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.svg)(\?|#|$)/i.test(lower)) score += 8
  // Prefer common image path hints
  if (/(\/uploads\/|\/images\/|\/img\/|\/media\/|\/content\/|\/assets\/)/i.test(lower)) score += 4
  // Prefer https
  if (lower.startsWith('https://')) score += 2
  // Penalize if near external_url key in the surrounding context
  const idx = text.indexOf(url)
  if (idx >= 0) {
    const start = Math.max(0, idx - 80)
    const context = text.slice(start, idx + url.length + 10).toLowerCase()
    if (context.includes('external_url')) score -= 7
    if (context.includes('thumbnail')) score += 2
    if (context.includes('image')) score += 3
  }
  // Length as weak tie-breaker
  score += Math.min(5, Math.floor(url.length / 50))
  return score
}

function pickBestHttpUrl(text: string): string | null {
  const urls = collectAllHttpUrls(text)
  if (!urls.length) return null
  let best: { url: string; score: number } | null = null
  for (const u of urls) {
    const s = scoreHttpUrl(text, u)
    if (!best || s > best.score || (s === best.score && u.length > best.url.length)) {
      best = { url: u, score: s }
    }
  }
  return best ? best.url : null
}

function recoverResourceUrlFromText(text: string): string | null {
  if (!text) return null
  // 1) Prefer value next to image-like keys
  const fromImageKey = findUrlNearImageKey(text)
  if (fromImageKey) return fromImageKey
  // 2) Prefer explicit ipfs:// URIs anywhere
  const ipfsMatch = text.match(/ipfs:\/\/[^\s"'<>()]+/i)
  if (ipfsMatch) return ipfsMatch[0]
  // 3) Then bare CIDs
  const cidMatch = text.match(CID_REGEX)
  if (cidMatch) return `https://ipfs.io/ipfs/${cidMatch[1]}`
  // 4) Finally, pick the best http(s) candidate by heuristic
  const bestHttp = pickBestHttpUrl(text)
  if (bestHttp) return bestHttp
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


