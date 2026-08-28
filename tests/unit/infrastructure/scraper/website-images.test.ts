import * as dns from 'node:dns/promises'
import { fetchWebsiteImages } from '~/server/infrastructure/scraper/website-images'

// Prevent real undici Agent instances from creating open handles in the jsdom environment.
// The implementation creates Agents for SSRF-safe dispatching, but tests mock global.fetch
// so the dispatcher is never used — a lightweight stub is sufficient.
jest.mock('undici', () => ({
  Agent: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined),
  })),
}))

// jest.spyOn on native Node.js built-ins is unreliable in Node 22 — the property descriptor
// may be non-configurable, allowing real DNS I/O to escape and cause ~5-second timeouts.
// jest.mock is hoisted before imports, so the production module gets the stub on load.
jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}))

// jsdom test environment does not provide fetch — install a stub so jest.spyOn can wrap it
if (!global.fetch) {
  global.fetch = jest.fn()
}

const mockFetch = jest.spyOn(global, 'fetch')
const mockLookup = dns.lookup as jest.MockedFunction<typeof dns.lookup>

function mockHtmlResponse(html: string, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    text: async () => html,
  } as Response)
}

function mockResponsesByUrl(responses: Record<string, { html: string; status?: number } | Error>) {
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const requestUrl =
      typeof Request !== 'undefined' && input instanceof Request ? input.url : input.toString()
    const response = responses[requestUrl]

    if (response instanceof Error) {
      throw response
    }

    if (!response) {
      return {
        ok: false,
        text: async () => '',
      } as Response
    }

    const status = response.status ?? 200
    return {
      ok: status >= 200 && status < 300,
      text: async () => response.html,
    } as Response
  })
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

async function waitForCondition(condition: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return
    await new Promise((resolve) => setTimeout(resolve, 1))
  }
}

function mockRedirectResponse(location: string, status = 302) {
  return {
    ok: false,
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'location' ? location : null),
    },
    text: async () => '',
  } as unknown as Response
}

describe('fetchWebsiteImages', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockLookup.mockReset()
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
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

  it.each([
    'ftp://example.com',
    'file:///tmp/site.html',
    'http://localhost',
    'http://127.0.0.1',
    'http://[::1]',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://192.168.1.10',
    'http://169.254.1.1',
    'http://169.254.169.254',
    'http://[fe80::1]',
    'http://[fc00::1]',
    'http://[fd00::1]',
    'http://[::ffff:127.0.0.1]',
    'http://[::ffff:10.0.0.1]',
    'http://[::ffff:172.16.0.1]',
    'http://[::ffff:192.168.1.10]',
    'http://[::ffff:169.254.169.254]',
    'http://[::ffff:7f00:1]',
    'http://[::ffff:a00:1]',
    'http://[::ffff:ac10:1]',
    'http://[::ffff:c0a8:10a]',
    'http://[::ffff:a9fe:a9fe]',
    'http://0.0.0.0',
    'http://[::]',
  ])('rejects unsafe submitted URL %s before fetching', async (url) => {
    const result = await fetchWebsiteImages(url)

    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects redirects to private or local targets', async () => {
    mockFetch.mockResolvedValueOnce(mockRedirectResponse('http://127.0.0.1/admin'))

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('rejects a public-looking hostname that resolves to a private IP before fetching', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }])

    const result = await fetchWebsiteImages('https://public-looking.example')

    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects a redirect target hostname that resolves to a private IP before following it', async () => {
    mockLookup.mockImplementation(async (hostname) => {
      if (hostname === 'internal.example') {
        return [{ address: '192.168.1.10', family: 4 }]
      }
      return [{ address: '93.184.216.34', family: 4 }]
    })
    mockFetch.mockResolvedValueOnce(mockRedirectResponse('https://internal.example/admin'))

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    'http://[fd00::1]/admin',
    'http://[::ffff:127.0.0.1]/admin',
  ])('rejects redirect target %s', async (targetUrl) => {
    mockFetch.mockResolvedValueOnce(mockRedirectResponse(targetUrl))

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('follows allowed public redirects after validating the redirect target', async () => {
    mockFetch
      .mockResolvedValueOnce(mockRedirectResponse('https://www.example.com'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => '<meta property="og:image" content="/hero.jpg">',
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => '' } as Response)

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toContain('https://www.example.com/hero.jpg')
    expect(mockFetch).toHaveBeenCalledWith('https://www.example.com/', expect.objectContaining({}))
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

  it('rejects non-http image URLs but accepts protocol-relative HTTPS image URLs', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta property="og:image" content="//cdn.example.com/hero.jpg">
      </head><body>
        <a href="javascript:/tracking/photo.jpg">Script image</a>
        <a href="ftp://example.com/photo.jpg">FTP image</a>
        <a href="file:///tmp/photo.jpg">File image</a>
      </body></html>`
    )

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toContain('https://cdn.example.com/hero.jpg')
    expect(result).not.toEqual(
      expect.arrayContaining([
        'javascript:/tracking/photo.jpg',
        'ftp://example.com/photo.jpg',
        'file:///tmp/photo.jpg',
      ])
    )
  })

  it('extracts unquoted meta and img attributes', async () => {
    mockHtmlResponse(
      `<html><head>
        <meta property=og:image content=/hero.jpg>
      </head><body>
        <img src=/photo.jpg width=800 height=600>
      </body></html>`
    )

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toEqual(
      expect.arrayContaining(['https://example.com/hero.jpg', 'https://example.com/photo.jpg'])
    )
  })

  it('rejects oversized responses by Content-Length before reading text', async () => {
    const text = jest.fn(async () => '<html></html>')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-length' ? '500001' : null),
      },
      text,
    } as unknown as Response)

    const result = await fetchWebsiteImages('https://example.com')

    expect(result).toEqual([])
    expect(text).not.toHaveBeenCalled()
  })

  it('returns [] when no usable images are found', async () => {
    mockHtmlResponse('<html><body><p>No images here</p></body></html>')
    const result = await fetchWebsiteImages('https://example.com')
    expect(result).toEqual([])
  })

  it('discovers and fetches a same-origin Spanish gallery page from homepage navigation', async () => {
    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><body>
          <nav>
            <a href="/galeria">Galería</a>
            <a href="https://instagram.com/example">Instagram</a>
          </nav>
          <meta property="og:image" content="/homepage-preview.jpg">
        </body></html>`,
      },
      'https://example.com/sitemap.xml': { html: '<urlset></urlset>', status: 404 },
      'https://example.com/galeria': {
        html: `<html><body>
          <a href="/photos/boda-1.jpg">Boda 1</a>
        </body></html>`,
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(result).toContain('https://example.com/photos/boda-1.jpg')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/galeria',
      expect.objectContaining({})
    )
  })

  it('discovers and ranks likely media pages from sitemap.xml', async () => {
    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><head>
          <meta property="og:image" content="/homepage-preview.jpg">
        </head><body>
          <a href="/contacto">Contacto</a>
        </body></html>`,
      },
      'https://example.com/sitemap.xml': {
        html: `<urlset>
          <url><loc>https://example.com/contacto</loc></url>
          <url><loc>https://example.com/bodas</loc></url>
          <url><loc>https://example.com/galeria</loc></url>
          <url><loc>https://example.com/salon-jardin</loc></url>
          <url><loc>https://example.com/bodas-y-banquetes</loc></url>
        </urlset>`,
      },
      'https://example.com/bodas-y-banquetes': {
        html: '<a href="/images/banquete.jpg">Banquete</a>',
      },
      'https://example.com/galeria': {
        html: '<a href="/images/galeria.jpg">Galeria</a>',
      },
      'https://example.com/bodas': {
        html: '<a href="/images/bodas.jpg">Bodas</a>',
      },
      'https://example.com/salon-jardin': {
        html: '<a href="/images/salon.jpg">Salon</a>',
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(result).toEqual(
      expect.arrayContaining([
        'https://example.com/images/banquete.jpg',
        'https://example.com/images/galeria.jpg',
        'https://example.com/images/bodas.jpg',
      ])
    )
    expect(mockFetch).not.toHaveBeenCalledWith(
      'https://example.com/contacto',
      expect.objectContaining({})
    )
    expect(result.indexOf('https://example.com/images/banquete.jpg')).toBeLessThan(
      result.indexOf('https://example.com/homepage-preview.jpg')
    )
  })

  it('ranks direct gallery image links ahead of homepage social preview images', async () => {
    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><head>
          <meta property="og:image" content="/homepage-preview.jpg">
        </head><body>
          <a href="/galeria">Galería</a>
        </body></html>`,
      },
      'https://example.com/sitemap.xml': { html: '<urlset></urlset>', status: 404 },
      'https://example.com/galeria': {
        html: `<html><body>
          <a href="/gallery/wedding-a.jpg">Wedding A</a>
          <a href="/gallery/wedding-b.webp">Wedding B</a>
        </body></html>`,
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(result.slice(0, 2)).toEqual([
      'https://example.com/gallery/wedding-a.jpg',
      'https://example.com/gallery/wedding-b.webp',
    ])
    expect(result).toContain('https://example.com/homepage-preview.jpg')
  })

  it('extracts lazy attributes, srcset entries, and CSS background images', async () => {
    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><body>
          <a href="/galeria">Galería</a>
        </body></html>`,
      },
      'https://example.com/sitemap.xml': { html: '<urlset></urlset>', status: 404 },
      'https://example.com/galeria': {
        html: `<html><body>
          <img data-src="/lazy/data-src.jpg">
          <img data-lazy-src="/lazy/data-lazy-src.jpg">
          <img data-original="/lazy/data-original.jpg">
          <img srcset="/srcset/small.jpg 400w, /srcset/large.jpg 1200w">
          <section style="background-image: url('/backgrounds/venue.webp')"></section>
        </body></html>`,
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(result).toEqual(
      expect.arrayContaining([
        'https://example.com/lazy/data-src.jpg',
        'https://example.com/lazy/data-lazy-src.jpg',
        'https://example.com/lazy/data-original.jpg',
        'https://example.com/srcset/small.jpg',
        'https://example.com/srcset/large.jpg',
        'https://example.com/backgrounds/venue.webp',
      ])
    )
  })

  it('probes a same-origin non-keyword page and includes images when fetched HTML is image-heavy', async () => {
    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><head>
          <meta property="og:image" content="/homepage-preview.jpg">
        </head><body>
          <a href="/showcase-123">Recent work</a>
        </body></html>`,
      },
      'https://example.com/sitemap.xml': { html: '<urlset></urlset>', status: 404 },
      'https://example.com/showcase-123': {
        html: `<html><body>
          <a href="/uploads/showcase-a.jpg">A</a>
          <a href="/uploads/showcase-b.jpg">B</a>
          <a href="/uploads/showcase-c.webp">C</a>
          <img src="/uploads/showcase-d.jpg" width="900" height="600">
        </body></html>`,
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/showcase-123',
      expect.objectContaining({})
    )
    expect(result).toEqual(
      expect.arrayContaining([
        'https://example.com/uploads/showcase-a.jpg',
        'https://example.com/uploads/showcase-b.jpg',
        'https://example.com/uploads/showcase-c.webp',
        'https://example.com/uploads/showcase-d.jpg',
      ])
    )
    expect(result.indexOf('https://example.com/uploads/showcase-a.jpg')).toBeLessThan(
      result.indexOf('https://example.com/homepage-preview.jpg')
    )
  })

  it('deduplicates URLs, filters low-value assets, and caps results at 20', async () => {
    const galleryImages = Array.from(
      { length: 25 },
      (_, index) => `<a href="/gallery/photo-${index}.jpg">Photo ${index}</a>`
    ).join('\n')

    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><body>
          <a href="/galeria">Galería</a>
          <img src="/gallery/photo-0.jpg" width="900" height="600">
          <img src="/assets/logo.png" width="900" height="600">
          <img src="/assets/favicon.ico" width="900" height="600">
          <img src="/assets/icon.svg" width="900" height="600">
          <a href="/docs/menu.pdf">Menu</a>
          <a href="/videos/tour.mp4">Tour</a>
          <img src="/tracking/pixel.gif" width="1" height="1">
          <img src="/qr-code.png" width="900" height="600">
        </body></html>`,
      },
      'https://example.com/sitemap.xml': { html: '<urlset></urlset>', status: 404 },
      'https://example.com/galeria': {
        html: `<html><body>
          ${galleryImages}
          <img src="/gallery/photo-0.jpg" width="900" height="600">
        </body></html>`,
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(result).toHaveLength(20)
    expect(new Set(result).size).toBe(result.length)
    expect(result).not.toEqual(
      expect.arrayContaining([
        'https://example.com/assets/logo.png',
        'https://example.com/assets/favicon.ico',
        'https://example.com/assets/icon.svg',
        'https://example.com/docs/menu.pdf',
        'https://example.com/videos/tour.mp4',
        'https://example.com/tracking/pixel.gif',
        'https://example.com/qr-code.png',
      ])
    )
  })

  it('returns successful page candidates when a selected secondary page fetch fails', async () => {
    mockResponsesByUrl({
      'https://example.com/': {
        html: `<html><head>
          <meta property="og:image" content="/homepage-preview.jpg">
        </head><body>
          <a href="/galeria">Galería</a>
          <a href="/bodas">Bodas</a>
        </body></html>`,
      },
      'https://example.com/sitemap.xml': { html: '<urlset></urlset>', status: 404 },
      'https://example.com/galeria': new Error('Network error'),
      'https://example.com/bodas': {
        html: '<a href="/images/bodas.jpg">Bodas</a>',
      },
    })

    const result = await fetchWebsiteImages('https://example.com/')

    expect(result).toEqual(
      expect.arrayContaining([
        'https://example.com/images/bodas.jpg',
        'https://example.com/homepage-preview.jpg',
      ])
    )
  })

  it('fetches selected secondary pages concurrently while preserving candidate order', async () => {
    const galeria = createDeferred<Response>()
    const bodas = createDeferred<Response>()
    const calls: string[] = []

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof Request !== 'undefined' && input instanceof Request ? input.url : input.toString()
      calls.push(requestUrl)

      if (requestUrl === 'https://example.com/') {
        return {
          ok: true,
          text: async () => `<html><body>
            <a href="/galeria">Galería</a>
            <a href="/bodas">Bodas</a>
          </body></html>`,
        } as Response
      }

      if (requestUrl === 'https://example.com/sitemap.xml') {
        return { ok: false, text: async () => '' } as Response
      }

      if (requestUrl === 'https://example.com/galeria') return galeria.promise
      if (requestUrl === 'https://example.com/bodas') return bodas.promise

      return { ok: false, text: async () => '' } as Response
    })

    const resultPromise = fetchWebsiteImages('https://example.com/')

    await waitForCondition(() => calls.length >= 4)

    expect(calls.slice(0, 2)).toEqual(['https://example.com/', 'https://example.com/sitemap.xml'])
    expect(calls.slice(2)).toHaveLength(2)
    expect(calls.slice(2)).toEqual(
      expect.arrayContaining(['https://example.com/bodas', 'https://example.com/galeria'])
    )

    galeria.resolve({
      ok: true,
      text: async () => '<a href="/images/galeria.jpg">Galeria</a>',
    } as Response)
    bodas.resolve({
      ok: true,
      text: async () => '<a href="/images/bodas.jpg">Bodas</a>',
    } as Response)

    const result = await resultPromise

    expect(result.indexOf('https://example.com/images/bodas.jpg')).toBeLessThan(
      result.indexOf('https://example.com/images/galeria.jpg')
    )
  })
})
