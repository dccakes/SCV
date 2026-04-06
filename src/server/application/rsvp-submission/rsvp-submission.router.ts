/**
 * RSVP Submission Application Service - Router
 *
 * tRPC router for authenticated RSVP management submission.
 * Public RSVP token flow is handled by website router.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { submitRsvpSchema } from '~/server/application/rsvp-submission/rsvp-submission.validator'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { db } from '~/server/infrastructure/database'

const rsvpSubmissionService = new RsvpSubmissionService(db)

export const rsvpSubmissionRouter = createTRPCRouter({
  /**
   * Submit RSVP form responses on behalf of a guest (authenticated coordinator flow).
   * Guest-facing public RSVP is handled by website.router submitPublicRsvpForm.
   */
  submit: protectedProcedure.input(submitRsvpSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return rsvpSubmissionService.submitManagedRsvp(ctx.authz, weddingId, input)
  }),
})
