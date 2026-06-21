import { z } from 'zod'
import { env } from '~/env'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { HouseholdInviteService } from '~/server/application/household-invite/household-invite.service'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { db } from '~/server/db'

export const householdInviteService = new HouseholdInviteService(db)

const getTrustedBaseUrl = (headers: Headers) => {
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL

  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  if (host) {
    const protocol = headers.get('x-forwarded-proto') ?? 'http'
    return `${protocol}://${host}`
  }

  const origin = headers.get('origin')
  if (origin) return origin

  return 'http://localhost:3000'
}

export const householdInviteRouter = createTRPCRouter({
  generateLink: protectedProcedure
    .input(
      z.object({
        householdId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return householdInviteService.generateInviteLink(ctx.authz, weddingId, {
        householdId: input.householdId,
        baseUrl: getTrustedBaseUrl(ctx.headers),
      })
    }),
})
