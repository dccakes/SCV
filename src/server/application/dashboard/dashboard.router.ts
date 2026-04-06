/**
 * Dashboard Application Service - Router
 *
 * tRPC router for dashboard data aggregation.
 * This is a protected procedure as dashboard data requires authentication.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { DashboardService } from '~/server/application/dashboard/dashboard.service'
import { DashboardOverviewUseCase } from '~/server/application/dashboard/dashboard-overview.use-case'
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
const dashboardOverviewUseCase = new DashboardOverviewUseCase(dashboardService)

export const dashboardRouter = createTRPCRouter({
  getForActiveWorkspace: protectedProcedure.query(async ({ ctx }) => {
    return dashboardOverviewUseCase.execute({
      userId: ctx.auth.userId,
      authz: ctx.authz,
      activeWeddingId: ctx.auth.activeWeddingId,
    })
  }),
})
