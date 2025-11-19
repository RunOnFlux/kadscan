import { defineEventHandler, getQuery, createError, setHeader, send } from 'h3'

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
  if (/^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|169\.254\.)/.test(lower)) return true
  return false
}

function buildIpfsCandidates(input: string): string[] {
  if (!input) return []
  const gateways = [
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://dweb.link',
    'https://nftstorage.link',
  ]
  if (input.startsWith('ipfs://')) {
    const path = input.replace('ipfs://', '').replace(/^[/,]+/, '')
    return gateways.map(g => `${g}/ipfs/${path}`)
  }
  try {
    const u = new URL(input)
    const m = u.pathname.match(/^\/(ipfs|ipns)\/(.+)$/)
    if (m) {
      const path = `${m[1]}/${m[2]}`
      return gateways.map(g => `${g}/${path}`)
    }
  } catch {}
  return [input]
}

// Single-attempt policy: no gateway fallbacks

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const rawUrl = (q.url as string) || ''
  const urlStr = rawUrl.trim()
  const checkOnly = String(q.check || '').toLowerCase() === '1' || String(q.check || '').toLowerCase() === 'true'

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
          'Accept': 'image/*',
        },
      })
      if (!res.ok) {
        continue
      }
      const contentType = res.headers.get('content-type') || 'application/octet-stream'
      const contentLength = parseInt(res.headers.get('content-length') || '0', 10)
      const isImage = /^image\//i.test(contentType) || contentType.toLowerCase().includes('svg')

      if (checkOnly) {
        if (!isImage) {
          continue
        }
        return { ok: true, contentType, contentLength, finalUrl: res.url || candidate }
      }

      if (!isImage) {
        continue
      }

      if (contentLength && contentLength > 20_000_000) {
        throw createError({ statusCode: 413, statusMessage: 'File too large' })
      }
      const arrayBuffer = await res.arrayBuffer()
      setHeader(event, 'Content-Type', contentType)
      setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
      return send(event, Buffer.from(arrayBuffer))
    } catch (err: any) {
      if (err?.statusCode && err.statusCode !== 408 && err.statusCode !== 502) {
        throw err
      }
      // otherwise try next candidate
    } finally {
      clearTimeout(timeout)
    }
  }

  throw createError({ statusCode: 502, statusMessage: 'Upstream fetch failed' })
})


