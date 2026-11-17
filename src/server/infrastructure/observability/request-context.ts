/**
 * Access to the serverless request context's `waitUntil`, without importing
 * `@vercel/functions` or Next's `after()` (which throws outside a request).
 *
 * Vercel (and Next.js on platforms that provide one) exposes the current
 * request context through a global symbol. `waitUntil` keeps the invocation
 * alive after the response until the given promise settles, so telemetry
 * queued during a request is actually sent.
 */

type WaitUntil = (promise: Promise<unknown>) => void

export interface RequestContext {
  waitUntil?: WaitUntil
}

const REQUEST_CONTEXT_SYMBOLS = [
  Symbol.for('@vercel/request-context'), // Vercel functions (what @vercel/otel reads)
  Symbol.for('@next/request-context'), // Next.js builtin context, when a host platform provides it
]

/** The current request context, or `undefined` outside a request (Docker, scripts, tests). */
export function currentRequestContext(): RequestContext | undefined {
  const globals = globalThis as unknown as Record<
    symbol,
    { get?: () => RequestContext | undefined } | undefined
  >
  for (const symbol of REQUEST_CONTEXT_SYMBOLS) {
    const context = globals[symbol]?.get?.()
    if (context?.waitUntil) return context
  }
  return undefined
}

/**
 * Extends the current invocation until `promise` settles. A no-op outside a
 * request, where long-lived processes send on their own timers. Never throws.
 */
export function waitUntilCurrentRequest(promise: Promise<unknown>): void {
  try {
    currentRequestContext()?.waitUntil?.(promise)
  } catch {
    // Telemetry must never break the caller.
  }
}
