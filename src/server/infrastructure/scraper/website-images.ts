import * as dns from 'node:dns/promises'
import { Agent } from 'undici'

type CandidatePage = {
  url: string
  linkText: string
  score: number
}

type FetchedPage = {
  url: string
  html: string
  score: number
  isHomepage: boolean
}

type CandidateImage = {
  url: string
  source: ImageSource
  pageScore: number
  pageIndex: number
  width?: number
  height?: number
}

type ImageSource = 'direct-link' | 'img' | 'srcset' | 'lazy' | 'background' | 'social'
type ResolvedAddress = { address: string; family: number }
type FetchOptions = RequestInit & { dispatcher?: Agent }

const USER_AGENT = 'Mozilla/5.0 (compatible; OSWP/1.0)'
const FETCH_TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 5
const MAX_RESULTS = 20
const MAX_SECONDARY_PAGES = 3
const MAX_SITEMAP_BYTES = 500_000
const MAX_SITEMAP_URLS = 200

const MEDIA_TERMS = [
  'gallery',
  'galleries',
  'photos',
  'photo',
  'portfolio',
  'weddings',
  'wedding',
  'events',
  'event',
  'venue',
  'venues',
  'spaces',
  'rooms',
  'galeria',
  'fotos',
  'foto',
  'bodas',
  'boda',
  'eventos',
  'evento',
  'salon',
  'salones',
  'banquetes',
  'habitaciones',
]

const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'pinterest.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'youtube.com',
]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']
const BLOCKED_PAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
  '.ico',
  '.pdf',
  '.mp4',
  '.mov',
  '.avi',
  '.webm',
  '.css',
  '.js',
  '.zip',
]

export async function fetchWebsiteImages(url: string): Promise<string[]> {
  const submittedUrl = toUrl(url)
  if (!submittedUrl || !isSafeFetchUrl(submittedUrl)) return []

  const homepageResponse = await fetchText(submittedUrl.href)
  if (!homepageResponse) return []
  const { finalUrl, text: homepage } = homepageResponse
  const finalSubmittedUrl = new URL(finalUrl)
  if (!homepage) return []

  const candidatePages = await discoverCandidatePages(homepage, finalSubmittedUrl)
  const secondaryPages = await fetchSecondaryPages(candidatePages)
  const pages: FetchedPage[] = [
    { url: finalSubmittedUrl.href, html: homepage, score: 0, isHomepage: true },
    ...secondaryPages,
  ]

  return rankCandidateImages(
    pages.flatMap((page, pageIndex) => extractCandidateImages(page, pageIndex))
  )
}

async function fetchText(url: string): Promise<{ finalUrl: string; text: string } | null> {
  try {
    let currentUrl = toUrl(url)
    if (!currentUrl || !isSafeFetchUrl(currentUrl)) return null

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      const resolvedAddresses = await resolveSafeAddresses(currentUrl)
      if (!resolvedAddresses) return null

      const dispatcher = createSafeDispatcher(resolvedAddresses)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      try {
        const fetchOptions: FetchOptions = {
          headers: { 'User-Agent': USER_AGENT },
          redirect: 'manual',
          signal: controller.signal,
          dispatcher,
        }
        const response = await fetch(currentUrl.href, fetchOptions)

        if (isRedirectResponse(response)) {
          const location = response.headers?.get('location')
          const redirectUrl = resolveUrl(location ?? undefined, currentUrl.href)
          if (!redirectUrl || !isSafeFetchUrl(redirectUrl) || redirectCount === MAX_REDIRECTS) {
            return null
          }
          currentUrl = redirectUrl
          continue
        }

        if (!response.ok) {
          return null
        }

        const contentLength = response.headers?.get('content-length')
        if (contentLength && parseInt(contentLength, 10) > MAX_SITEMAP_BYTES) {
          return null
        }

        const text = await readBoundedResponseText(response)
        return text === null ? null : { finalUrl: currentUrl.href, text }
      } finally {
        clearTimeout(timeoutId)
        await closeDispatcher(dispatcher)
      }
    }

    return null
  } catch {
    return null
  }
}

async function resolveSafeAddresses(url: URL): Promise<ResolvedAddress[] | null> {
  try {
    const results = await dns.lookup(url.hostname, { all: true, verbatim: true })
    const addresses = Array.isArray(results) ? results : [results]
    if (addresses.length === 0) return null
    if (addresses.some((result) => isLocalOrPrivateHostname(result.address))) return null
    return addresses
  } catch {
    return null
  }
}

function createSafeDispatcher(addresses: ResolvedAddress[]): Agent {
  const [firstAddress] = addresses
  if (!firstAddress) throw new Error('No resolved address available')

  return new Agent({
    connect: {
      lookup(_hostname, options, callback) {
        if (options.all) {
          callback(null, addresses)
          return
        }
        callback(null, firstAddress.address, firstAddress.family)
      },
    },
  })
}

async function closeDispatcher(dispatcher: Agent) {
  await dispatcher.close().catch(() => undefined)
}

async function readBoundedResponseText(response: Response): Promise<string | null> {
  if (!response.body) {
    const text = await response.text()
    return text.length > MAX_SITEMAP_BYTES ? null : text
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let bytesRead = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunkBytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
      bytesRead += chunkBytes.byteLength
      if (bytesRead > MAX_SITEMAP_BYTES) {
        await reader.cancel()
        return null
      }

      chunks.push(decoder.decode(chunkBytes, { stream: true }))
    }

    chunks.push(decoder.decode())
    return chunks.join('')
  } finally {
    reader.releaseLock()
  }
}

async function discoverCandidatePages(html: string, submittedUrl: URL): Promise<CandidatePage[]> {
  const pages = new Map<string, CandidatePage>()

  for (const page of extractNavigationPages(html, submittedUrl)) {
    addCandidatePage(pages, page)
  }

  const sitemap = await fetchText(new URL('/sitemap.xml', submittedUrl).href)
  if (sitemap) {
    for (const page of extractSitemapPages(sitemap.text, submittedUrl)) {
      addCandidatePage(pages, page)
    }
  }

  const sortedPages = [...pages.values()]
    .filter((page) => page.url !== submittedUrl.href)
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))

  const likelyMediaPages = sortedPages.filter((page) => page.score >= 10)
  const densityProbePages = sortedPages.filter((page) => page.score < 10)

  return [...likelyMediaPages, ...densityProbePages].slice(0, MAX_SECONDARY_PAGES)
}

async function fetchSecondaryPages(candidatePages: CandidatePage[]): Promise<FetchedPage[]> {
  const results = await Promise.allSettled(
    candidatePages.map(async (page): Promise<FetchedPage | null> => {
      const response = await fetchText(page.url)
      if (!response) return null

      return {
        url: response.finalUrl,
        html: response.text,
        score: scoreCandidatePage(new URL(response.finalUrl), page.linkText, response.text),
        isHomepage: false,
      }
    })
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' && result.value ? [result.value] : []
  )
}

function addCandidatePage(pages: Map<string, CandidatePage>, candidate: CandidatePage) {
  const current = pages.get(candidate.url)
  if (!current || candidate.score > current.score) {
    pages.set(candidate.url, candidate)
  }
}

function extractNavigationPages(html: string, baseUrl: URL): CandidatePage[] {
  const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []

  return links.flatMap((link) => {
    const attrs = parseAttributes(link)
    const href = attrs.get('href')
    const resolvedUrl = resolveSameOriginPageUrl(href, baseUrl)
    if (!resolvedUrl) return []

    const linkText = stripTags(link).trim()
    const score = scoreCandidatePage(resolvedUrl, linkText, link)
    return [{ url: resolvedUrl.href, linkText, score }]
  })
}

function extractSitemapPages(xml: string, baseUrl: URL): CandidatePage[] {
  const locMatches = [...xml.slice(0, MAX_SITEMAP_BYTES).matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .slice(0, MAX_SITEMAP_URLS)
    .map((match) => decodeHtmlEntity((match[1] ?? '').trim()))

  return locMatches.flatMap((loc) => {
    const resolvedUrl = resolveSameOriginPageUrl(loc, baseUrl)
    if (!resolvedUrl) return []

    const score = scoreCandidatePage(resolvedUrl, '', '')
    return [{ url: resolvedUrl.href, linkText: '', score }]
  })
}

function scoreCandidatePage(url: URL, linkText: string, html: string): number {
  const haystack = normalizeText(`${url.pathname} ${linkText}`)
  const termScore = MEDIA_TERMS.reduce(
    (score, term) => score + (haystack.includes(term) ? 20 : 0),
    0
  )
  const imageDensity = countImageReferences(html || url.pathname)
  const densityScore = Math.min(imageDensity * 4, 24)
  const depthPenalty = Math.max(url.pathname.split('/').filter(Boolean).length - 2, 0) * 2

  return termScore + densityScore - depthPenalty
}

function extractCandidateImages(page: FetchedPage, pageIndex: number): CandidateImage[] {
  const candidates: CandidateImage[] = []

  for (const tag of page.html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag)
    const key = attrs.get('property') ?? attrs.get('name')
    if (key !== 'og:image' && key !== 'twitter:image') continue
    addCandidateImage(candidates, attrs.get('content'), page, pageIndex, 'social')
  }

  for (const tag of page.html.match(/<a\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag)
    addCandidateImage(candidates, attrs.get('href'), page, pageIndex, 'direct-link')
  }

  for (const tag of page.html.match(/<img\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag)
    const dimensions = getImageDimensions(attrs)
    const hasLargeDimensions =
      dimensions.width === undefined ||
      dimensions.height === undefined ||
      (dimensions.width >= 400 && dimensions.height >= 400)

    if (!page.isHomepage || dimensions.width !== undefined || dimensions.height !== undefined) {
      if (hasLargeDimensions) {
        addCandidateImage(candidates, attrs.get('src'), page, pageIndex, 'img', dimensions)
      }
    }

    for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
      addCandidateImage(candidates, attrs.get(attr), page, pageIndex, 'lazy', dimensions)
    }

    for (const srcsetUrl of parseSrcset(attrs.get('srcset'))) {
      addCandidateImage(candidates, srcsetUrl, page, pageIndex, 'srcset', dimensions)
    }
  }

  for (const match of page.html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    addCandidateImage(candidates, match[1], page, pageIndex, 'background')
  }

  return candidates
}

function addCandidateImage(
  candidates: CandidateImage[],
  rawUrl: string | undefined,
  page: FetchedPage,
  pageIndex: number,
  source: ImageSource,
  dimensions: { width?: number; height?: number } = {}
) {
  const url = resolveImageUrl(rawUrl, page.url)
  if (!url || isLowValueImageUrl(url, dimensions)) return

  candidates.push({
    url: url.href,
    source,
    pageScore: page.score,
    pageIndex,
    ...dimensions,
  })
}

function rankCandidateImages(candidates: CandidateImage[]): string[] {
  const bestByUrl = new Map<string, CandidateImage>()

  for (const candidate of candidates) {
    const current = bestByUrl.get(candidate.url)
    if (!current || scoreCandidateImage(candidate) > scoreCandidateImage(current)) {
      bestByUrl.set(candidate.url, candidate)
    }
  }

  return [...bestByUrl.values()]
    .sort(
      (a, b) =>
        scoreCandidateImage(b) - scoreCandidateImage(a) ||
        a.pageIndex - b.pageIndex ||
        a.url.localeCompare(b.url)
    )
    .slice(0, MAX_RESULTS)
    .map((candidate) => candidate.url)
}

function scoreCandidateImage(candidate: CandidateImage): number {
  const sourceScore: Record<ImageSource, number> = {
    'direct-link': 90,
    lazy: 80,
    srcset: 75,
    background: 70,
    img: 65,
    social: 5,
  }
  const dimensionScore =
    candidate.width && candidate.height
      ? Math.min((candidate.width * candidate.height) / 80_000, 20)
      : 0

  return candidate.pageScore * 5 + sourceScore[candidate.source] + dimensionScore
}

function resolveSameOriginPageUrl(rawUrl: string | undefined, baseUrl: URL): URL | null {
  const resolvedUrl = resolveUrl(rawUrl, baseUrl.href)
  if (!resolvedUrl) return null
  if (!isSafeFetchUrl(resolvedUrl)) return null
  if (resolvedUrl.origin !== baseUrl.origin) return null
  if (isSocialUrl(resolvedUrl) || isBlockedPageUrl(resolvedUrl)) return null
  resolvedUrl.hash = ''
  return resolvedUrl
}

function resolveImageUrl(rawUrl: string | undefined, baseUrl: string): URL | null {
  const resolvedUrl = resolveUrl(rawUrl, baseUrl)
  if (!resolvedUrl) return null
  if (resolvedUrl.protocol !== 'http:' && resolvedUrl.protocol !== 'https:') return null
  if (!isImageUrl(resolvedUrl)) return null
  resolvedUrl.hash = ''
  return resolvedUrl
}

function resolveUrl(rawUrl: string | undefined, baseUrl: string): URL | null {
  if (!rawUrl) return null
  const trimmed = decodeHtmlEntity(rawUrl.trim())
  if (
    !trimmed ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return null
  }

  try {
    return new URL(trimmed, baseUrl)
  } catch {
    return null
  }
}

function toUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl)
  } catch {
    return null
  }
}

function isRedirectResponse(response: Response): boolean {
  return [301, 302, 303, 307, 308].includes(response.status)
}

function isSafeFetchUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  return !isLocalOrPrivateHostname(url.hostname)
}

function isLocalOrPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '0.0.0.0' ||
    normalized === '::'
  ) {
    return true
  }

  return isPrivateIpv4(normalized) || isPrivateIpv6(normalized)
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.')
  if (parts.length !== 4) return false

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) return Number.NaN
    const octet = Number(part)
    return octet >= 0 && octet <= 255 ? octet : Number.NaN
  })
  if (octets.some((octet) => Number.isNaN(octet))) return false

  const [first, second] = octets
  if (first === undefined || second === undefined) return false

  if (first === 10 || first === 127 || first === 0) return true
  if (first === 172 && second >= 16 && second <= 31) return true
  if (first === 192 && second === 168) return true
  if (first === 169 && second === 254) return true

  return false
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  const mappedIpv4 = getIpv4MappedAddress(normalized)
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4)

  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  )
}

function getIpv4MappedAddress(hostname: string): string | null {
  const dottedMatch = hostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (dottedMatch?.[1]) return dottedMatch[1]

  const hexMatch = hostname.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  const highHex = hexMatch?.[1]
  const lowHex = hexMatch?.[2]
  if (!highHex || !lowHex) return null

  const high = parseInt(highHex, 16)
  const low = parseInt(lowHex, 16)
  if (!Number.isFinite(high) || !Number.isFinite(low)) return null

  return [high >> 8, high & 255, low >> 8, low & 255].join('.')
}

function isSocialUrl(url: URL): boolean {
  return SOCIAL_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
}

function isBlockedPageUrl(url: URL): boolean {
  const pathname = url.pathname.toLowerCase()
  return BLOCKED_PAGE_EXTENSIONS.some((extension) => pathname.endsWith(extension))
}

function isImageUrl(url: URL): boolean {
  const pathname = url.pathname.toLowerCase()
  return IMAGE_EXTENSIONS.some((extension) => pathname.endsWith(extension))
}

function isLowValueImageUrl(url: URL, dimensions: { width?: number; height?: number }): boolean {
  const pathname = normalizeText(url.pathname)
  if (pathname.includes('.svg') || pathname.includes('favicon') || pathname.includes('logo'))
    return true
  if (pathname.includes('icon') || pathname.includes('qr') || pathname.includes('pixel'))
    return true
  if (dimensions.width !== undefined && dimensions.height !== undefined) {
    return dimensions.width < 100 || dimensions.height < 100
  }
  return false
}

function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>()
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi)) {
    const name = match[1]
    if (!name) continue
    attrs.set(name.toLowerCase(), decodeHtmlEntity(match[2] ?? match[3] ?? match[4] ?? ''))
  }
  return attrs
}

function getImageDimensions(attrs: Map<string, string>): { width?: number; height?: number } {
  const width = parseDimension(attrs.get('width'))
  const height = parseDimension(attrs.get('height'))
  return { width, height }
}

function parseDimension(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseSrcset(srcset: string | undefined): string[] {
  if (!srcset) return []
  return srcset
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter((url): url is string => Boolean(url))
}

function stripTags(html: string): string {
  return decodeHtmlEntity(html.replace(/<[^>]+>/g, ' '))
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function countImageReferences(value: string): number {
  const normalized = value.toLowerCase()
  return IMAGE_EXTENSIONS.reduce((count, extension) => {
    return count + (normalized.match(new RegExp(escapeRegExp(extension), 'g'))?.length ?? 0)
  }, 0)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeHtmlEntity(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
