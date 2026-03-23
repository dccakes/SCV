/**
 * RSVP Submission Application Service - Router
 *
 * tRPC router for authenticated RSVP management submission.
 * Public RSVP token flow is handled by website router.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { submitRsvpSchema } from '~/server/application/rsvp-submission/rsvp-submission.validator'
import { toAuthzContext } from '~/server/authz/authorization.types'
import { weddingService } from '~/server/domains/wedding'
import { db } from '~/server/infrastructure/database'

const rsvpSubmissionService = new RsvpSubmissionService(db)

export const rsvpSubmissionRouter = createTRPCRouter({
  /**
   * Submit RSVP form responses
   *
   * This is a public procedure because:
   * - Guests access this from the public wedding website
   * - Authentication is not required for RSVP submission
   * - The household/guest IDs provide sufficient authorization
   */
  submit: protectedProcedure.input(submitRsvpSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.sessionActiveOrganizationId
    )
    return rsvpSubmissionService.submitManagedRsvp(toAuthzContext(ctx), weddingId, input)
  }),
})
