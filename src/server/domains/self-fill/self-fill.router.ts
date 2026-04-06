/**
 * Self-Fill Domain - Router Factory
 *
 * tRPC router for self-fill guest registration endpoints.
 * Token management delegates to SelfFillService (domain).
 * Guest registration delegates to ISelfFillRegistration (injected — implemented by application layer).
 *
 * The router is a factory to avoid importing application services from the domain layer.
 * Usage:  createSelfFillRouter(selfFillRegistrationService)
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import { selfFillService } from '~/server/domains/self-fill'
import type { ISelfFillRegistration } from '~/server/domains/self-fill/self-fill.types'
import {
  generateTokenSchema,
  getByTokenSchema,
  revokeTokenSchema,
  selfFillGuestSchema,
} from '~/server/domains/self-fill/self-fill.validator'
import { weddingService } from '~/server/domains/wedding'

/**
 * Fetch the active wedding from workspace scope.
 * Throws NOT_FOUND if the active wedding no longer exists.
 */
async function getActiveWedding(activeWeddingId: string) {
  const wedding = await weddingService.getById(activeWeddingId)
  if (!wedding) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Wedding not found',
    })
  }
  return wedding
}

function assertCanManageSelfFill(ctx: AuthzContext) {
  requirePermission(ctx, { guest_invitation: ['send'] })
}

/**
 * Create the self-fill tRPC router.
 * @param registrationService - Application service implementing ISelfFillRegistration.
 *   Injected at root.ts to keep the domain free of application-layer imports.
 */
export function createSelfFillRouter(registrationService: ISelfFillRegistration) {
  return createTRPCRouter({
    /**
     * Get wedding data by self-fill token (public)
     * Used by the self-fill registration form
     */
    getByToken: publicProcedure.input(getByTokenSchema).query(async ({ input }) => {
      return selfFillService.getWeddingByToken(input.token)
    }),

    /**
     * Register a guest via self-fill form (public)
     * Delegates to ISelfFillRegistration for cross-domain orchestration.
     */
    registerGuest: publicProcedure.input(selfFillGuestSchema).mutation(async ({ input }) => {
      return registrationService.registerGuest(input.token, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        address1: input.address1 ?? null,
        address2: input.address2 ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        country: input.country ?? null,
      })
    }),

    /**
     * Generate a new self-fill token (protected)
     * Requires outbound invite permission.
     */
    generateToken: protectedProcedure.input(generateTokenSchema).mutation(async ({ ctx }) => {
      assertCanManageSelfFill(ctx.authz)
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      const wedding = await getActiveWedding(weddingId)
      const token = await selfFillService.generateToken(wedding.id)
      return { token }
    }),

    /**
     * Revoke the self-fill token (protected)
     * Disables the self-fill registration link.
     */
    revokeToken: protectedProcedure.input(revokeTokenSchema).mutation(async ({ ctx }) => {
      assertCanManageSelfFill(ctx.authz)
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      const wedding = await getActiveWedding(weddingId)
      await selfFillService.revokeToken(wedding.id)
      return { success: true }
    }),

    /**
     * Get the current self-fill token (protected)
     * Returns null token if no token is set.
     * Also returns expiresAt (null for legacy tokens with no timestamp) and
     * earliestEventDate so the UI can warn if the link expires before the wedding.
     */
    getToken: protectedProcedure.query(async ({ ctx }) => {
      assertCanManageSelfFill(ctx.authz)
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      const wedding = await getActiveWedding(weddingId)
      return selfFillService.getTokenWithContext(wedding.id)
    }),
  })
}
