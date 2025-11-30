/**
 * Wedding Domain - Service
 *
 * Business logic for the Wedding domain.
 * Handles wedding creation, updates, and retrieval.
 */

import { TRPCError } from '@trpc/server'

import { type EventService } from '~/server/domains/event/event.service'
import { type GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'
import { type WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import {
  type CreateWeddingInput,
  type UpdateWeddingInput,
  type Wedding,
} from '~/server/domains/wedding/wedding.types'

/**
 * Default tags created for new weddings
 */
const DEFAULT_TAGS = [
  { name: 'Family', color: '#3b82f6' }, // blue
  { name: 'MutualFriends', color: '#10b981' }, // green
  { name: 'Coworkers', color: '#8b5cf6' }, // purple
  { name: 'Plus One', color: '#f59e0b' }, // amber
]

export class WeddingService {
  constructor(
    private weddingRepository: WeddingRepository,
    private eventService: EventService,
    private guestTagService: GuestTagService
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
    // Check if user already has a wedding (currently allow only one wedding per user)
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

    // Seed default tags for the wedding
    await this.guestTagService.seedInitialTags(wedding.id, DEFAULT_TAGS)

    // Create default "Wedding Day" event if date/location provided
    if (data.hasWeddingDetails && (weddingDate || weddingLocation)) {
      await this.eventService.createEvent(wedding.id, {
        eventName: 'Ceremony',
        date: weddingDate ?? undefined,
        venue: weddingLocation ?? undefined,
      })
    }

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
