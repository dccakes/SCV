/**
 * Household Domain - Repository
 *
 * Database operations for the Household entity.
 * This layer handles all direct database access for households.
 */

import { type PrismaClient } from '@prisma/client'

import {
  type Household,
  type HouseholdSearchResult,
  type HouseholdWithGuestsAndGifts,
} from '~/server/domains/household/household.types'

export class HouseholdRepository {
  constructor(private db: PrismaClient) {}

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
   * Search households by guest name
   */
  async search(searchText: string): Promise<HouseholdSearchResult[]> {
    return this.db.household.findMany({
      where: {
        OR: [
          {
            guests: {
              some: {
                firstName: {
                  contains: searchText,
                  mode: 'insensitive',
                },
                AND: [
                  {
                    invitations: {
                      some: {
                        rsvp: {
                          in: ['Invited', 'Attending', 'Declined'],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            guests: {
              some: {
                lastName: {
                  contains: searchText,
                  mode: 'insensitive',
                },
                AND: [
                  {
                    invitations: {
                      some: {
                        rsvp: {
                          in: ['Invited', 'Attending', 'Declined'],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      select: {
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
      },
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
  async belongsToUser(id: string, weddingId: string): Promise<boolean> {
    const household = await this.db.household.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return household !== null
  }
}
