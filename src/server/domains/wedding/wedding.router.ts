/**
 * Wedding Domain - Router
 *
 * tRPC router for wedding-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'
import { organizationRoles } from '~/lib/auth-permissions'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import type { PermissionInput } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import { eventService } from '~/server/domains/event'
import { weddingService } from '~/server/domains/wedding'
import {
  createWeddingSchema,
  updateWeddingDetailsSchema,
  updateWeddingSchema,
} from '~/server/domains/wedding/wedding.validator'

const readWorkspaceCapabilities = (role: string | null | undefined) => {
  const roleKey = role as keyof typeof organizationRoles
  if (!role || !(roleKey in organizationRoles)) {
    return {
      canInviteMembers: false,
      canManageMembers: false,
      canSendInvites: false,
      canViewPlanning: false,
    }
  }

  type AuthorizeCallable = { authorize: (permissions: PermissionInput) => { success: boolean } }
  const authorize = (organizationRoles[roleKey] as unknown as AuthorizeCallable).authorize
  const can = (permissions: PermissionInput) => authorize(permissions).success

  return {
    canInviteMembers: can({ invitation: ['create'] }),
    canManageMembers: can({ member: ['update'] }),
    canSendInvites: can({ guest_invitation: ['send'] }),
    canViewPlanning: can({ wedding: ['read'] }),
  }
}

export const weddingRouter = createTRPCRouter({
  /**
   * Create a new wedding (onboarding)
   * Creates wedding, UserWedding join entry, optional event, and updates user profile
   */
  create: protectedProcedure.input(createWeddingSchema).mutation(async ({ ctx, input }) => {
    return weddingService.createWedding(ctx.auth.userId, {
      userId: ctx.auth.userId,
      ...input,
    })
  }),

  /**
   * Update wedding settings
   */
  update: protectedProcedure.input(updateWeddingSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

    return weddingService.updateWedding({
      ctx: ctx.authz,
      weddingId,
      data: input,
    })
  }),

  /**
   * Get wedding details for settings page (names + first event date/location)
   */
  getDetails: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx.authz, { wedding: ['read'] })
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    const wedding = await weddingService.getById(weddingId)
    if (!wedding) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Wedding not found' })
    }

    // TODO(review-quality): replace first-event fallback with explicit ceremony/primary-event lookup.
    const events = await eventService.getWeddingEvents(wedding.id)
    const primaryEvent = events?.[0]
    return {
      groomFirstName: wedding.groomFirstName,
      groomLastName: wedding.groomLastName,
      brideFirstName: wedding.brideFirstName,
      brideLastName: wedding.brideLastName,
      weddingDate: primaryEvent?.date?.toISOString() ?? undefined,
      weddingLocation: primaryEvent?.venue ?? undefined,
      primaryEventId: primaryEvent?.id ?? undefined,
    }
  }),

  /**
   * Update wedding couple names from settings page
   */
  updateDetails: protectedProcedure
    .input(updateWeddingDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

      // Update wedding names
      await weddingService.updateWedding({
        ctx: ctx.authz,
        weddingId,
        data: {
          groomFirstName: input.groomFirstName,
          groomLastName: input.groomLastName,
          brideFirstName: input.brideFirstName,
          brideLastName: input.brideLastName,
        },
      })

      return { success: true }
    }),

  /**
   * Get wedding for current user
   */
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.getByUserId(ctx.auth.userId)
  }),

  /**
   * Get wedding for current active workspace scope
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx.authz, { wedding: ['read'] })
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    const wedding = await weddingService.getById(weddingId)
    if (!wedding) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Wedding not found' })
    }
    return wedding
  }),

  /**
   * Check if current user has a wedding
   */
  hasWedding: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.hasWedding(ctx.auth.userId)
  }),

  /**
   * Canonical workspace payload for client-side role/capability display.
   */
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    return {
      organizationId: ctx.auth.activeOrganization?.organizationId ?? null,
      weddingId: ctx.auth.activeWeddingId ?? null,
      role: ctx.auth.activeOrganization?.role ?? null,
      capabilities: readWorkspaceCapabilities(ctx.auth.activeOrganization?.role),
    }
  }),
})
