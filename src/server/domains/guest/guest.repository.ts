/**
 * Guest Domain - Repository
 *
 * Database operations for the Guest entity.
 * This layer handles all direct database access for guests.
 */

import { type PrismaClient } from '@prisma/client'

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
   * Create a new guest
   */
  async create(data: {
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    householdId: string
    weddingId: string
    isPrimaryContact?: boolean
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
      },
    })
  }

  /**
   * Create a guest with invitations
   */
  async createWithInvitations(data: {
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    householdId: string
    weddingId: string
    isPrimaryContact?: boolean
    invitations: Array<{
      eventId: string
      rsvp: string
      weddingId: string
    }>
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
        invitations: {
          createMany: {
            data: data.invitations,
          },
        },
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
    }
  ): Promise<Guest> {
    return this.db.guest.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
    })
  }

  /**
   * Upsert a guest
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
    },
    invitations?: Array<{
      eventId: string
      rsvp: string
      weddingId: string
    }>
  ): Promise<Guest> {
    return this.db.guest.upsert({
      where: { id: id ?? -1 },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
      },
      create: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        householdId: data.householdId,
        weddingId: data.weddingId,
        isPrimaryContact: data.isPrimaryContact ?? false,
        invitations: invitations
          ? {
              createMany: {
                data: invitations,
              },
            }
          : undefined,
      },
    })
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
}
