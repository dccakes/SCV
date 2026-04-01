/**
 * Gmail Domain - Router
 *
 * tRPC router for Gmail integration endpoints.
 * All endpoints are protected — Gmail data is private to the user.
 *
 * Messages are read from local CommunicationMessage storage (not Gmail API).
 * Sync operations fetch from Gmail and store locally.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { gmailService } from '~/server/domains/gmail'
import {
  gmailCreateDraftSchema,
  gmailGetThreadSchema,
  gmailListMessagesSchema,
  gmailSyncForVendorSchema,
} from '~/server/domains/gmail/gmail.validator'

export const gmailRouter = createTRPCRouter({
  /**
   * Get Gmail connection status for the current user.
   */
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    return gmailService.getConnection(ctx.auth.userId)
  }),

  /**
   * Generate Google OAuth URL for connecting Gmail.
   */
  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    return { url: gmailService.getAuthUrl(ctx.auth.userId) }
  }),

  /**
   * Disconnect Gmail integration.
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await gmailService.disconnect(ctx.auth.userId)
    return { success: true }
  }),

  /**
   * Trigger a full sync of vendor emails from Gmail.
   */
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    return gmailService.syncAllVendorEmails(ctx.auth.userId)
  }),

  /**
   * Trigger sync for a specific vendor.
   */
  syncForVendor: protectedProcedure
    .input(gmailSyncForVendorSchema)
    .mutation(async ({ ctx, input }) => {
      return gmailService.syncForVendor(ctx.auth.userId, input.vendorId)
    }),

  /**
   * List messages from local storage (vendor-filtered).
   */
  listMessages: protectedProcedure.input(gmailListMessagesSchema).query(async ({ ctx, input }) => {
    return gmailService.listMessages(ctx.auth.userId, {
      vendorId: input.vendorId,
      limit: input.limit,
      offset: input.offset,
    })
  }),

  /**
   * Get a full thread from local storage.
   */
  getThread: protectedProcedure.input(gmailGetThreadSchema).query(async ({ ctx, input }) => {
    return gmailService.getThread(ctx.auth.userId, input.threadId)
  }),

  /**
   * Create a draft reply in the user's Gmail.
   */
  createDraft: protectedProcedure
    .input(gmailCreateDraftSchema)
    .mutation(async ({ ctx, input }) => {
      const draftId = await gmailService.createDraft(ctx.auth.userId, input)
      return { draftId }
    }),
})
