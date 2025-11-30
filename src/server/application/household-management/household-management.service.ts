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

import { type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import {
  type CreateHouseholdResult,
  type CreateHouseholdWithGuestsInput,
  type UpdateHouseholdResult,
  type UpdateHouseholdWithGuestsInput,
} from '~/server/application/household-management/household-management.types'
import { type GiftRepository } from '~/server/domains/gift/gift.repository'
import { type GuestRepository } from '~/server/domains/guest/guest.repository'
import { type HouseholdRepository } from '~/server/domains/household/household.repository'
import { type HouseholdSearchResult } from '~/server/domains/household/household.types'
import { type InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { type Invitation } from '~/server/domains/invitation/invitation.types'

export class HouseholdManagementService {
  constructor(
    private householdRepo: HouseholdRepository,
    private guestRepo: GuestRepository,
    private invitationRepo: InvitationRepository,
    private giftRepo: GiftRepository,
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
   */
  async createHouseholdWithGuests(
    weddingId: string,
    data: CreateHouseholdWithGuestsInput
  ): Promise<CreateHouseholdResult> {
    // Extract event IDs from the first guest's invites
    const eventIds = Object.keys(data.guestParty[0]?.invites ?? {})

    // 1. Create household with gifts for each event
    const household = await this.householdRepo.createWithGifts(
      {
        weddingId,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        notes: data.notes,
      },
      eventIds
    )

    if (!household) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create household',
      })
    }

    // 2. Create guests with their invitations and tags
    const guests = await Promise.all(
      data.guestParty.map(async (guest, index) => {
        const newGuest = await this.guestRepo.create({
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          weddingId,
          householdId: household.id,
          isPrimaryContact: guest.isPrimaryContact ?? index === 0,
          ageGroup: guest.ageGroup,
          invitations: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
            eventId,
            rsvp,
            weddingId,
          })),
          tagIds: guest.tagIds,
        })

        // Refetch guest with tag assignments to include in response
        const guestWithTags = await this.guestRepo.findByIdWithInvitations(newGuest.id)

        return guestWithTags!
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
   * 3. Clear all primary contact flags in household
   * 4. Upsert guests (creates new, updates existing)
   * 5. Update invitations
   * 6. Update guest tag assignments
   * 7. Upsert gifts
   */
  async updateHouseholdWithGuests(
    weddingId: string,
    data: UpdateHouseholdWithGuestsInput
  ): Promise<UpdateHouseholdResult> {
    // 1. Update household details
    const updatedHousehold = await this.householdRepo.update(data.householdId, {
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.state,
      country: data.country,
      zipCode: data.zipCode,
      notes: data.notes,
    })

    // 2. Delete removed guests
    if (data.deletedGuests && data.deletedGuests.length > 0) {
      await this.guestRepo.deleteMany(data.deletedGuests)
    }

    // 3. First, clear all primary contact flags in this household
    await this.db.guest.updateMany({
      where: {
        householdId: data.householdId,
      },
      data: {
        isPrimaryContact: false,
      },
    })

    // 4. Upsert guests and their invitations
    const updatedGuests = await Promise.all(
      data.guestParty.map(async (guest) => {
        const updatedGuest = await this.guestRepo.upsert(
          guest.guestId,
          {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            phone: guest.phone,
            householdId: data.householdId,
            weddingId,
            isPrimaryContact: guest.isPrimaryContact ?? false,
            ageGroup: guest.ageGroup,
          },
          Object.entries(guest.invites).map(([eventId, rsvp]) => ({
            eventId,
            rsvp,
            weddingId,
          }))
        )

        // Update guest tag assignments
        if (guest.tagIds !== undefined) {
          await this.guestRepo.updateTags(updatedGuest.id, guest.tagIds)
        }

        // 5. Update invitations for existing guests
        const updatedInvitations: Invitation[] = await Promise.all(
          Object.entries(guest.invites).map(async ([inviteEventId, inputRsvp]) => {
            return await this.invitationRepo.update({
              guestId: guest.guestId ?? updatedGuest.id,
              eventId: inviteEventId,
              rsvp: inputRsvp,
            })
          })
        )

        if (updatedInvitations.length !== Object.keys(guest.invites).length) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update all invitations',
          })
        }

        // Refetch guest with tag assignments to include in response
        const guestWithTags = await this.guestRepo.findByIdWithInvitations(updatedGuest.id)

        return guestWithTags!
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
        return await this.giftRepo.upsert({
          householdId: data.householdId,
          eventId: gift.eventId,
          description: gift.description,
          thankyou: gift.thankyou,
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
    const deletedHousehold = await this.householdRepo.delete(householdId)
    return deletedHousehold.id
  }

  /**
   * Search households by guest name
   */
  async searchHouseholds(searchText: string): Promise<HouseholdSearchResult[]> {
    return this.householdRepo.search(searchText)
  }
}
