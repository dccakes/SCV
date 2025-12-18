/**
 * Self-Fill Domain - Repository
 *
 * Database operations for the Self-Fill feature.
 * Handles wedding lookup by token and token management.
 */

import { type PrismaClient } from '@prisma/client'

import { type SelfFillWeddingData } from '~/server/domains/self-fill/self-fill.types'

export class SelfFillRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a wedding by self-fill token
   */
  async findByToken(token: string): Promise<SelfFillWeddingData | null> {
    const wedding = await this.db.wedding.findUnique({
      where: { selfFillToken: token },
      select: {
        id: true,
        groomFirstName: true,
        groomLastName: true,
        brideFirstName: true,
        brideLastName: true,
        events: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    return wedding
  }

  /**
   * Get wedding ID by self-fill token
   */
  async getWeddingIdByToken(token: string): Promise<string | null> {
    const wedding = await this.db.wedding.findUnique({
      where: { selfFillToken: token },
      select: { id: true },
    })

    return wedding?.id ?? null
  }

  /**
   * Update the self-fill token for a wedding
   */
  async updateToken(weddingId: string, token: string | null): Promise<void> {
    await this.db.wedding.update({
      where: { id: weddingId },
      data: { selfFillToken: token },
    })
  }

  /**
   * Get the self-fill token for a wedding
   */
  async getToken(weddingId: string): Promise<string | null> {
    const wedding = await this.db.wedding.findUnique({
      where: { id: weddingId },
      select: { selfFillToken: true },
    })

    return wedding?.selfFillToken ?? null
  }
}
