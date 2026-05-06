import { fetchWebsiteImages } from '~/server/infrastructure/scraper/website-images'

// jsdom test environment does not provide fetch — install a stub so jest.spyOn can wrap it
if (!global.fetch) {
  global.fetch = jest.fn()
}

const mockFetch = jest.spyOn(global, 'fetch')

function mockHtmlResponse(html: string, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    text: async () => html,
  } as Response)
}

describe('fetchWebsiteImages', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('extracts og:image from meta tag (content after property)', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta property="og:image" content="https://example.com/hero.jpg">
      </head></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toContain('https://example.com/hero.jpg')
  })

  it('extracts og:image when content attribute comes before property', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta content="https://example.com/hero.jpg" property="og:image">
      </head></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toContain('https://example.com/hero.jpg')
  })

  it('extracts twitter:image from meta tag', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta name="twitter:image" content="https://example.com/twitter.jpg">
      </head></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toContain('https://example.com/twitter.jpg')
  })

  it('extracts twitter:image when content attribute comes before name', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta content="https://example.com/twitter.jpg" name="twitter:image">
      </head></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toContain('https://example.com/twitter.jpg')
  })

  it('extracts large img tags where width >= 400 AND height >= 400', async () => {
    mockHtmlResponse(
      `<html><body>
        <img src="https://example.com/large.jpg" width="800" height="600">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toContain('https://example.com/large.jpg')
  })

  it('excludes SVG images from img tags', async () => {
    mockHtmlResponse(
      `<html><body>
        <img src="https://example.com/icon.svg" width="500" height="500">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).not.toContain('https://example.com/icon.svg')
  })

  it('excludes img tags without explicit dimensions', async () => {
    mockHtmlResponse(
      `<html><body>
        <img src="https://example.com/no-dims.jpg">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).not.toContain('https://example.com/no-dims.jpg')
  })

  it('excludes img tags where width < 400', async () => {
    mockHtmlResponse(
      `<html><body>
        <img src="https://example.com/narrow.jpg" width="300" height="600">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).not.toContain('https://example.com/narrow.jpg')
  })

  it('excludes img tags where height < 400', async () => {
    mockHtmlResponse(
      `<html><body>
        <img src="https://example.com/short.jpg" width="600" height="200">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).not.toContain('https://example.com/short.jpg')
  })

  it('excludes img tags where both width and height are below 400', async () => {
    mockHtmlResponse(
      `<html><body>
        <img src="https://example.com/tiny.jpg" width="100" height="100">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).not.toContain('https://example.com/tiny.jpg')
  })

  it('deduplicates identical URLs', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta property="og:image" content="https://example.com/hero.jpg">
        <meta name="twitter:image" content="https://example.com/hero.jpg">
      </head><body>
        <img src="https://example.com/hero.jpg" width="800" height="600">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    const count = result.filter((url) => url === 'https://example.com/hero.jpg').length
    expect(count).toBe(1)
  })

  it('returns at most 20 candidate URLs', async () => {
    const imgs = Array.from(
      { length: 30 },
      (_, i) => `<img src="https://example.com/img${i}.jpg" width="500" height="500">`
    ).join('\n')
    mockHtmlResponse(`<html><body>${imgs}</body></html>`)
    const result = await fetchWebsiteImages('https://example.com')
    expect(result.length).toBeLessThanOrEqual(20)
  })

  it('returns [] when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toEqual([])
  })

  it('returns [] when HTTP response is not OK (404)', async () => {
    mockHtmlResponse('<html></html>', 404)
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toEqual([])
  })

  it('resolves relative URLs to absolute using the base URL', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta property="og:image" content="/images/hero.jpg">
      </head><body>
        <img src="/images/large.jpg" width="800" height="600">
      </body></html>`
    )
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toContain('https://example.com/images/hero.jpg')
    expect(result).toContain('https://example.com/images/large.jpg')
  })

  it('returns [] when no usable images are found', async () => {
    mockHtmlResponse('<html><body><p>No images here</p></body></html>')
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toEqual([])
  })
})
