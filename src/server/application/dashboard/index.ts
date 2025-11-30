/**
 * Dashboard Application Service - Barrel Export
 *
 * Exports all dashboard application service components.
 */

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

// Create singleton instance with all required repositories
export const dashboardService = new DashboardService(
  new HouseholdRepository(db),
  new InvitationRepository(db),
  new EventRepository(db),
  new UserRepository(db),
  new WebsiteRepository(db),
  new GuestRepository(db),
  new QuestionRepository(db),
  new WeddingRepository(db)
)

// Export types
export type {
  Answer,
  DashboardData,
  EventWithStats,
  GuestResponses,
  HouseholdWithGuests,
  QuestionWithRecentAnswer,
  WebsiteWithQuestions,
  WeddingData,
  WeddingDate,
} from '~/server/application/dashboard/dashboard.types'

// Re-export domain types for convenience
export type { GuestWithInvitations } from '~/server/domains/guest'

// Export classes for testing/DI
export { DashboardService } from '~/server/application/dashboard/dashboard.service'

// Export router
export { dashboardRouter } from '~/server/application/dashboard/dashboard.router'
