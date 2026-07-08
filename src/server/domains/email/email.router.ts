/**
 * Email Domain - Router
 *
 * Couple-facing surface: provision the wedding inbox, browse threaded
 * conversations, and send replies. Inbound ingestion happens in the Resend
 * webhook, not here.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { emailService } from '~/server/domains/email'
import { getThreadSchema, sendReplySchema } from '~/server/domains/email/email.validator'

export const emailRouter = createTRPCRouter({
  getInbox: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return emailService.getInbox(ctx.authz, weddingId)
  }),

  provisionInbox: protectedProcedure.mutation(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return emailService.provisionInbox(ctx.authz, weddingId)
  }),

  listThreads: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return emailService.listThreads(ctx.authz, weddingId)
  }),

  getThread: protectedProcedure.input(getThreadSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return emailService.getThread(ctx.authz, weddingId, input.threadId)
  }),

  sendReply: protectedProcedure.input(sendReplySchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return emailService.sendReply(ctx.authz, weddingId, input)
  }),
})
