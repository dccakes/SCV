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
import { type Invitation } from '~/server/domains/invitation/invitation.types'

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
    weddingId: string,
    data: CreateHouseholdInput
  ): Promise<HouseholdWithGuestsAndGifts> {
    // Extract event IDs from the first guest's invites
    const eventIds = Object.keys(data.guestParty[0]?.invites ?? {})

    // Create household with gifts
    const household = await this.householdRepository.createWithGifts(
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

    // Create guests with invitations
    const newGuests = await Promise.all(
      data.guestParty.map(async (guest: GuestPartyInput) => {
        const createdGuest = await this.db.guest.create({
          data: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email ?? null,
            phone: guest.phone ?? null,
            weddingId,
            householdId: household.id,
            isPrimaryContact: guest.isPrimaryContact,
            ageGroup: guest.ageGroup,
            invitations: {
              createMany: {
                data: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
                  eventId,
                  rsvp,
                  weddingId,
                })),
              },
            },
          },
        })

        // Create GuestTagAssignment entries if tagIds provided
        if (guest.tagIds && guest.tagIds.length > 0) {
          await this.db.guestTagAssignment.createMany({
            data: guest.tagIds.map((tagId) => ({
              guestId: createdGuest.id,
              guestTagId: tagId,
            })),
          })
        }

        return createdGuest
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
    weddingId: string,
    data: UpdateHouseholdInput
  ): Promise<HouseholdWithGuestsAndGifts> {
    // Update household details - only update fields that are present
    const householdUpdate: Record<string, unknown> = {}
    if (data.address1 !== undefined) householdUpdate.address1 = data.address1
    if (data.address2 !== undefined) householdUpdate.address2 = data.address2
    if (data.city !== undefined) householdUpdate.city = data.city
    if (data.state !== undefined) householdUpdate.state = data.state
    if (data.country !== undefined) householdUpdate.country = data.country
    if (data.zipCode !== undefined) householdUpdate.zipCode = data.zipCode
    if (data.notes !== undefined) householdUpdate.notes = data.notes

    const updatedHousehold = await this.householdRepository.update(
      data.householdId,
      householdUpdate
    )

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
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            phone: guest.phone,
            isPrimaryContact: guest.isPrimaryContact,
            ageGroup: guest.ageGroup,
          },
          create: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email ?? null,
            phone: guest.phone ?? null,
            weddingId,
            householdId: data.householdId,
            isPrimaryContact: guest.isPrimaryContact,
            ageGroup: guest.ageGroup,
            invitations: {
              createMany: {
                data: Object.entries(guest.invites).map(([eventId, rsvp]) => ({
                  eventId,
                  rsvp,
                  weddingId,
                })),
              },
            },
          },
        })

        // Update GuestTagAssignment entries: delete existing and create new ones
        if (guest.tagIds !== undefined) {
          // Delete existing tag assignments
          await this.db.guestTagAssignment.deleteMany({
            where: { guestId: updatedGuest.id },
          })

          // Create new tag assignments if provided
          if (guest.tagIds.length > 0) {
            await this.db.guestTagAssignment.createMany({
              data: guest.tagIds.map((tagId) => ({
                guestId: updatedGuest.id,
                guestTagId: tagId,
              })),
            })
          }
        }

        // Update invitations for existing guests
        const updatedInvitations: Invitation[] = await Promise.all(
          Object.entries(guest.invites).map(async ([inviteEventId, inputRsvp]) => {
            return await this.db.invitation.update({
              where: {
                guestId_eventId: {
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
  async getByIdWithGuestsAndGifts(
    householdId: string
  ): Promise<HouseholdWithGuestsAndGifts | null> {
    return this.householdRepository.findByIdWithGuestsAndGifts(householdId)
  }

  /**
   * Get all households for a wedding
   */
  async getWeddingHouseholds(weddingId: string): Promise<HouseholdWithGuestsAndGifts[]> {
    return this.householdRepository.findByWeddingIdWithGuestsAndGifts(weddingId)
  }
}
