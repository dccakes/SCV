/**
 * Dashboard Application Service - Barrel Export
 *
 * Exports all dashboard application service components.
 */

// Export router
export { dashboardRouter } from '~/server/application/dashboard/dashboard.router'
// Export classes for testing/DI
export { DashboardService } from '~/server/application/dashboard/dashboard.service'
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
export {
  dashboardOverviewUseCase,
  dashboardService,
} from '~/server/application/dashboard/dashboard.wiring'
// Re-export domain types for convenience
export type { GuestWithInvitations } from '~/server/domains/guest'
