import type { PrismaClient } from '@prisma/client'

import { getSectionPosition } from '~/server/domains/website-section/website-section.catalog'
import type {
  WebsiteSection,
  WebsiteSectionContent,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import { WebsiteSectionType as SectionType } from '~/server/domains/website-section/website-section.types'
import {
  type CreateWebsiteSectionInput,
  parseSectionContent,
} from '~/server/domains/website-section/website-section.validator'

export class WebsiteSectionRepository {
  constructor(private db: PrismaClient) {}

  async create(data: CreateWebsiteSectionInput): Promise<WebsiteSection> {
    const section = await this.db.websiteSection.create({
      data,
    })

    return this.toWebsiteSection(section)
  }

  async findByWebsiteId(websiteId: string): Promise<WebsiteSection[]> {
    const sections = await this.db.websiteSection.findMany({
      where: { websiteId },
      orderBy: { position: 'asc' },
    })

    return sections.map((section) => this.toWebsiteSection(section))
  }

  async findByWebsiteIdAndType(
    websiteId: string,
    type: WebsiteSection['type']
  ): Promise<WebsiteSection | null> {
    const section = await this.db.websiteSection.findFirst({
      where: { websiteId, type },
    })

    return section ? this.toWebsiteSection(section) : null
  }

  async update(
    id: string,
    data: { content?: WebsiteSectionContent; isEnabled?: boolean; position?: number }
  ): Promise<WebsiteSection> {
    const section = await this.db.websiteSection.update({
      where: { id },
      data,
    })

    return this.toWebsiteSection(section)
  }

  /**
   * Create or update a section by its (websiteId, type) pair. Position defaults
   * to the section's canonical catalog order on first create.
   */
  async upsertByType(
    websiteId: string,
    type: WebsiteSectionType,
    content: WebsiteSectionContent,
    isEnabled: boolean
  ): Promise<WebsiteSection> {
    const section = await this.db.websiteSection.upsert({
      where: {
        websiteId_type: {
          websiteId,
          type,
        },
      },
      update: {
        content,
        isEnabled,
      },
      create: {
        websiteId,
        type,
        isEnabled,
        position: getSectionPosition(type),
        content,
      },
    })

    return this.toWebsiteSection(section)
  }

  async upsertHomeSection(
    websiteId: string,
    content: { introText: string }
  ): Promise<WebsiteSection> {
    return this.upsertByType(websiteId, SectionType.HOME, content, true)
  }

  private toWebsiteSection(section: {
    id: string
    websiteId: string
    type: WebsiteSection['type']
    isEnabled: boolean
    position: number
    content: unknown
    createdAt: Date
    updatedAt: Date
  }): WebsiteSection {
    // Content shape is keyed off `type`; parse it with the matching schema.
    return {
      ...section,
      content: parseSectionContent(section.type, section.content),
    } as WebsiteSection
  }
}
