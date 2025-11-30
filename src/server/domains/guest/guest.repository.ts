/**
 * Guest Domain - Repository
 *
 * Database operations for the Guest entity.
 * This layer handles all direct database access for guests.
 */

import { type GuestAgeGroup, type PrismaClient } from '@prisma/client'

import { type Guest, type GuestWithInvitations } from '~/server/domains/guest/guest.types'

export class GuestRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a guest by ID
   */
  async findById(id: number): Promise<Guest | null> {
    return this.db.guest.findUnique({
      where: { id },
    })
  }

  /**
   * Find a guest by ID with invitations
   */
  async findByIdWithInvitations(id: number): Promise<GuestWithInvitations | null> {
    return this.db.guest.findUnique({
      where: { id },
      include: {
        invitations: true,
        guestTagAssignments: {
          select: {
            guestTagId: true,
          },
        },
      },
    })
  }

  /**
   * Find all guests for a wedding
   */
  async findByWeddingId(weddingId: string): Promise<Guest[]> {
    return this.db.guest.findMany({
      where: { weddingId },
    })
  }

  /**
   * Find all guests for a household
   */
  async findByHouseholdId(householdId: string): Promise<Guest[]> {
    return this.db.guest.findMany({
      where: { householdId },
    })
  }

  /**
   * Find all guests for a household with invitations
   */
  async findByHouseholdIdWithInvitations(householdId: string): Promise<GuestWithInvitations[]> {
    return this.db.guest.findMany({
      where: { householdId },
      include: {
        invitations: true,
      },
    })
  }

  /**
   * Create a new guest with optional invitations and tags
   */
  async create(data: {
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    householdId: string
    weddingId: string
    isPrimaryContact?: boolean
    ageGroup?: GuestAgeGroup | null
    invitations?: Array<{
      eventId: string
      rsvp: string
      weddingId: string
    }>
    tagIds?: string[]
  }): Promise<Guest> {
    return this.db.guest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        householdId: data.householdId,
        weddingId: data.weddingId,
        isPrimaryContact: data.isPrimaryContact ?? false,
        ageGroup: data.ageGroup ?? null,
        invitations: data.invitations
          ? {
              createMany: {
                data: data.invitations,
              },
            }
          : undefined,
        guestTagAssignments: data.tagIds
          ? {
              createMany: {
                data: data.tagIds.map((tagId) => ({ guestTagId: tagId })),
              },
            }
          : undefined,
      },
    })
  }

  /**
   * Update an existing guest
   */
  async update(
    id: number,
    data: {
      firstName?: string
      lastName?: string
      email?: string | null
      phone?: string | null
      ageGroup?: GuestAgeGroup | null
      isPrimaryContact?: boolean
    }
  ): Promise<Guest> {
    return this.db.guest.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        ageGroup: data.ageGroup,
        isPrimaryContact: data.isPrimaryContact,
      },
    })
  }

  /**
   * Upsert a guest with optional invitations and tags
   * Note: Tags are only created in the CREATE branch. For updates, use updateTags() separately.
   */
  async upsert(
    id: number | undefined,
    data: {
      firstName: string
      lastName: string
      email?: string | null
      phone?: string | null
      householdId: string
      weddingId: string
      isPrimaryContact?: boolean
      ageGroup?: GuestAgeGroup | null
    },
    invitations?: Array<{
      eventId: string
      rsvp: string
      weddingId: string
    }>,
    tagIds?: string[]
  ): Promise<Guest> {
    return this.db.guest.upsert({
      where: { id: id ?? -1 },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        isPrimaryContact: data.isPrimaryContact,
        ageGroup: data.ageGroup,
      },
      create: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        householdId: data.householdId,
        weddingId: data.weddingId,
        isPrimaryContact: data.isPrimaryContact ?? false,
        ageGroup: data.ageGroup ?? null,
        invitations: invitations
          ? {
              createMany: {
                data: invitations,
              },
            }
          : undefined,
        guestTagAssignments: tagIds
          ? {
              createMany: {
                data: tagIds.map((tagId) => ({ guestTagId: tagId })),
              },
            }
          : undefined,
      },
    })
  }

  /**
   * Update guest tags
   * Replaces all existing tags with the provided list
   */
  async updateTags(guestId: number, tagIds: string[]): Promise<void> {
    // Delete existing tag assignments
    await this.db.guestTagAssignment.deleteMany({
      where: { guestId },
    })

    // Create new tag assignments if provided
    if (tagIds.length > 0) {
      await this.db.guestTagAssignment.createMany({
        data: tagIds.map((tagId) => ({
          guestId,
          guestTagId: tagId,
        })),
      })
    }
  }

  /**
   * Delete a guest
   */
  async delete(id: number): Promise<Guest> {
    return this.db.guest.delete({
      where: { id },
    })
  }

  /**
   * Delete multiple guests
   */
  async deleteMany(ids: number[]): Promise<{ count: number }> {
    return this.db.guest.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  }

  /**
   * Check if a guest exists
   */
  async exists(id: number): Promise<boolean> {
    const guest = await this.db.guest.findUnique({
      where: { id },
      select: { id: true },
    })
    return guest !== null
  }

  /**
   * Check if a guest belongs to a wedding
   */
  async belongsToWedding(id: number, weddingId: string): Promise<boolean> {
    const guest = await this.db.guest.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return guest !== null
  }

  /**
   * Count guests by wedding ID
   */
  async countByWeddingId(weddingId: string): Promise<number> {
    return this.db.guest.count({
      where: { weddingId },
    })
  }
}
