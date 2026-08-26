/**
 * Messaging Domain - Router
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { getWhatsAppOutbound } from '~/server/application/messaging'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { messagingService } from '~/server/domains/messaging'
import {
  broadcastUpdateSchema,
  createPairingTokenSchema,
  getConversationSchema,
  revokeIdentitySchema,
  sendHouseholdMessageSchema,
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
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return messagingService.revokeIdentity(ctx.authz, input.identityId, weddingId)
    }),

  // ── WhatsApp guest channel ─────────────────────────────────────────────────

  getWhatsAppStatus: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return messagingService.getWhatsAppStatus(ctx.authz, weddingId)
  }),

  assignWhatsAppNumber: protectedProcedure.mutation(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return messagingService.assignWhatsAppNumber(ctx.authz, weddingId)
  }),

  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return messagingService.listHouseholdConversations(ctx.authz, weddingId)
  }),

  getConversation: protectedProcedure.input(getConversationSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return messagingService.getConversationMessages(ctx.authz, weddingId, input.identityId)
  }),

  sendHouseholdMessage: protectedProcedure
    .input(sendHouseholdMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return getWhatsAppOutbound().sendToHousehold(ctx.authz, {
        weddingId,
        householdId: input.householdId,
        message: input.message,
      })
    }),

  broadcastUpdate: protectedProcedure
    .input(broadcastUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return getWhatsAppOutbound().broadcast(ctx.authz, {
        weddingId,
        message: input.message,
      })
    }),
})
