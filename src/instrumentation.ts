import { registerOTel } from '@vercel/otel'
import type { Instrumentation } from 'next'

export function register() {
  registerOTel({ serviceName: 'scv' })
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  process.stderr.write(
    `${JSON.stringify({
      digest: (err as Error & { digest?: string }).digest,
      message: (err as Error).message,
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
      tag: 'scv:error',
    })}\n`
  )
}
