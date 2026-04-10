/**
 * Communication Log Domain - Repository
 *
 * Database operations for the HouseholdNote entity.
 * Only handles manual note entries - system events are derived by the service layer.
 */

import type { PrismaClient } from '@prisma/client'

import type { HouseholdNote } from '~/server/domains/communication-log/communication-log.types'

export class CommunicationLogRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find all notes for a household, newest first
   */
  async findByHouseholdId(householdId: string): Promise<HouseholdNote[]> {
    return this.db.householdNote.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Create a new note
   */
  async create(data: {
    householdId: string
    weddingId: string
    message: string
    actorType: string
  }): Promise<HouseholdNote> {
    return this.db.householdNote.create({
      data: {
        householdId: data.householdId,
        weddingId: data.weddingId,
        message: data.message,
        actorType: data.actorType,
      },
    })
  }

  /**
   * Delete a note by ID
   */
  async delete(id: string): Promise<HouseholdNote> {
    return this.db.householdNote.delete({
      where: { id },
    })
  }

  /**
   * Check if a note belongs to a wedding (for authorization)
   */
  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const note = await this.db.householdNote.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return note !== null
  }
}
