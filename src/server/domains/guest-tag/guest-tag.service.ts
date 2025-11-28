import { TRPCError } from '@trpc/server'

import { type GuestTagRepository } from '~/server/domains/guest-tag/guest-tag.repository'
import {
  type CreateGuestTagInput,
  type GuestTag,
  type GuestTagWithGuestCount,
  type UpdateGuestTagInput,
} from '~/server/domains/guest-tag/guest-tag.types'

export class GuestTagService {
  constructor(private repo: GuestTagRepository) {}

  /**
   * Create a new guest tag
   * @throws TRPCError if tag with same name already exists
   */
  async create(data: CreateGuestTagInput): Promise<GuestTag> {
    const trimmedName = data.name.trim()

    // Check for duplicate tag name
    const exists = await this.repo.existsByName(data.weddingId, trimmedName)
    if (exists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A tag with this name already exists for this wedding',
      })
    }

    return this.repo.create({
      ...data,
      name: trimmedName,
    })
  }

  /**
   * Get all guest tags for a wedding
   */
  async getByWeddingId(weddingId: string): Promise<GuestTag[]> {
    return this.repo.findByWeddingId(weddingId)
  }

  /**
   * Get guest tag by ID with guest count
   */
  async getByIdWithCount(id: string): Promise<GuestTagWithGuestCount | null> {
    return this.repo.findById(id)
  }

  /**
   * Update a guest tag
   * @throws TRPCError if new name conflicts with existing tag
   */
  async update(id: string, weddingId: string, data: UpdateGuestTagInput): Promise<GuestTag> {
    // If updating name, check for duplicates
    if (data.name) {
      const exists = await this.repo.existsByName(weddingId, data.name)
      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A tag with this name already exists for this wedding',
        })
      }
    }

    return this.repo.update(id, data)
  }

  /**
   * Delete a guest tag
   */
  async delete(id: string): Promise<GuestTag> {
    return this.repo.delete(id)
  }

  /**
   * Seed initial guest tags for a new wedding
   * Skips tags that already exist
   */
  async seedInitialTags(
    weddingId: string,
    tags: Array<{ name: string; color: string }>
  ): Promise<void> {
    for (const tag of tags) {
      const exists = await this.repo.existsByName(weddingId, tag.name)
      if (!exists) {
        await this.repo.create({
          weddingId,
          name: tag.name,
          color: tag.color,
        })
      }
    }
  }
}
