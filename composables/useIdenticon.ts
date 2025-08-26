// Deterministic identicon generation utilities
// - Purely seed-based (from address string)
// - No randomness at runtime beyond seeded PRNG

export type IdenticonResult = {
  backgroundFrom: string
  backgroundTo: string
  cells: Array<string | null>
}

// Simple cache to avoid recomputation across re-renders
const cache = new Map<string, IdenticonResult>()

// FNV-1a 32-bit hash — fast and adequate for seeding a PRNG
function hashFnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0
  }
  return hash >>> 0
}

// Mulberry32 PRNG — tiny, fast, deterministic
function mulberry32(seed: number) {
  let t = seed >>> 0
  return function next(): number {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function hsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clamp(s, 0, 100)
  const ll = clamp(l, 0, 100)
  return `hsl(${hh}, ${ss}%, ${ll}%)`
}

function pickInRange(prng: () => number, min: number, max: number): number {
  return min + prng() * (max - min)
}

function ensureContrastToBg(colorL: number, bgL: number): number {
  const delta = Math.abs(colorL - bgL)
  if (delta >= 25) return colorL
  // Move away from background lightness to ensure minimum perceived contrast
  if (colorL < bgL) {
    return clamp(colorL - (25 - delta), 0, 100)
  }
  return clamp(colorL + (25 - delta), 0, 100)
}

function generatePalette(prng: () => number) {
  const baseHue = Math.floor(prng() * 360)
  const bgSat = pickInRange(prng, 55, 65)
  const bgL1 = pickInRange(prng, 18, 22)
  const bgL2 = pickInRange(prng, 10, 14)

  const backgroundFrom = hsl(baseHue, bgSat, bgL1)
  const backgroundTo = hsl(baseHue + 10, bgSat, bgL2)

  // Generate 3 accent colors with hue offsets for variety
  const offsets = [
    (prng() < 0.5 ? -1 : 1) * pickInRange(prng, 30, 60),
    (prng() < 0.5 ? -1 : 1) * pickInRange(prng, 15, 45),
    (prng() < 0.5 ? -1 : 1) * pickInRange(prng, 60, 90),
  ]

  const accents: string[] = []
  for (const off of offsets) {
    const sat = pickInRange(prng, 60, 75)
    const rawL = pickInRange(prng, 45, 60)
    const adjL = ensureContrastToBg(rawL, (bgL1 + bgL2) / 2)
    accents.push(hsl(baseHue + off, sat, adjL))
  }

  return { backgroundFrom, backgroundTo, accents }
}

function shuffle<T>(arr: T[], prng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generatePattern(prng: () => number, accents: string[]): Array<string | null> {
  // Decide how many cells to fill: between 3 and 8 inclusive, biasing towards middle
  const fillCount = 3 + Math.floor(prng() * 6) + (prng() < 0.5 ? 1 : 0) // bias ~5-6
  const indices = shuffle(Array.from({ length: 9 }, (_, i) => i), prng)
  const filled = new Set(indices.slice(0, fillCount))
  const cells: Array<string | null> = []
  for (let i = 0; i < 9; i++) {
    if (!filled.has(i)) {
      cells.push(null) // transparent: background shows through
    } else {
      const color = accents[Math.floor(prng() * accents.length)]
      cells.push(color)
    }
  }
  return cells
}

export function getIdenticon(address: string): IdenticonResult {
  const key = address || ''
  const existing = cache.get(key)
  if (existing) return existing

  const seed = hashFnv1a(key)
  const prng = mulberry32(seed)
  const { backgroundFrom, backgroundTo, accents } = generatePalette(prng)
  const cells = generatePattern(prng, accents)

  const result: IdenticonResult = { backgroundFrom, backgroundTo, cells }
  cache.set(key, result)
  return result
}


