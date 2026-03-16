import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { GuestTagRepository } from '~/server/domains/guest-tag/guest-tag.repository'
import type {
  CreateGuestTagInput,
  GuestTag,
  GuestTagWithGuestCount,
  UpdateGuestTagInput,
} from '~/server/domains/guest-tag/guest-tag.types'

export class GuestTagService {
  constructor(private repo: GuestTagRepository) {}

  /**
   * Create a new guest tag
   * @throws TRPCError if tag with same name already exists
   */
  async create(ctx: AuthzContext, data: CreateGuestTagInput): Promise<GuestTag> {
    await requirePermission(ctx, { guest: ['update'] })

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
  async getByWeddingId(ctx: AuthzContext, weddingId: string): Promise<GuestTag[]> {
    await requirePermission(ctx, { guest: ['read'] })
    return this.repo.findByWeddingId(weddingId)
  }

  /**
   * Get guest tag by ID with guest count
   */
  async getByIdWithCount(
    ctx: AuthzContext,
    id: string,
    weddingId: string
  ): Promise<GuestTagWithGuestCount | null> {
    await requirePermission(ctx, { guest: ['read'] })
    await this.assertTagInWeddingScope(id, weddingId)
    return this.repo.findById(id)
  }

  /**
   * Update a guest tag
   * @throws TRPCError if new name conflicts with existing tag
   */
  async update(
    ctx: AuthzContext,
    id: string,
    weddingId: string,
    data: UpdateGuestTagInput
  ): Promise<GuestTag> {
    await requirePermission(ctx, { guest: ['update'] })
    await this.assertTagInWeddingScope(id, weddingId)

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
  async delete(ctx: AuthzContext, id: string, weddingId: string): Promise<GuestTag> {
    await requirePermission(ctx, { guest: ['delete'] })
    await this.assertTagInWeddingScope(id, weddingId)
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

  private async assertTagInWeddingScope(id: string, weddingId: string): Promise<void> {
    const inScope = await this.repo.belongsToWedding(id, weddingId)

    if (!inScope) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this guest tag',
      })
    }
  }
}
