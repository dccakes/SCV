import { trace } from '@opentelemetry/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'
import { after, type NextRequest } from 'next/server'

import { POSTHOG_DISTINCT_ID_HEADER, POSTHOG_SESSION_ID_HEADER } from '~/lib/observability/config'
import { logger } from '~/lib/observability/logger'
import { appRouter } from '~/server/api/root'
import { createTRPCContext } from '~/server/api/trpc'
import { captureServerException } from '~/server/infrastructure/observability/capture-exception'

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
    onError: ({ path, error, type }) => {
      const status = getHTTPStatusCodeFromError(error)
      const attributes = {
        'trpc.path': path ?? 'unknown',
        'trpc.type': type,
        'trpc.error_code': error.code,
        'http.response.status_code': status,
      }
      const cause = error.cause ?? error
      if (status < 500) {
        logger.warn('tRPC client error', attributes, cause)
        return
      }
      logger.error('tRPC server error', attributes, cause)
      const spanContext = trace.getActiveSpan()?.spanContext()
      // tRPC turns the throw into a response, so Next's onRequestError never
      // sees it. Report after the response so the client isn't kept waiting.
      after(() =>
        captureServerException(cause, {
          distinctId: req.headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined,
          sessionId: req.headers.get(POSTHOG_SESSION_ID_HEADER) ?? undefined,
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
