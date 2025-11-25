/**
 * RSVP Submission Application Service - Router
 *
 * tRPC router for guest-facing RSVP submission.
 * This is a public procedure as guests don't need to be authenticated.
 */

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { submitRsvpSchema } from '~/server/application/rsvp-submission/rsvp-submission.validator'
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
  submit: publicProcedure.input(submitRsvpSchema).mutation(async ({ input }) => {
    return rsvpSubmissionService.submitRsvp(input)
  }),
})
