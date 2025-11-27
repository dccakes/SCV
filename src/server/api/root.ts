// Domain routers (Phase 1-3 - migrated to domain architecture)
import { createTRPCRouter } from '~/server/api/trpc'
import {
  dashboardRouter,
  householdManagementRouter,
  rsvpSubmissionRouter,
} from '~/server/application'
import { eventRouter } from '~/server/domains/event'
import { giftRouter } from '~/server/domains/gift'
import { guestRouter } from '~/server/domains/guest'
import { guestTagRouter } from '~/server/domains/guest-tag'
import { householdRouter } from '~/server/domains/household'
import { invitationRouter } from '~/server/domains/invitation'
import { questionRouter } from '~/server/domains/question'
import { userRouter } from '~/server/domains/user'
import { websiteRouter } from '~/server/domains/website'
import { weddingRouter } from '~/server/domains/wedding'

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

  // Phase 4 application services (migrated)
  dashboard: dashboardRouter,
  householdManagement: householdManagementRouter,
  rsvpSubmission: rsvpSubmissionRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
