/**
 * Household Management Application Service
 *
 * Orchestrates complex household operations that span multiple domains:
 * - Household domain (core household data)
 * - Guest domain (guest creation/updates)
 * - Invitation domain (invitation creation/updates)
 * - Event domain (get events for auto-invitation)
 * - Gift domain (gift tracking)
 *
 * This service handles the cross-domain coordination that was previously
 * embedded in the Household domain service.
 */

import { type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import {
  type CreateHouseholdResult,
  type CreateHouseholdWithGuestsInput,
  type UpdateHouseholdResult,
  type UpdateHouseholdWithGuestsInput,
} from '~/server/application/household-management/household-management.types'
import { type EventService } from '~/server/domains/event'
import { type GiftService } from '~/server/domains/gift'
import { type GuestService } from '~/server/domains/guest'
import { type HouseholdService } from '~/server/domains/household'
import { type Invitation, type InvitationService } from '~/server/domains/invitation'

export class HouseholdManagementService {
  constructor(
    private householdService: HouseholdService,
    private guestService: GuestService,
    private invitationService: InvitationService,
    private eventService: EventService,
    private giftService: GiftService,
    private db: PrismaClient
  ) {}

  /**
   * Create a household with guests and auto-create invitations for all events
   *
   * Orchestration flow:
   * 1. Extract event IDs from guest invitations
   * 2. Create household with gifts for each event
   * 3. Create guests with their invitations
   * 4. Return complete household data
   */
  async createHouseholdWithGuests(
    userId: string,
    data: CreateHouseholdWithGuestsInput
  ): Promise<CreateHouseholdResult> {
    // Extract event IDs from the first guest's invites
    const eventIds = Object.keys(data.guestParty[0]?.invites ?? {})

    // 1. Create household with gifts for each event
    const household = await this.db.household.create({
      data: {
        userId,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
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
        gifts: true,
      },
    })

    if (!household) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create household',
      })
    }

    // 2. Create guests with their invitations
    const guests = await Promise.all(
      data.guestParty.map(async (guest, index) => {
        const newGuest = await this.db.guest.create({
          data: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            userId,
            householdId: household.id,
            isPrimaryContact: index === 0,
            invitations: {
              createMany: {
                data: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
                  eventId,
                  rsvp,
                  userId,
                })),
              },
            },
          },
          include: {
            invitations: true,
          },
        })

        return newGuest
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
  }

  /**
   * Update a household with guests, invitations, and gifts
   *
   * Orchestration flow:
   * 1. Update household details
   * 2. Delete removed guests
   * 3. Upsert guests (creates new, updates existing)
   * 4. Update invitations
   * 5. Upsert gifts
   */
  async updateHouseholdWithGuests(
    userId: string,
    data: UpdateHouseholdWithGuestsInput
  ): Promise<UpdateHouseholdResult> {
    // 1. Update household details
    const updatedHousehold = await this.db.household.update({
      where: { id: data.householdId },
      data: {
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      },
    })

    // 2. Delete removed guests
    if (data.deletedGuests && data.deletedGuests.length > 0) {
      await this.db.guest.deleteMany({
        where: {
          id: { in: data.deletedGuests },
        },
      })
    }

    // 3. Upsert guests and their invitations
    const updatedGuests = await Promise.all(
      data.guestParty.map(async (guest) => {
        const updatedGuest = await this.db.guest.upsert({
          where: {
            id: guest.guestId ?? -1,
          },
          update: {
            firstName: guest.firstName,
            lastName: guest.lastName,
          },
          create: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            userId,
            householdId: data.householdId,
            isPrimaryContact: false,
            invitations: {
              createMany: {
                data: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
                  eventId,
                  rsvp,
                  userId,
                })),
              },
            },
          },
        })

        // 4. Update invitations for existing guests
        const updatedInvitations: Invitation[] = await Promise.all(
          Object.entries(guest.invites).map(async ([inviteEventId, inputRsvp]) => {
            return await this.db.invitation.update({
              where: {
                invitationId: {
                  eventId: inviteEventId,
                  guestId: guest.guestId ?? updatedGuest.id,
                },
              },
              data: {
                rsvp: inputRsvp,
              },
            })
          })
        )

        if (updatedInvitations.length !== Object.keys(guest.invites).length) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update all invitations',
          })
        }

        return {
          ...updatedGuest,
          invitations: updatedInvitations,
        }
      })
    )

    if (!updatedHousehold || !updatedGuests) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update guests',
      })
    }

    // 5. Upsert gifts
    const updatedGifts = await Promise.all(
      data.gifts.map(async (gift) => {
        return await this.db.gift.upsert({
          where: {
            GiftId: {
              eventId: gift.eventId,
              householdId: data.householdId,
            },
          },
          update: {
            description: gift.description,
            thankyou: gift.thankyou,
          },
          create: {
            householdId: data.householdId,
            eventId: gift.eventId,
            description: gift.description,
            thankyou: gift.thankyou,
          },
        })
      })
    )

    return {
      household: updatedHousehold,
      guests: updatedGuests,
      gifts: updatedGifts,
    }
  }

  /**
   * Delete a household and all associated data
   *
   * Note: Cascading deletes are handled by database relations
   */
  async deleteHousehold(householdId: string): Promise<string> {
    const deletedHousehold = await this.db.household.delete({
      where: { id: householdId },
    })
    return deletedHousehold.id
  }
}
