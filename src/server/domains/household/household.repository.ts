/**
 * Household Domain - Repository
 *
 * Database operations for the Household entity.
 * This layer handles all direct database access for households.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

import type {
  Household,
  HouseholdSearchResult,
  HouseholdWithGuestsAndGifts,
} from '~/server/domains/household/household.types'

/**
 * Shape returned to the guest-facing RSVP flow: the household with each guest's
 * invitations and tag assignments. Shared by name-search and invite-code
 * recognition so both paths hand the RSVP form identical data.
 */
export const rsvpHouseholdSelect = {
  id: true,
  guests: {
    include: {
      invitations: true,
      guestTagAssignments: {
        select: {
          guestTagId: true,
        },
      },
    },
  },
} satisfies Prisma.HouseholdSelect

export class HouseholdRepository {
  constructor(private db: PrismaClient | Prisma.TransactionClient) {}

  /**
   * Find a household by ID
   */
  async findById(id: string): Promise<Household | null> {
    return this.db.household.findUnique({
      where: { id },
    })
  }

  /**
   * Find a household by ID with guests and gifts
   */
  async findByIdWithGuestsAndGifts(id: string): Promise<HouseholdWithGuestsAndGifts | null> {
    return this.db.household.findFirst({
      where: { id },
      include: {
        guests: {
          include: {
            invitations: true,
            guestTagAssignments: {
              select: {
                guestTagId: true,
              },
            },
          },
        },
        gifts: {
          include: {
            event: {
              select: { name: true },
            },
          },
        },
      },
    })
  }

  /**
   * Find all households for a wedding
   */
  async findByWeddingId(weddingId: string): Promise<Household[]> {
    return this.db.household.findMany({
      where: { weddingId },
    })
  }

  /**
   * Find all households for a wedding with guests and gifts
   */
  async findByWeddingIdWithGuestsAndGifts(
    weddingId: string
  ): Promise<HouseholdWithGuestsAndGifts[]> {
    return this.db.household.findMany({
      where: { weddingId },
      include: {
        guests: {
          include: {
            invitations: true,
            guestTagAssignments: {
              select: {
                guestTagId: true,
              },
            },
          },
        },
        gifts: {
          include: {
            event: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Create a new household
   */
  async create(data: {
    weddingId: string
    address1?: string | null
    address2?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    zipCode?: string | null
    likelihoodOfAttending?: number | null
    notes?: string | null
  }): Promise<Household> {
    return this.db.household.create({
      data: {
        weddingId: data.weddingId,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        likelihoodOfAttending: data.likelihoodOfAttending,
        notes: data.notes,
      },
    })
  }

  /**
   * Create a household with gifts
   */
  async createWithGifts(
    data: {
      weddingId: string
      address1?: string | null
      address2?: string | null
      city?: string | null
      state?: string | null
      country?: string | null
      zipCode?: string | null
      likelihoodOfAttending?: number | null
      notes?: string | null
    },
    eventIds: string[]
  ): Promise<HouseholdWithGuestsAndGifts> {
    return this.db.household.create({
      data: {
        weddingId: data.weddingId,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        likelihoodOfAttending: data.likelihoodOfAttending,
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
            guestTagAssignments: {
              select: {
                guestTagId: true,
              },
            },
          },
        },
        gifts: {
          include: {
            event: {
              select: { name: true },
            },
          },
        },
      },
    })
  }

  /**
   * Update an existing household
   */
  async update(
    id: string,
    data: {
      address1?: string | null
      address2?: string | null
      city?: string | null
      state?: string | null
      country?: string | null
      zipCode?: string | null
      likelihoodOfAttending?: number | null
      notes?: string | null
    }
  ): Promise<Household> {
    return this.db.household.update({
      where: { id },
      data: {
        address1: data.address1 ?? undefined,
        address2: data.address2 ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
        country: data.country ?? undefined,
        zipCode: data.zipCode ?? undefined,
        likelihoodOfAttending: data.likelihoodOfAttending ?? undefined,
        notes: data.notes ?? undefined,
      },
    })
  }

  /**
   * Delete a household
   */
  async delete(id: string): Promise<Household> {
    return this.db.household.delete({
      where: { id },
    })
  }

  /**
   * Search households by guest name.
   *
   * The search text is split on whitespace and every term must match some
   * guest's first or last name in the household. First and last names live in
   * separate columns, so a guest typing their full name ("Betum Adobo") — as the
   * "Full Name" field prompts them to — would never match a plain `contains`
   * against either column alone. Tokenising lets "Betum", "Adobo", and
   * "Betum Adobo" all find the household. Mirrors the coordinator-side guest
   * filter (see guest-search-filter.tsx), which already matches the full name.
   *
   * Households are gated to those with at least one invited guest so the public
   * RSVP flow never surfaces people who were never invited. The gate is applied
   * at the household level (not per matched guest) to stay consistent with the
   * invite-token path, which returns the whole household regardless of any
   * single guest's status.
   */
  async search(searchText: string, weddingId: string): Promise<HouseholdSearchResult[]> {
    const terms = searchText.trim().split(/\s+/).filter(Boolean)

    // An empty/whitespace-only search must not return every household.
    if (terms.length === 0) return []

    const nameConditions: Prisma.HouseholdWhereInput[] = terms.map((term) => ({
      guests: {
        some: {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
    }))

    return this.db.household.findMany({
      where: {
        weddingId,
        guests: {
          some: {
            invitations: {
              some: {
                rsvp: {
                  in: ['Invited', 'Attending', 'Declined'],
                },
              },
            },
          },
        },
        AND: nameConditions,
      },
      select: rsvpHouseholdSelect,
    })
  }

  /**
   * Check if a household exists
   */
  async exists(id: string): Promise<boolean> {
    const household = await this.db.household.findUnique({
      where: { id },
      select: { id: true },
    })
    return household !== null
  }

  /**
   * Check if a household belongs to a user
   */
  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const household = await this.db.household.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return household !== null
  }

  /**
   * Count households by IDs constrained to a wedding scope.
   */
  async countByIdsInWedding(weddingId: string, householdIds: string[]): Promise<number> {
    return this.db.household.count({
      where: {
        weddingId,
        id: { in: householdIds },
      },
    })
  }
}
