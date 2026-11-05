/** @jest-environment node */

type ResponseMeta = (opts: { errors: { cause?: unknown }[] }) => {
  headers?: Record<string, string>
}

const mockFetchRequestHandler = jest.fn()

jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: (opts: unknown) => mockFetchRequestHandler(opts),
}))
jest.mock('~/server/api/root', () => ({ appRouter: {} }))
jest.mock('~/server/api/trpc', () => ({ createTRPCContext: jest.fn() }))
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/server/infrastructure/observability/capture-exception', () => ({
  captureServerException: jest.fn(),
}))
jest.mock('~/server/infrastructure/observability/trpc-tracing', () => ({
  getProcedureSpanContext: jest.fn(),
}))

import { GET } from '~/app/api/trpc/[trpc]/route'
import { RateLimitError } from '~/server/infrastructure/rate-limit'

function getResponseMeta(): ResponseMeta {
  mockFetchRequestHandler.mockReturnValue(new Response('{}'))
  void GET(new Request('https://example.com/api/trpc/ping') as never)
  const [options] = mockFetchRequestHandler.mock.calls[0] as [{ responseMeta: ResponseMeta }]
  return options.responseMeta
}

describe('tRPC route responseMeta', () => {
  it('adds Retry-After when a procedure was rate limited', () => {
    const responseMeta = getResponseMeta()

    expect(responseMeta({ errors: [{ cause: new RateLimitError(30) }] })).toEqual({
      headers: { 'Retry-After': '30' },
    })
  })

  it('still adds it when only one call in a batch was rate limited', () => {
    const responseMeta = getResponseMeta()

    expect(
      responseMeta({ errors: [{ cause: new Error('boom') }, { cause: new RateLimitError(12) }] })
    ).toEqual({ headers: { 'Retry-After': '12' } })
  })

  it('adds nothing when there are no errors', () => {
    expect(getResponseMeta()({ errors: [] })).toEqual({})
  })

  it('adds nothing for other errors, including a TOO_MANY_REQUESTS that did not come from the limiter', () => {
    const responseMeta = getResponseMeta()

    expect(responseMeta({ errors: [{ cause: new Error('other') }, {}] })).toEqual({})
  })
})
