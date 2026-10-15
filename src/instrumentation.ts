import { registerOTel } from '@vercel/otel'
import type { Instrumentation } from 'next'

import {
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
  SERVICE_NAME,
} from '~/lib/observability/config'
import { logger } from '~/lib/observability/logger'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { buildNodeOTelConfig } = await import('~/server/infrastructure/observability/node-otel')
    registerOTel(buildNodeOTelConfig())
    return
  }
  registerOTel({ serviceName: SERVICE_NAME })
}

const headerValue = (value: string | string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value) || undefined

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err))
  const attributes = {
    'error.digest': (error as Error & { digest?: string }).digest,
    'http.request.method': request.method,
    'url.path': request.path.split('?')[0],
    'next.route': context.routePath,
    'next.route_type': context.routeType,
    'next.router_kind': context.routerKind,
  }

  logger.error('Unhandled request error', attributes, error)

  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { captureServerException } = await import(
    '~/server/infrastructure/observability/capture-exception'
  )
  await captureServerException(error, {
    distinctId: headerValue(request.headers[POSTHOG_DISTINCT_ID_HEADER]),
    sessionId: headerValue(request.headers[POSTHOG_SESSION_ID_HEADER]),
    properties: { ...attributes, source: 'next-on-request-error' },
  })
}
