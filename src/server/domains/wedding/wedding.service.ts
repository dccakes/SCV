/**
 * Wedding Domain - Service
 *
 * Business logic for the Wedding domain.
 * Handles wedding creation, updates, and retrieval.
 */

import { type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { type WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import {
  type CreateWeddingInput,
  type UpdateWeddingInput,
  type Wedding,
} from '~/server/domains/wedding/wedding.types'

export class WeddingService {
  constructor(
    private weddingRepository: WeddingRepository,
    private db: PrismaClient
  ) {}

  /**
   * Create a new wedding
   *
   * This creates:
   * 1. The wedding entity with couple's names
   * 2. A UserWedding join entry linking the user to the wedding
   * 3. A default "Wedding Day" event if date/location provided
   * 4. Updates the user's profile with couple info
   */
  async createWedding(userId: string, data: CreateWeddingInput): Promise<Wedding> {
    // Check if user already has a wedding
    const existingWedding = await this.weddingRepository.existsForUser(userId)
    if (existingWedding) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User already has a wedding',
      })
    }

    const {
      groomFirstName,
      groomLastName,
      brideFirstName,
      brideLastName,
      weddingDate,
      weddingLocation,
    } = data

    // Create the wedding (repository will create UserWedding entry)
    const wedding = await this.weddingRepository.create({
      userId,
      groomFirstName,
      groomLastName,
      brideFirstName,
      brideLastName,
      enabledAddOns: [], // Core features only on creation
    })

    // Create default "Wedding Day" event if date/location provided
    if (data.hasWeddingDetails && (weddingDate || weddingLocation)) {
      await this.db.event.create({
        data: {
          name: 'Wedding Day',
          weddingId: wedding.id,
          collectRsvp: true,
          date: weddingDate ? new Date(weddingDate) : null,
          venue: weddingLocation ?? null,
        },
      })
    }

    // Update user profile with couple info (for backward compatibility)
    await this.db.user.update({
      where: { id: userId },
      data: {
        groomFirstName,
        groomLastName,
        brideFirstName,
        brideLastName,
      },
    })

    return wedding
  }

  /**
   * Update wedding settings
   */
  async updateWedding(weddingId: string, data: UpdateWeddingInput): Promise<Wedding> {
    return this.weddingRepository.update(weddingId, data)
  }

  /**
   * Get wedding by user ID
   */
  async getByUserId(userId: string | null): Promise<Wedding | null> {
    if (!userId) {
      return null
    }
    return this.weddingRepository.findByUserId(userId)
  }

  /**
   * Get wedding by ID
   */
  async getById(weddingId: string): Promise<Wedding | null> {
    return this.weddingRepository.findById(weddingId)
  }

  /**
   * Check if user has a wedding
   */
  async hasWedding(userId: string): Promise<boolean> {
    return this.weddingRepository.existsForUser(userId)
  }
}
