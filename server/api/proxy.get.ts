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
  const checkOnly = String(q.check || '').toLowerCase() === '1' || String(q.check || '').toLowerCase() === 'true'

  if (!isHttpUrl(urlStr)) {
    throw createError({ statusCode: 400, statusMessage: 'Only http/https URLs are allowed' })
  }
  const { hostname } = new URL(urlStr)
  if (isBlockedHost(hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Blocked host' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
        'Referer': 'https://kadscan.io/',
      },
    })
    if (!res.ok) {
      throw createError({ statusCode: res.status, statusMessage: `Upstream responded ${res.status}` })
    }
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10)
    const isImage = /^image\//i.test(contentType) || contentType.toLowerCase().includes('svg')

    if (checkOnly) {
      if (!isImage) {
        throw createError({ statusCode: 415, statusMessage: 'Not an image' })
      }
      return { ok: true, contentType, contentLength, finalUrl: res.url }
    }

    if (contentLength && contentLength > 20_000_000) {
      throw createError({ statusCode: 413, statusMessage: 'File too large' })
    }
    const arrayBuffer = await res.arrayBuffer()
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return send(event, Buffer.from(arrayBuffer))
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Upstream fetch failed' })
  } finally {
    clearTimeout(timeout)
  }
})


