import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import superjson from 'superjson'

import { env } from '~/env'
import type { AppRouter } from '~/server/api/root'

export const transformer = superjson

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL
  return `http://localhost:${env.PORT ?? 3000}`
}

export function getUrl() {
  return `${getBaseUrl()}/api/trpc`
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>
