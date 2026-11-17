import { trace } from '@opentelemetry/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'
import { after, type NextRequest } from 'next/server'

import {
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
  parseTelemetryId,
} from '~/lib/observability/config'
import { logger } from '~/lib/observability/logger'
import { appRouter } from '~/server/api/root'
import { createTRPCContext } from '~/server/api/trpc'
import { captureServerException } from '~/server/infrastructure/observability/capture-exception'
import { getProcedureSpanContext } from '~/server/infrastructure/observability/trpc-tracing'
import { RateLimitError } from '~/server/infrastructure/rate-limit'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  })
}

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    // tRPC only sets a status code for TOO_MANY_REQUESTS; add Retry-After so clients can back off.
    responseMeta: ({ errors }) => {
      const limited = errors.find((error) => error.cause instanceof RateLimitError)
      const retryAfter =
        limited?.cause instanceof RateLimitError ? limited.cause.retryAfterSeconds : 0
      return retryAfter > 0 ? { headers: { 'Retry-After': String(retryAfter) } } : {}
    },
    onError: ({ path, error, type, ctx }) => {
      const status = getHTTPStatusCodeFromError(error)
      const attributes = {
        'trpc.path': path ?? 'unknown',
        'trpc.type': type,
        'trpc.error_code': error.code,
        'http.response.status_code': status,
      }
      if (status < 500) {
        // Expected outcomes (auth, validation, not found): no stack trace, which
        // would only bloat billed log volume for something that isn't a bug.
        logger.warn('tRPC client error', attributes)
        return
      }
      const cause = error.cause ?? error
      logger.error('tRPC server error', attributes, cause)
      // onError runs after the procedure span ended; report the span that failed,
      // not the route span shared by every procedure in the batch.
      const spanContext = getProcedureSpanContext(error) ?? trace.getActiveSpan()?.spanContext()
      // tRPC turns the throw into a response, so Next's onRequestError never
      // sees it. Report after the response so the client isn't kept waiting.
      after(() =>
        captureServerException(cause, {
          userId: ctx?.auth?.userId,
          clientDistinctId: req.headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined,
          sessionId: parseTelemetryId(req.headers.get(POSTHOG_SESSION_ID_HEADER)),
          properties: {
            ...attributes,
            source: 'trpc',
            ...(spanContext ? { trace_id: spanContext.traceId, span_id: spanContext.spanId } : {}),
          },
        })
      )
    },
  })

export { handler as GET, handler as POST }
