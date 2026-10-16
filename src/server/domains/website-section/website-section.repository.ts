import type { PrismaClient } from '@prisma/client'

import { getSectionPosition } from '~/server/domains/website-section/website-section.catalog'
import type {
  HomeSectionContent,
  SectionTranslations,
  WebsiteSection,
  WebsiteSectionContent,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import { WebsiteSectionType as SectionType } from '~/server/domains/website-section/website-section.types'
import {
  type CreateWebsiteSectionInput,
  parseSectionContent,
  parseSectionTranslations,
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
    isEnabled: boolean,
    translations?: SectionTranslations<WebsiteSectionContent>
  ): Promise<WebsiteSection> {
    // Leaving `translations` undefined keeps whatever is already stored.
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
        ...(translations ? { translations } : {}),
      },
      create: {
        websiteId,
        type,
        isEnabled,
        position: getSectionPosition(type),
        content,
        ...(translations ? { translations } : {}),
      },
    })

    return this.toWebsiteSection(section)
  }

  async upsertHomeSection(
    websiteId: string,
    content: HomeSectionContent,
    translations?: SectionTranslations<HomeSectionContent>
  ): Promise<WebsiteSection> {
    return this.upsertByType(websiteId, SectionType.HOME, content, true, translations)
  }

  private toWebsiteSection(section: {
    id: string
    websiteId: string
    type: WebsiteSection['type']
    isEnabled: boolean
    position: number
    content: unknown
    translations?: unknown
    createdAt: Date
    updatedAt: Date
  }): WebsiteSection {
    // Content shape is keyed off `type`; parse it with the matching schema.
    const { translations, ...rest } = section
    const parsedTranslations = parseSectionTranslations(section.type, translations)
    return {
      ...rest,
      content: parseSectionContent(section.type, section.content),
      ...(parsedTranslations ? { translations: parsedTranslations } : {}),
    } as WebsiteSection
  }
}
