/**
 * Wedding Domain - Repository
 *
 * Database operations for the Wedding entity.
 * This layer handles all direct database access for weddings.
 */

import { type PrismaClient } from '@prisma/client'

import { type Wedding } from '~/server/domains/wedding/wedding.types'

export class WeddingRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a wedding by ID
   */
  async findById(id: string): Promise<Wedding | null> {
    return this.db.wedding.findUnique({
      where: { id },
    })
  }

  /**
   * Find a wedding by user ID (through UserWedding join table)
   */
  async findByUserId(userId: string): Promise<Wedding | null> {
    const userWedding = await this.db.userWedding.findFirst({
      where: { userId },
      include: { wedding: true },
      orderBy: { isPrimary: 'desc' }, // Prioritize primary wedding
    })

    return userWedding?.wedding ?? null
  }

  /**
   * Create a new wedding and associate it with a user
   */
  async create(data: {
    userId: string
    groomFirstName: string
    groomLastName: string
    brideFirstName: string
    brideLastName: string
    enabledAddOns?: string[]
  }): Promise<Wedding> {
    // Create wedding and UserWedding join entry in a single transaction
    return this.db.wedding.create({
      data: {
        groomFirstName: data.groomFirstName,
        groomLastName: data.groomLastName,
        brideFirstName: data.brideFirstName,
        brideLastName: data.brideLastName,
        enabledAddOns: data.enabledAddOns ?? [],
        userWeddings: {
          create: {
            userId: data.userId,
            role: 'owner',
            isPrimary: true,
          },
        },
      },
    })
  }

  /**
   * Update wedding settings
   */
  async update(
    weddingId: string,
    data: {
      groomFirstName?: string
      groomLastName?: string
      brideFirstName?: string
      brideLastName?: string
      enabledAddOns?: string[]
    }
  ): Promise<Wedding> {
    return this.db.wedding.update({
      where: { id: weddingId },
      data: {
        groomFirstName: data.groomFirstName,
        groomLastName: data.groomLastName,
        brideFirstName: data.brideFirstName,
        brideLastName: data.brideLastName,
        enabledAddOns: data.enabledAddOns,
      },
    })
  }

  /**
   * Check if a wedding exists for a user (through UserWedding join table)
   */
  async existsForUser(userId: string): Promise<boolean> {
    const userWedding = await this.db.userWedding.findFirst({
      where: { userId },
      select: { id: true },
    })
    return userWedding !== null
  }
}
