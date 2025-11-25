/**
 * Household Domain - Service
 *
 * Business logic for the Household domain.
 * Handles household creation, updates, deletion, and retrieval.
 *
 * Note: This service contains cross-domain orchestration that will
 * eventually be moved to an Application Service in Phase 4.
 */

import { type Guest as PrismaGuest } from '@prisma/client'
import { type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { type Invitation } from '~/server/domains/invitation/invitation.types'
import { type HouseholdRepository } from '~/server/domains/household/household.repository'
import {
  type CreateHouseholdInput,
  type DeleteHouseholdInput,
  type GiftInput,
  type GuestPartyInput,
  type Household,
  type HouseholdSearchResult,
  type HouseholdWithGuestsAndGifts,
  type SearchHouseholdInput,
  type UpdateHouseholdInput,
} from '~/server/domains/household/household.types'

export class HouseholdService {
  constructor(
    private householdRepository: HouseholdRepository,
    private db: PrismaClient
  ) {}

  /**
   * Create a new household with guests and invitations
   *
   * This is a complex orchestration that:
   * 1. Creates the household with gifts for each event
   * 2. Creates guests with their invitations
   */
  async createHousehold(
    userId: string,
    data: CreateHouseholdInput
  ): Promise<HouseholdWithGuestsAndGifts> {
    // Extract event IDs from the first guest's invites
    const eventIds = Object.keys(data.guestParty[0]?.invites ?? {})

    // Create household with gifts
    const household = await this.householdRepository.createWithGifts(
      {
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
      },
      eventIds
    )

    if (!household) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create household',
      })
    }

    // Create guests with invitations
    const newGuests = await Promise.all(
      data.guestParty.map(async (guest: GuestPartyInput, i: number) => {
        return await this.db.guest.create({
          data: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            userId,
            householdId: household.id,
            isPrimaryContact: i === 0,
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
      })
    )

    if (!newGuests) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create guests',
      })
    }

    // Build and return the complete household data
    const householdData: HouseholdWithGuestsAndGifts = {
      ...household,
      guests: await Promise.all(
        newGuests.map(async (guest: PrismaGuest) => {
          return {
            ...guest,
            invitations: await this.db.invitation.findMany({
              where: {
                guestId: guest.id,
              },
            }),
          }
        })
      ),
    }

    return householdData
  }

  /**
   * Update a household with guests, invitations, and gifts
   *
   * This is a complex orchestration that:
   * 1. Updates household details
   * 2. Deletes removed guests
   * 3. Upserts guests (creates new, updates existing)
   * 4. Updates invitations
   * 5. Upserts gifts
   */
  async updateHousehold(
    userId: string,
    data: UpdateHouseholdInput
  ): Promise<HouseholdWithGuestsAndGifts> {
    // Update household details
    const updatedHousehold = await this.householdRepository.update(data.householdId, {
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.state,
      country: data.country,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
    })

    // Delete removed guests
    if (data.deletedGuests && data.deletedGuests.length > 0) {
      await this.db.guest.deleteMany({
        where: {
          id: {
            in: data.deletedGuests,
          },
        },
      })
    }

    // Upsert guests and their invitations
    const updatedGuestParty = await Promise.all(
      data.guestParty.map(async (guest: GuestPartyInput) => {
        const updatedGuest = await this.db.guest.upsert({
          where: {
            id: guest.guestId ?? -1,
          },
          update: {
            firstName: guest.firstName ?? undefined,
            lastName: guest.lastName ?? undefined,
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

        // Update invitations for existing guests
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
                rsvp: inputRsvp ?? undefined,
              },
            })
          })
        )

        if (updatedInvitations.length !== Object.keys(guest.invites).length) {
          return Promise.reject(new Error('Failed to update all invitations'))
        }

        return {
          ...updatedGuest,
          invitations: updatedInvitations,
        }
      })
    )

    if (!updatedHousehold || !updatedGuestParty) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update guests',
      })
    }

    // Upsert gifts
    const updatedGifts = await Promise.all(
      data.gifts.map(async (gift: GiftInput) => {
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
      ...updatedHousehold,
      guests: updatedGuestParty,
      gifts: updatedGifts,
    }
  }

  /**
   * Delete a household
   */
  async deleteHousehold(data: DeleteHouseholdInput): Promise<string> {
    const deletedHousehold = await this.householdRepository.delete(data.householdId)
    return deletedHousehold.id
  }

  /**
   * Search households by guest name
   */
  async searchHouseholds(data: SearchHouseholdInput): Promise<HouseholdSearchResult[]> {
    return this.householdRepository.search(data.searchText)
  }

  /**
   * Get a household by ID
   */
  async getById(householdId: string): Promise<Household | null> {
    return this.householdRepository.findById(householdId)
  }

  /**
   * Get a household by ID with guests and gifts
   */
  async getByIdWithGuestsAndGifts(householdId: string): Promise<HouseholdWithGuestsAndGifts | null> {
    return this.householdRepository.findByIdWithGuestsAndGifts(householdId)
  }

  /**
   * Get all households for a user
   */
  async getUserHouseholds(userId: string): Promise<HouseholdWithGuestsAndGifts[]> {
    return this.householdRepository.findByUserIdWithGuestsAndGifts(userId)
  }
}
