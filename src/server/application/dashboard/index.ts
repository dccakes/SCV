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
  GuestWithInvitations,
  HouseholdWithGuests,
  QuestionWithRecentAnswer,
  WebsiteWithQuestions,
  WeddingData,
  WeddingDate,
} from '~/server/application/dashboard/dashboard.types'

// Export classes for testing/DI
export { DashboardService } from '~/server/application/dashboard/dashboard.service'

// Export router
export { dashboardRouter } from '~/server/application/dashboard/dashboard.router'
