/**
 * Dashboard Application Service - Router
 *
 * tRPC router for dashboard data aggregation.
 * This is a protected procedure as dashboard data requires authentication.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { dashboardOverviewUseCase } from '~/server/application/dashboard/dashboard.wiring'

export const dashboardRouter = createTRPCRouter({
  getForActiveWorkspace: protectedProcedure.query(async ({ ctx }) => {
    return dashboardOverviewUseCase.execute({
      userId: ctx.auth.userId,
      authz: ctx.authz,
      activeWeddingId: ctx.auth.activeWeddingId,
    })
  }),
})
