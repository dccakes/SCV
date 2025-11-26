/**
 * Website Domain - Repository
 *
 * Database operations for the Website entity.
 * This layer handles all direct database access for websites.
 */

import { type PrismaClient } from '@prisma/client'

import { type Website, type WebsiteWithQuestions } from '~/server/domains/website/website.types'

export class WebsiteRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a website by ID
   */
  async findById(id: string): Promise<Website | null> {
    return this.db.website.findUnique({
      where: { id },
    })
  }

  /**
   * Find a website by wedding ID
   */
  async findByWeddingId(weddingId: string): Promise<Website | null> {
    return this.db.website.findFirst({
      where: { weddingId },
    })
  }

  /**
   * Find a website by sub URL
   */
  async findBySubUrl(subUrl: string): Promise<Website | null> {
    return this.db.website.findFirst({
      where: { subUrl },
    })
  }

  /**
   * Find a website by sub URL with general questions included
   */
  async findBySubUrlWithQuestions(subUrl: string): Promise<WebsiteWithQuestions | null> {
    return this.db.website.findFirst({
      where: { subUrl },
      include: {
        generalQuestions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    })
  }

  /**
   * Create a new website with default general questions
   */
  async create(data: { weddingId: string; url: string; subUrl: string }): Promise<Website> {
    return this.db.website.create({
      data: {
        weddingId: data.weddingId,
        url: data.url,
        subUrl: data.subUrl,
        generalQuestions: {
          create: [
            {
              text: 'Will you be bringing any children under the age of 10?',
              type: 'Text',
            },
            {
              text: 'Send a note to the couple?',
              type: 'Text',
            },
          ],
        },
      },
    })
  }

  /**
   * Update website settings
   */
  async update(
    weddingId: string,
    data: {
      isPasswordEnabled?: boolean
      password?: string | null
      subUrl?: string
      url?: string
    }
  ): Promise<Website> {
    return this.db.website.update({
      where: { weddingId },
      data: {
        isPasswordEnabled: data.isPasswordEnabled,
        password: data.password ?? undefined,
        subUrl: data.subUrl,
        url: data.url,
      },
    })
  }

  /**
   * Update RSVP enabled status
   */
  async updateRsvpEnabled(websiteId: string, isRsvpEnabled: boolean): Promise<Website> {
    return this.db.website.update({
      where: { id: websiteId },
      data: { isRsvpEnabled },
    })
  }

  /**
   * Update cover photo URL
   */
  async updateCoverPhoto(weddingId: string, coverPhotoUrl: string | null): Promise<Website> {
    return this.db.website.update({
      where: { weddingId },
      data: { coverPhotoUrl },
    })
  }

  /**
   * Check if a website exists for a wedding
   */
  async existsForWedding(weddingId: string): Promise<boolean> {
    const website = await this.db.website.findFirst({
      where: { weddingId },
      select: { id: true },
    })
    return website !== null
  }

  /**
   * Check if a sub URL is already taken
   */
  async isSubUrlTaken(subUrl: string): Promise<boolean> {
    const website = await this.db.website.findFirst({
      where: { subUrl },
      select: { id: true },
    })
    return website !== null
  }
}
