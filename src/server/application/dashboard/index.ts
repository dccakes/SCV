/**
 * Dashboard Application Service - Barrel Export
 *
 * Exports all dashboard application service components.
 */

import { DashboardService } from '~/server/application/dashboard/dashboard.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instance
export const dashboardService = new DashboardService(db)

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
