import { dashboardRouter } from '~/server/api/routers/dashboard'
import { eventRouter } from '~/server/api/routers/event'
import { giftRouter } from '~/server/api/routers/gift'
import { guestRouter } from '~/server/api/routers/guest'
import { householdRouter } from '~/server/api/routers/household'
import { invitationRouter } from '~/server/api/routers/invitation'
import { questionRouter } from '~/server/api/routers/question'
import { userRouter } from '~/server/api/routers/user'
import { websiteRouter } from '~/server/api/routers/website'
import { createTRPCRouter } from '~/server/api/trpc'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  website: websiteRouter,
  dashboard: dashboardRouter,
  guest: guestRouter,
  event: eventRouter,
  invitation: invitationRouter,
  user: userRouter,
  household: householdRouter,
  gift: giftRouter,
  question: questionRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
