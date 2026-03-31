// Domain routers (Phase 1-3 - migrated to domain architecture)
// NOTE: routers are imported directly from their router files (not domain barrels)
// to avoid circular module dependencies that cause TDZ errors in the compiled bundle.
import { createTRPCRouter } from '~/server/api/trpc'
import { dashboardRouter } from '~/server/application/dashboard/dashboard.router'
import { rsvpSubmissionRouter } from '~/server/application/rsvp-submission/rsvp-submission.router'
import { selfFillRegistrationService } from '~/server/application/self-fill-registration'
import { eventRouter } from '~/server/domains/event/event.router'
import { giftRouter } from '~/server/domains/gift/gift.router'
import { guestRouter } from '~/server/domains/guest/guest.router'
import { guestTagRouter } from '~/server/domains/guest-tag/guest-tag.router'
import { householdRouter } from '~/server/domains/household/household.router'
import { invitationRouter } from '~/server/domains/invitation/invitation.router'
import { questionRouter } from '~/server/domains/question/question.router'
import { createSelfFillRouter } from '~/server/domains/self-fill'
import { userRouter } from '~/server/domains/user/user.router'
import { gmailRouter } from '~/server/domains/gmail/gmail.router'
import { vendorRouter } from '~/server/domains/vendor/vendor.router'
import { websiteRouter } from '~/server/domains/website/website.router'
import { weddingRouter } from '~/server/domains/wedding/wedding.router'

/**
 * This is the primary router for your server.
 *
 * Domain Architecture Migration Status:
 * - Phase 1 (Complete): user, website, event
 * - Phase 2 (Complete): gift, guest, invitation
 * - Phase 3 (Complete): question, household
 * - Phase 4 (Complete): Application Services (dashboard, rsvp-submission, household-management)
 */
export const appRouter = createTRPCRouter({
  // Core domain (new architecture)
  wedding: weddingRouter,

  // Phase 1 domains (migrated)
  user: userRouter,
  website: websiteRouter,
  event: eventRouter,

  // Phase 2 domains (migrated)
  gift: giftRouter,
  guest: guestRouter,
  guestTag: guestTagRouter,
  invitation: invitationRouter,

  // Phase 3 domains (migrated)
  question: questionRouter,
  household: householdRouter,

  // Self-fill guest registration (router created with injected application service)
  selfFill: createSelfFillRouter(selfFillRegistrationService),

  // Phase 4 application services (migrated)
  dashboard: dashboardRouter,
  rsvpSubmission: rsvpSubmissionRouter,

  // Phase 5 add-on domains
  vendor: vendorRouter,

  // Phase 6 integrations
  gmail: gmailRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
