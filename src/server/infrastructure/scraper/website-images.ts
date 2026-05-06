export async function fetchWebsiteImages(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OSWP/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return []
    const html = await response.text()
    return extractCandidateImages(html, url)
  } catch {
    return []
  }
}

function extractCandidateImages(html: string, baseUrl: string): string[] {
  const candidates: string[] = []

  // Extract og:image — handle both attribute orderings
  const ogMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  if (ogMatch?.[1]) candidates.push(ogMatch[1])

  // Extract twitter:image — handle both attribute orderings
  const twitterMatch =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
  if (twitterMatch?.[1]) candidates.push(twitterMatch[1])

  // Extract <img> tags with explicit large dimensions
  const imgRegex = /<img[^>]+>/gi
  const imgTags = html.match(imgRegex) ?? []
  for (const tag of imgTags) {
    const srcMatch = tag.match(/src=["']([^"']+)["']/i)
    if (!srcMatch?.[1]) continue

    const src = srcMatch[1]
    if (src.toLowerCase().includes('.svg')) continue

    const widthMatch = tag.match(/width=["']?(\d+)["']?/i)
    const heightMatch = tag.match(/height=["']?(\d+)["']?/i)
    const widthStr = widthMatch?.[1]
    const heightStr = heightMatch?.[1]
    if (!widthStr || !heightStr) continue

    const width = parseInt(widthStr, 10)
    const height = parseInt(heightStr, 10)
    if (width >= 400 && height >= 400) {
      candidates.push(src)
    }
  }

  // Resolve relative URLs and deduplicate
  const seen = new Set<string>()
  const resolved: string[] = []
  for (const candidate of candidates) {
    try {
      const absolute = new URL(candidate, baseUrl).href
      if (!seen.has(absolute)) {
        seen.add(absolute)
        resolved.push(absolute)
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return resolved.slice(0, 20)
}
