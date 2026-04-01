import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import { appRouter } from '~/server/api/root'
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc'

/**
 * Creates a tRPC context for RSC calls, cached per request so multiple
 * tRPC calls in the same render share a single context (and single DB lookup).
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers())
  heads.set('x-trpc-source', 'rsc')
  return createTRPCContext({ headers: heads })
})

const createCaller = createCallerFactory(appRouter)

/**
 * Server-side tRPC caller for React Server Components.
 * Calls procedures directly in-process — no HTTP round-trip.
 */
export const api = createCaller(createContext)
