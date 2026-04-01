/**
 * Household Management Application Service
 *
 * Orchestrates complex household operations that span multiple domains:
 * - Household domain (core household data)
 * - Guest domain (guest creation/updates)
 * - Invitation domain (invitation creation/updates)
 * - Gift domain (gift tracking)
 * - Guest tags (tag assignments)
 *
 * This service handles cross-domain coordination using repositories directly
 * for efficient orchestration and transactional control.
 */

// biome-ignore lint/style/noRestrictedImports: architectural violation, tracked in ARCHITECTURAL_VIOLATIONS.md
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type {
  CreateHouseholdResult,
  CreateHouseholdWithGuestsInput,
  UpdateHouseholdResult,
  UpdateHouseholdWithGuestsInput,
} from '~/server/application/household-management/household-management.types'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { GiftRepository } from '~/server/domains/gift/gift.repository'
import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import type { HouseholdSearchResult } from '~/server/domains/household/household.types'
import type { InvitationRepository } from '~/server/domains/invitation/invitation.repository'

export class HouseholdManagementService {
  constructor(
    private householdRepo: HouseholdRepository,
    private guestRepo: GuestRepository,
    private invitationRepo: InvitationRepository,
    _giftRepo: GiftRepository,
    private db: PrismaClient // For guestTagAssignment operations until we create a repository
  ) {}

  /**
   * Create a household with guests and auto-create invitations for all events
   *
   * Orchestration flow:
   * 1. Extract event IDs from guest invitations
   * 2. Create household with gifts for each event
   * 3. Create guests with their invitations
   * 4. Create guest tag assignments
   * 5. Return complete household data
   *
   * Wrapped in a transaction to ensure household + guests + invitations are created atomically.
   */
  async createHouseholdWithGuests(
    ctx: AuthzContext,
    weddingId: string,
    data: CreateHouseholdWithGuestsInput
  ): Promise<CreateHouseholdResult> {
    requirePermission(ctx, { guest: ['create'] })
    await this.assertEventIdsInWeddingScope(
      data.guestParty.flatMap((guest) => Object.keys(guest.invites)),
      weddingId
    )

    return this.db.$transaction(async (tx) => {
      // Extract event IDs from the first guest's invites
      const eventIds = Object.keys(data.guestParty[0]?.invites ?? {})

      // 1. Create household with gifts for each event
      const household = await tx.household.create({
        data: {
          weddingId,
          address1: data.address1,
          address2: data.address2,
          city: data.city,
          state: data.state,
          country: data.country,
          zipCode: data.zipCode,
          notes: data.notes,
          gifts: {
            createMany: {
              data: eventIds.map((eventId) => ({
                eventId,
                thankyou: false,
              })),
            },
          },
        },
        include: {
          guests: {
            include: {
              invitations: true,
              guestTagAssignments: { select: { guestTagId: true } },
            },
          },
          gifts: {
            include: { event: { select: { name: true } } },
          },
        },
      })

      if (!household) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create household',
        })
      }

      // 2. Create guests with their invitations and tags
      const guests = await Promise.all(
        data.guestParty.map(async (guest, index) => {
          const isTagAlong = guest.isTagAlong ?? false
          const invitations = Object.entries(guest.invites).map(([eventId, rsvp]) => ({
            eventId,
            rsvp,
            weddingId,
          }))
          const tagIds = guest.tagIds ?? []

          const newGuest = await tx.guest.create({
            data: {
              firstName: guest.firstName,
              lastName: guest.lastName,
              email: guest.email ?? null,
              phone: guest.phone ?? null,
              weddingId,
              householdId: household.id,
              isPrimaryContact: isTagAlong ? false : (guest.isPrimaryContact ?? index === 0),
              ageGroup: guest.ageGroup ?? null,
              isTagAlong,
              invitations:
                invitations.length > 0 ? { createMany: { data: invitations } } : undefined,
              guestTagAssignments:
                tagIds.length > 0
                  ? { createMany: { data: tagIds.map((tagId) => ({ guestTagId: tagId })) } }
                  : undefined,
            },
          })

          // Refetch guest with tag assignments to include in response
          const guestWithTags = await tx.guest.findUnique({
            where: { id: newGuest.id },
            include: {
              invitations: true,
              guestTagAssignments: { select: { guestTagId: true } },
            },
          })

          if (!guestWithTags) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to refetch guest after creation',
            })
          }

          return guestWithTags
        })
      )

      if (!guests.length) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create guests',
        })
      }

      return {
        household,
        guests,
      }
    })
  }

  /**
   * Update a household with guests, invitations, and gifts
   *
   * Orchestration flow:
   * 1. Update household details
   * 2. Delete removed guests
   * 3. Clear all primary contact flags in household
   * 4. Upsert guests (creates new, updates existing)
   * 5. Update invitations
   * 6. Update guest tag assignments
   * 7. Upsert gifts
   *
   * Wrapped in a transaction to ensure all updates are atomic.
   */
  async updateHouseholdWithGuests(
    ctx: AuthzContext,
    weddingId: string,
    data: UpdateHouseholdWithGuestsInput
  ): Promise<UpdateHouseholdResult> {
    requirePermission(ctx, { guest: ['update'] })
    await this.assertHouseholdInWeddingScope(data.householdId, weddingId)
    await this.assertGuestIdsInWeddingScope(
      data.guestParty.flatMap((guest) => (guest.guestId ? [guest.guestId] : [])),
      weddingId
    )
    await this.assertGuestIdsInWeddingScope(data.deletedGuests ?? [], weddingId)
    await this.assertEventIdsInWeddingScope(
      [
        ...data.guestParty.flatMap((guest) => Object.keys(guest.invites)),
        ...data.gifts.map((gift) => gift.eventId),
      ],
      weddingId
    )

    return this.db.$transaction(async (tx) => {
      // 1. Update household details
      const updatedHousehold = await tx.household.update({
        where: { id: data.householdId },
        data: {
          address1: data.address1 ?? undefined,
          address2: data.address2 ?? undefined,
          city: data.city ?? undefined,
          state: data.state ?? undefined,
          country: data.country ?? undefined,
          zipCode: data.zipCode ?? undefined,
          notes: data.notes ?? undefined,
        },
      })

      // 2. Delete removed guests
      if (data.deletedGuests && data.deletedGuests.length > 0) {
        await tx.guest.deleteMany({
          where: { id: { in: data.deletedGuests } },
        })
      }

      // 3. Clear all primary contact flags in this household
      await tx.guest.updateMany({
        where: { householdId: data.householdId },
        data: { isPrimaryContact: false },
      })

      // 4. Upsert guests and their invitations
      const updatedGuests = await Promise.all(
        data.guestParty.map(async (guest) => {
          const isTagAlong = guest.isTagAlong ?? false
          const invitations = Object.entries(guest.invites).map(([eventId, rsvp]) => ({
            eventId,
            rsvp,
            weddingId,
          }))

          const updatedGuest = await tx.guest.upsert({
            where: { id: guest.guestId ?? -1 },
            update: {
              firstName: guest.firstName,
              lastName: guest.lastName,
              email: guest.email ?? null,
              phone: guest.phone ?? null,
              isPrimaryContact: isTagAlong ? false : (guest.isPrimaryContact ?? false),
              ageGroup: guest.ageGroup,
              isTagAlong,
            },
            create: {
              firstName: guest.firstName,
              lastName: guest.lastName,
              email: guest.email ?? null,
              phone: guest.phone ?? null,
              householdId: data.householdId,
              weddingId,
              isPrimaryContact: isTagAlong ? false : (guest.isPrimaryContact ?? false),
              ageGroup: guest.ageGroup ?? null,
              isTagAlong,
              invitations:
                invitations.length > 0 ? { createMany: { data: invitations } } : undefined,
            },
          })

          // If guest was changed to tag-along, remove invitations for events that don't allow tag-alongs
          if (isTagAlong && guest.guestId) {
            const allowedEventIds = Object.keys(guest.invites)
            if (allowedEventIds.length > 0) {
              await tx.invitation.deleteMany({
                where: {
                  guestId: guest.guestId,
                  eventId: { notIn: allowedEventIds },
                },
              })
            } else {
              await tx.invitation.deleteMany({
                where: { guestId: guest.guestId },
              })
            }
          }

          // Update guest tag assignments
          if (guest.tagIds !== undefined) {
            await tx.guestTagAssignment.deleteMany({ where: { guestId: updatedGuest.id } })
            if (guest.tagIds.length > 0) {
              await tx.guestTagAssignment.createMany({
                data: guest.tagIds.map((tagId) => ({
                  guestId: updatedGuest.id,
                  guestTagId: tagId,
                })),
              })
            }
          }

          // 5. Update invitations (for existing guests)
          if (guest.guestId) {
            await Promise.all(
              Object.entries(guest.invites).map(async ([inviteEventId, inputRsvp]) => {
                await tx.invitation.update({
                  where: {
                    guestId_eventId: {
                      guestId: guest.guestId ?? updatedGuest.id,
                      eventId: inviteEventId,
                    },
                  },
                  data: { rsvp: inputRsvp },
                })
              })
            )
          }

          // Refetch guest with tag assignments to include in response
          const guestWithTags = await tx.guest.findUnique({
            where: { id: updatedGuest.id },
            include: {
              invitations: true,
              guestTagAssignments: { select: { guestTagId: true } },
            },
          })

          if (!guestWithTags) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to refetch guest after update',
            })
          }

          return guestWithTags
        })
      )

      if (!updatedHousehold || !updatedGuests) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update guests',
        })
      }

      // 6. Upsert gifts
      const updatedGifts = await Promise.all(
        data.gifts.map(async (gift) => {
          return tx.gift.upsert({
            where: {
              GiftId: {
                householdId: data.householdId,
                eventId: gift.eventId,
              },
            },
            update: {
              description: gift.description,
              thankyou: gift.thankyou ?? false,
            },
            create: {
              householdId: data.householdId,
              eventId: gift.eventId,
              description: gift.description,
              thankyou: gift.thankyou ?? false,
            },
          })
        })
      )

      return {
        household: updatedHousehold,
        guests: updatedGuests,
        gifts: updatedGifts,
      }
    })
  }

  /**
   * Delete a household and all associated data
   *
   * Note: Cascading deletes are handled by database relations
   */
  async deleteHousehold(
    ctx: AuthzContext,
    householdId: string,
    weddingId: string
  ): Promise<string> {
    requirePermission(ctx, { guest: ['delete'] })
    await this.assertHouseholdInWeddingScope(householdId, weddingId)

    const deletedHousehold = await this.householdRepo.delete(householdId)
    return deletedHousehold.id
  }

  /**
   * Bulk create households from CSV import
   *
   * Creates each household with guests sequentially.
   * Returns the count of successfully created households.
   */
  async bulkCreateHouseholds(
    ctx: AuthzContext,
    weddingId: string,
    households: Parameters<HouseholdManagementService['createHouseholdWithGuests']>[2][]
  ): Promise<{ created: number; failed: number }> {
    requirePermission(ctx, { guest: ['import'] })

    let created = 0
    let failed = 0
    for (const household of households) {
      try {
        await this.createHouseholdWithGuests(ctx, weddingId, household)
        created++
      } catch (error) {
        if (error instanceof TRPCError && ['FORBIDDEN', 'UNAUTHORIZED'].includes(error.code)) {
          throw error
        }
        failed++
      }
    }
    return { created, failed }
  }

  /**
   * Search households by guest name
   */
  async searchHouseholds(
    ctx: AuthzContext,
    weddingId: string,
    searchText: string
  ): Promise<HouseholdSearchResult[]> {
    requirePermission(ctx, { guest: ['read'] })
    return this.householdRepo.search(searchText, weddingId)
  }

  private async assertHouseholdInWeddingScope(
    householdId: string,
    weddingId: string
  ): Promise<void> {
    const belongsToWedding = await this.householdRepo.belongsToWedding(householdId, weddingId)

    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this household',
      })
    }
  }

  private async assertGuestIdsInWeddingScope(guestIds: number[], weddingId: string): Promise<void> {
    const uniqueGuestIds = [...new Set(guestIds)]
    for (const guestId of uniqueGuestIds) {
      const belongsToWedding = await this.guestRepo.belongsToWedding(guestId, weddingId)
      if (!belongsToWedding) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Guest ${guestId} is outside the requested wedding scope`,
        })
      }
    }
  }

  private async assertEventIdsInWeddingScope(eventIds: string[], weddingId: string): Promise<void> {
    const uniqueEventIds = [...new Set(eventIds)]
    for (const eventId of uniqueEventIds) {
      const belongsToWedding = await this.invitationRepo.eventBelongsToWedding(eventId, weddingId)
      if (!belongsToWedding) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Event ${eventId} is outside the requested wedding scope`,
        })
      }
    }
  }
}
