/**
 * Dashboard Application Service - Router
 *
 * tRPC router for dashboard data aggregation.
 * This is a protected procedure as dashboard data requires authentication.
 */

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { DashboardService } from '~/server/application/dashboard/dashboard.service'
import { db } from '~/server/infrastructure/database'

const dashboardService = new DashboardService(db)

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
