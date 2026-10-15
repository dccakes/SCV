/**
 * @jest-environment node
 */
import { SpanStatusCode, trace } from '@opentelemetry/api'
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { TRPCError } from '@trpc/server'

import { withProcedureSpan } from '~/server/infrastructure/observability/trpc-tracing'

const exporter = new InMemorySpanExporter()
trace.setGlobalTracerProvider(
  new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] })
)

beforeEach(() => exporter.reset())

const headers = new Headers({
  'x-posthog-distinct-id': 'user_1',
  'x-posthog-session-id': 'session_1',
})

describe('withProcedureSpan', () => {
  it('creates one span per procedure linked to the PostHog person and session', async () => {
    const result = await withProcedureSpan(
      { path: 'guest.list', type: 'query', headers, userId: 'user_1' },
      async () => ({ ok: true as const, data: [] })
    )

    expect(result.ok).toBe(true)
    const [span] = exporter.getFinishedSpans()
    expect(span?.name).toBe('trpc guest.list')
    expect(span?.attributes).toMatchObject({
      'rpc.system': 'trpc',
      'rpc.method': 'guest.list',
      'trpc.type': 'query',
      posthogDistinctId: 'user_1',
      sessionId: 'session_1',
      'enduser.id': 'user_1',
    })
    expect(span?.status.code).toBe(SpanStatusCode.UNSET)
  })

  it('falls back to the user id for anonymous-header requests such as RSC callers', async () => {
    await withProcedureSpan({ path: 'event.get', type: 'query', userId: 'user_2' }, async () => ({
      ok: true as const,
    }))

    expect(exporter.getFinishedSpans()[0]?.attributes.posthogDistinctId).toBe('user_2')
  })

  it('does not mark expected client errors as span errors', async () => {
    await withProcedureSpan({ path: 'guest.get', type: 'query' }, async () => ({
      ok: false as const,
      error: new TRPCError({ code: 'NOT_FOUND' }),
    }))

    const [span] = exporter.getFinishedSpans()
    expect(span?.status.code).toBe(SpanStatusCode.UNSET)
    expect(span?.attributes).toMatchObject({
      'trpc.error_code': 'NOT_FOUND',
      'http.response.status_code': 404,
    })
  })

  it('records server errors on the span', async () => {
    await withProcedureSpan({ path: 'guest.add', type: 'mutation' }, async () => ({
      ok: false as const,
      error: new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'db down' }),
    }))

    const [span] = exporter.getFinishedSpans()
    expect(span?.status).toEqual({ code: SpanStatusCode.ERROR, message: 'db down' })
    expect(span?.events.some((event) => event.name === 'exception')).toBe(true)
  })

  it('ends the span and rethrows when the resolver throws', async () => {
    await expect(
      withProcedureSpan({ path: 'x.y', type: 'query' }, async () => {
        throw new Error('kaboom')
      })
    ).rejects.toThrow('kaboom')

    expect(exporter.getFinishedSpans()[0]?.status.code).toBe(SpanStatusCode.ERROR)
  })
})
