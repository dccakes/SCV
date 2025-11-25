// Domain routers (Phase 1 - migrated to domain architecture)
// Legacy routers (to be migrated in future phases)
import { dashboardRouter } from '~/server/api/routers/dashboard'
import { giftRouter } from '~/server/api/routers/gift'
import { guestRouter } from '~/server/api/routers/guest'
import { householdRouter } from '~/server/api/routers/household'
import { invitationRouter } from '~/server/api/routers/invitation'
import { questionRouter } from '~/server/api/routers/question'
import { createTRPCRouter } from '~/server/api/trpc'
import { eventRouter } from '~/server/domains/event'
import { userRouter } from '~/server/domains/user'
import { websiteRouter } from '~/server/domains/website'

/**
 * This is the primary router for your server.
 *
 * Domain Architecture Migration Status:
 * - Phase 1 (Complete): user, website, event
 * - Phase 2 (Pending): gift, guest, invitation
 * - Phase 3 (Pending): question, household
 * - Phase 4 (Pending): Application Services (dashboard, rsvp-submission, household-management)
 */
export const appRouter = createTRPCRouter({
  // Phase 1 domains (migrated)
  user: userRouter,
  website: websiteRouter,
  event: eventRouter,

  // Legacy routers (to be migrated)
  dashboard: dashboardRouter,
  guest: guestRouter,
  invitation: invitationRouter,
  household: householdRouter,
  gift: giftRouter,
  question: questionRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
