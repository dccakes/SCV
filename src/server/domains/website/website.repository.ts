/**
 * Website Domain - Repository
 *
 * Database operations for the Website entity.
 * This layer handles all direct database access for websites.
 */

import type { PrismaClient } from '@prisma/client'

import type { Website, WebsiteWithQuestions } from '~/server/domains/website/website.types'
import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'
import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'
import { parseSectionContent } from '~/server/domains/website-section/website-section.validator'

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
    const website = await this.db.website.findFirst({
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
        websiteSections: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return website ? this.toWebsiteWithQuestions(website) : null
  }

  /**
   * Find a website by wedding ID with general questions included
   */
  async findByWeddingIdWithQuestions(weddingId: string): Promise<WebsiteWithQuestions | null> {
    const website = await this.db.website.findFirst({
      where: { weddingId },
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
        websiteSections: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return website ? this.toWebsiteWithQuestions(website) : null
  }

  /**
   * Create a new website with default general questions
   */
  async create(data: {
    weddingId: string
    subUrl: string
    templateId?: string | null
  }): Promise<Website> {
    return this.db.website.create({
      data: {
        weddingId: data.weddingId,
        subUrl: data.subUrl,
        templateId: data.templateId,
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
        websiteSections: {
          create: [
            {
              type: WebsiteSectionType.HOME,
              isEnabled: true,
              position: 0,
              content: { introText: '' },
            },
          ],
        },
      },
    })
  }

  async upsertByWeddingId(data: {
    weddingId: string
    subUrl: string
    templateId?: string | null
  }): Promise<Website> {
    return this.db.website.upsert({
      where: { weddingId: data.weddingId },
      update: {},
      create: {
        weddingId: data.weddingId,
        subUrl: data.subUrl,
        templateId: data.templateId,
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
        websiteSections: {
          create: [
            {
              type: WebsiteSectionType.HOME,
              isEnabled: true,
              position: 0,
              content: { introText: '' },
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
    }
  ): Promise<Website> {
    return this.db.website.update({
      where: { weddingId },
      data: {
        isPasswordEnabled: data.isPasswordEnabled,
        password: data.password ?? undefined,
        subUrl: data.subUrl,
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
   * Update the selected website template
   */
  async updateTemplate(weddingId: string, templateId: string): Promise<Website> {
    return this.db.website.update({
      where: { weddingId },
      data: { templateId },
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

  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const website = await this.db.website.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })

    return website !== null
  }

  private toWebsiteWithQuestions(website: {
    id: string
    createdAt: Date
    updatedAt: Date
    weddingId: string
    subUrl: string
    templateId: string | null
    isPasswordEnabled: boolean
    password: string | null
    isRsvpEnabled: boolean
    coverPhotoUrl: string | null
    generalQuestions: WebsiteWithQuestions['generalQuestions']
    websiteSections?: Array<{
      id: string
      createdAt: Date
      updatedAt: Date
      content: unknown
      type: WebsiteSectionType
      websiteId: string
      isEnabled: boolean
      position: number
    }>
  }): WebsiteWithQuestions {
    return {
      ...website,
      websiteSections: website.websiteSections?.map(
        (section) =>
          ({
            ...section,
            content: parseSectionContent(section.type, section.content),
          }) as WebsiteSection
      ),
    }
  }
}
