/**
 * Dashboard Application Service - Wiring
 *
 * Single place that builds the dashboard service and use case. The router
 * imports this file directly (not the barrel) to avoid circular imports, see
 * src/server/api/root.ts.
 */

import { DashboardService } from '~/server/application/dashboard/dashboard.service'
import { DashboardOverviewUseCase } from '~/server/application/dashboard/dashboard-overview.use-case'
import { EventRepository } from '~/server/domains/event/event.repository'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { MilestoneRepository } from '~/server/domains/milestone/milestone.repository'
import { QuestionRepository } from '~/server/domains/question/question.repository'
import { TaskRepository } from '~/server/domains/task/task.repository'
import { UserRepository } from '~/server/domains/user/user.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { db } from '~/server/infrastructure/database'

// Create singleton instance with all required repositories
export const dashboardService = new DashboardService(
  new HouseholdRepository(db),
  new InvitationRepository(db),
  new EventRepository(db),
  new UserRepository(db),
  new WebsiteRepository(db),
  new GuestRepository(db),
  new QuestionRepository(db),
  new WeddingRepository(db),
  new TaskRepository(db),
  new MilestoneRepository(db)
)

export const dashboardOverviewUseCase = new DashboardOverviewUseCase(dashboardService)
