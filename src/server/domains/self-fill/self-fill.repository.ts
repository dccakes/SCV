/**
 * Self-Fill Domain - Repository
 *
 * Database operations for the Self-Fill feature.
 * Handles wedding lookup by token and token management.
 */

import type { PrismaClient } from '@prisma/client'

import type { SelfFillWeddingData } from '~/server/domains/self-fill/self-fill.types'

/** Tokens older than this many days are considered expired */
export const TOKEN_EXPIRY_DAYS = 90

/** Build the Prisma WHERE clause for a valid (non-expired) token */
function validTokenWhere(token: string) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() - TOKEN_EXPIRY_DAYS)
  return {
    selfFillToken: token,
    OR: [
      { selfFillTokenGeneratedAt: null as Date | null }, // Legacy tokens: treat as non-expiring
      { selfFillTokenGeneratedAt: { gte: expiryDate } },
    ],
  }
}

export class SelfFillRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a wedding by self-fill token.
   * Returns null if the token does not exist or has expired (> TOKEN_EXPIRY_DAYS old).
   */
  async findByToken(token: string): Promise<SelfFillWeddingData | null> {
    const wedding = await this.db.wedding.findFirst({
      where: validTokenWhere(token),
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
   * Get wedding ID by self-fill token.
   * Returns null if the token does not exist or has expired.
   */
  async getWeddingIdByToken(token: string): Promise<string | null> {
    const wedding = await this.db.wedding.findFirst({
      where: validTokenWhere(token),
      select: { id: true },
    })

    return wedding?.id ?? null
  }

  /**
   * Update the self-fill token for a wedding.
   * Pass generatedAt=null when revoking (token=null).
   */
  async updateToken(
    weddingId: string,
    token: string | null,
    generatedAt: Date | null
  ): Promise<void> {
    await this.db.wedding.update({
      where: { id: weddingId },
      data: { selfFillToken: token, selfFillTokenGeneratedAt: generatedAt },
    })
  }

  /**
   * Get the earliest dated event for a wedding.
   * Used by the service to warn owners when the invite link expires before their wedding.
   */
  async getEarliestEventDate(weddingId: string): Promise<Date | null> {
    const event = await this.db.event.findFirst({
      where: { weddingId, date: { not: null } },
      orderBy: { date: 'asc' },
      select: { date: true },
    })
    return event?.date ?? null
  }

  /**
   * Get the self-fill token and its generation timestamp for a wedding
   */
  async getToken(weddingId: string): Promise<{ token: string; generatedAt: Date | null } | null> {
    const wedding = await this.db.wedding.findUnique({
      where: { id: weddingId },
      select: { selfFillToken: true, selfFillTokenGeneratedAt: true },
    })

    if (!wedding?.selfFillToken) return null
    return { token: wedding.selfFillToken, generatedAt: wedding.selfFillTokenGeneratedAt }
  }
}
