/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { auth } from '~/lib/auth'
import type { ActiveOrganization, AuthzContext } from '~/server/authz/authorization.types'
import { db } from '~/server/db'

const getSessionActiveOrganizationId = (session: unknown): string | null => {
  if (!session || typeof session !== 'object') {
    return null
  }

  const sessionRecord =
    'session' in session && typeof session.session === 'object' && session.session !== null
      ? (session.session as Record<string, unknown>)
      : null

  if (!sessionRecord) {
    return null
  }

  const activeOrganizationId = sessionRecord.activeOrganizationId
  if (typeof activeOrganizationId === 'string' && activeOrganizationId.length > 0) {
    return activeOrganizationId
  }

  const activeOrganization =
    typeof sessionRecord.activeOrganization === 'object' &&
    sessionRecord.activeOrganization !== null
      ? (sessionRecord.activeOrganization as Record<string, unknown>)
      : null

  const nestedOrganizationId = activeOrganization?.id
  if (typeof nestedOrganizationId === 'string' && nestedOrganizationId.length > 0) {
    return nestedOrganizationId
  }

  return null
}

const fetchActiveMember = async (
  userId: string,
  organizationId: string
): Promise<ActiveOrganization | null> => {
  const rows = await db.$queryRaw<Array<{ role: string }>>`
    SELECT "role"
    FROM "member"
    WHERE "userId" = ${userId}
      AND "organizationId" = ${organizationId}
    LIMIT 1
  `

  const row = rows[0]
  if (!row) return null

  return { organizationId, role: row.role }
}

/**
 * If the session has no active organization, find the user's first member row and
 * write it back to the session so subsequent requests don't need to repeat this.
 * Covers: existing users migrated via backfill, and new users who create an org
 * programmatically (not via the Better Auth API route which sets it automatically).
 */
const autoActivateFirstOrganization = async (
  userId: string,
  sessionToken: string | null
): Promise<ActiveOrganization | null> => {
  const rows = await db.$queryRaw<Array<{ organizationId: string; role: string }>>`
    SELECT "organizationId", "role"
    FROM "member"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" ASC
    LIMIT 1
  `

  const row = rows[0]
  if (!row) return null

  if (sessionToken) {
    await db.$executeRaw`
      UPDATE "session"
      SET "activeOrganizationId" = ${row.organizationId}
      WHERE "token" = ${sessionToken}
        AND ("activeOrganizationId" IS NULL OR "activeOrganizationId" != ${row.organizationId})
    `
  }

  return { organizationId: row.organizationId, role: row.role }
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  })

  const userId = session?.user?.id ?? null
  const sessionActiveOrganizationId = getSessionActiveOrganizationId(session)

  const sessionToken =
    session && typeof session === 'object' && 'session' in session
      ? ((session.session as Record<string, unknown>)?.token as string | null) ?? null
      : null

  const activeOrganization: ActiveOrganization | null = userId
    ? sessionActiveOrganizationId
      ? await fetchActiveMember(userId, sessionActiveOrganizationId)
      : await autoActivateFirstOrganization(userId, sessionToken)
    : null

  return {
    db,
    auth: {
      userId,
      session: session,
      activeOrganization,
    },
    ...opts,
  }
}

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  const authz: AuthzContext = {
    userId: ctx.auth.userId,
    activeOrganization: ctx.auth.activeOrganization,
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      auth: { ...ctx.auth, userId: ctx.auth.userId },
      authz,
    },
  })
})
