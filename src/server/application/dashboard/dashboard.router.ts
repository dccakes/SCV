/**
 * Dashboard Application Service - Router
 *
 * tRPC router for dashboard data aggregation.
 * This is a protected procedure as dashboard data requires authentication.
 */

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { DashboardService } from '~/server/application/dashboard/dashboard.service'
import { EventRepository } from '~/server/domains/event/event.repository'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { QuestionRepository } from '~/server/domains/question/question.repository'
import { UserRepository } from '~/server/domains/user/user.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { db } from '~/server/infrastructure/database'

// Initialize repositories
const householdRepo = new HouseholdRepository(db)
const invitationRepo = new InvitationRepository(db)
const eventRepo = new EventRepository(db)
const userRepo = new UserRepository(db)
const websiteRepo = new WebsiteRepository(db)
const guestRepo = new GuestRepository(db)
const questionRepo = new QuestionRepository(db)
const weddingRepo = new WeddingRepository(db)

// Initialize service with all repositories
const dashboardService = new DashboardService(
  householdRepo,
  invitationRepo,
  eventRepo,
  userRepo,
  websiteRepo,
  guestRepo,
  questionRepo,
  weddingRepo
)

export const dashboardRouter = createTRPCRouter({
  /**
   * Get dashboard overview data for the authenticated user
   *
   * Note: Uses publicProcedure to match existing behavior where
   * the procedure handles null userId internally. This allows the
   * dashboard to gracefully handle unauthenticated states.
   */
  getByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) {
      return null
    }
    return dashboardService.getOverview(ctx.auth.userId)
  }),
})
