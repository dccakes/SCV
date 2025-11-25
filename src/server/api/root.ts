// Domain routers (Phase 1-3 - migrated to domain architecture)
// Legacy routers (to be migrated in Phase 4)
import { dashboardRouter } from '~/server/api/routers/dashboard'
import { createTRPCRouter } from '~/server/api/trpc'
import { eventRouter } from '~/server/domains/event'
import { giftRouter } from '~/server/domains/gift'
import { guestRouter } from '~/server/domains/guest'
import { householdRouter } from '~/server/domains/household'
import { invitationRouter } from '~/server/domains/invitation'
import { questionRouter } from '~/server/domains/question'
import { userRouter } from '~/server/domains/user'
import { websiteRouter } from '~/server/domains/website'

/**
 * This is the primary router for your server.
 *
 * Domain Architecture Migration Status:
 * - Phase 1 (Complete): user, website, event
 * - Phase 2 (Complete): gift, guest, invitation
 * - Phase 3 (Complete): question, household
 * - Phase 4 (Pending): Application Services (dashboard, rsvp-submission, household-management)
 */
export const appRouter = createTRPCRouter({
  // Phase 1 domains (migrated)
  user: userRouter,
  website: websiteRouter,
  event: eventRouter,

  // Phase 2 domains (migrated)
  gift: giftRouter,
  guest: guestRouter,
  invitation: invitationRouter,

  // Phase 3 domains (migrated)
  question: questionRouter,
  household: householdRouter,

  // Legacy routers (to be migrated in Phase 4)
  dashboard: dashboardRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
