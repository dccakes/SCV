import { type PrismaClient } from '@prisma/client'

import {
  type CreateGuestTagInput,
  type GuestTag,
  type GuestTagWithGuestCount,
  type UpdateGuestTagInput,
} from '~/server/domains/guest-tag/guest-tag.types'

export class GuestTagRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new guest tag
   */
  async create(data: CreateGuestTagInput): Promise<GuestTag> {
    return this.db.guestTag.create({
      data,
    })
  }

  /**
   * Find guest tag by ID
   */
  async findById(id: string): Promise<GuestTagWithGuestCount | null> {
    return this.db.guestTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            guestTagAssignments: true,
          },
        },
      },
    })
  }

  /**
   * Find all guest tags for a wedding
   */
  async findByWeddingId(weddingId: string): Promise<GuestTag[]> {
    return this.db.guestTag.findMany({
      where: { weddingId },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Update a guest tag
   */
  async update(id: string, data: UpdateGuestTagInput): Promise<GuestTag> {
    return this.db.guestTag.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete a guest tag
   */
  async delete(id: string): Promise<GuestTag> {
    return this.db.guestTag.delete({
      where: { id },
    })
  }

  /**
   * Check if a guest tag with the same name already exists for a wedding
   */
  async existsByName(weddingId: string, name: string): Promise<boolean> {
    const tag = await this.db.guestTag.findUnique({
      where: {
        weddingId_name: {
          weddingId,
          name,
        },
      },
    })

    return tag !== null
  }
}
