jest.mock('posthog-js', () => ({ __esModule: true, default: { __loaded: false } }))

import type { Span } from '@opentelemetry/api'

import { fetchFailure, redactSpanUrls, redactUrl } from '~/lib/observability/browser-tracing'

describe('redactUrl', () => {
  it('strips query strings, fragments, and credentials', () => {
    expect(
      redactUrl(
        'https://user:pw@example.com/api/trpc/household.findBySearchPublic?batch=1&input=%7B%22token%22%7D#x',
        'https://example.com'
      )
    ).toBe('https://example.com/api/trpc/household.findBySearchPublic')
  })

  it('resolves relative URLs against the page', () => {
    expect(redactUrl('/w/shrek?invite=abc', 'https://oswp.app/x')).toBe('https://oswp.app/w/shrek')
  })
})

describe('redactSpanUrls', () => {
  it('rewrites URL attributes on recording spans and ignores sampled-out spans', () => {
    const setAttribute = jest.fn()
    const span = {
      attributes: { 'http.url': 'https://example.com/a?token=1', 'url.full': '/b#frag' },
      setAttribute,
    } as unknown as Span

    redactSpanUrls(span)

    expect(setAttribute).toHaveBeenCalledWith('http.url', 'https://example.com/a')
    expect(setAttribute).toHaveBeenCalledWith('url.full', 'http://localhost/b')

    const nonRecording = { setAttribute: jest.fn() } as unknown as Span
    redactSpanUrls(nonRecording)
    expect(nonRecording.setAttribute).not.toHaveBeenCalled()
  })
})

describe('fetchFailure', () => {
  it('reports 5xx responses and network errors', () => {
    expect(fetchFailure({ status: 502 })?.message).toBe('HTTP request failed with status 502')
    const networkError = new TypeError('Failed to fetch')
    expect(fetchFailure(networkError)).toBe(networkError)
  })

  it('ignores success, client errors, and deliberate aborts', () => {
    expect(fetchFailure({ status: 200 })).toBeUndefined()
    expect(fetchFailure({ status: 404 })).toBeUndefined()
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    expect(fetchFailure(abort)).toBeUndefined()
  })
})
