import { registerOTel } from '@vercel/otel'
import type { Instrumentation } from 'next'

export function register() {
  registerOTel({ serviceName: 'scv' })
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  console.error('[scv:error]', {
    message: (err as Error).message,
    digest: (err as Error & { digest?: string }).digest,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  })
}
