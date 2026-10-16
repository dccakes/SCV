/**
 * Per-procedure tRPC spans.
 *
 * Next.js traces `/api/trpc/[trpc]` as one route span even when the client
 * batches several procedures into it. This wraps each procedure in its own
 * span so traces show which call was slow or failed, with the Prisma and fetch
 * spans it caused nested underneath.
 */

import { type SpanContext, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api'
import type { TRPCError } from '@trpc/server'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'

import {
  POSTHOG_DISTINCT_ID_ATTRIBUTE,
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_ATTRIBUTE,
  POSTHOG_SESSION_ID_HEADER,
} from '~/lib/observability/config'

const tracer = trace.getTracer('scv.trpc')

/**
 * Failing procedure span per error. tRPC calls `onError` after the procedure
 * span has ended, when only the shared route span is active, so error reports
 * look up the span that actually failed here.
 */
const failedProcedureSpans = new WeakMap<object, SpanContext>()

export function getProcedureSpanContext(error: unknown): SpanContext | undefined {
  return typeof error === 'object' && error !== null ? failedProcedureSpans.get(error) : undefined
}

export interface ProcedureSpanInput {
  path: string
  type: string
  headers?: Headers
  userId?: string | null
}

type ProcedureResult = { ok: true } | { ok: false; error: TRPCError }

export function withProcedureSpan<TResult extends ProcedureResult>(
  { path, type, headers, userId }: ProcedureSpanInput,
  next: () => Promise<TResult>
): Promise<TResult> {
  return tracer.startActiveSpan(
    `trpc ${path}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: { 'rpc.system': 'trpc', 'rpc.method': path, 'trpc.type': type },
    },
    async (span) => {
      // The header is client-controlled; the authenticated user always wins.
      const distinctId = userId ?? headers?.get(POSTHOG_DISTINCT_ID_HEADER)
      const sessionId = headers?.get(POSTHOG_SESSION_ID_HEADER)
      if (distinctId) span.setAttribute(POSTHOG_DISTINCT_ID_ATTRIBUTE, distinctId)
      if (sessionId) span.setAttribute(POSTHOG_SESSION_ID_ATTRIBUTE, sessionId)
      if (userId) span.setAttribute('enduser.id', userId)
      try {
        const result = await next()
        if (!result.ok) {
          const status = getHTTPStatusCodeFromError(result.error)
          span.setAttribute('trpc.error_code', result.error.code)
          span.setAttribute('http.response.status_code', status)
          // Client errors (auth, validation, not found) are expected outcomes.
          if (status >= 500) {
            failedProcedureSpans.set(result.error, span.spanContext())
            span.recordException(result.error)
            span.setStatus({ code: SpanStatusCode.ERROR, message: result.error.message })
          }
        }
        return result
      } catch (error) {
        if (typeof error === 'object' && error !== null) {
          failedProcedureSpans.set(error, span.spanContext())
        }
        span.recordException(error instanceof Error ? error : String(error))
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    }
  )
}
