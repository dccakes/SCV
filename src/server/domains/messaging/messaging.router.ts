/**
 * Messaging Domain - Router
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { messagingService } from '~/server/domains/messaging'
import {
  createPairingTokenSchema,
  revokeIdentitySchema,
} from '~/server/domains/messaging/messaging.validator'

export const messagingRouter = createTRPCRouter({
  createPairingToken: protectedProcedure
    .input(createPairingTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return messagingService.createPairingToken(ctx.authz, weddingId, input.channel)
    }),

  listLinkedChats: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return messagingService.listLinkedChats(ctx.authz, weddingId)
  }),

  revokeIdentity: protectedProcedure
    .input(revokeIdentitySchema)
    .mutation(async ({ ctx, input }) => {
      return messagingService.revokeIdentity(ctx.authz, input.identityId)
    }),
})
