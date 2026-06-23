import type { PrismaClient } from '@prisma/client'

import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'
import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'
import {
  type CreateWebsiteSectionInput,
  homeSectionContentSchema,
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
    data: { content?: WebsiteSection['content']; isEnabled?: boolean; position?: number }
  ): Promise<WebsiteSection> {
    const section = await this.db.websiteSection.update({
      where: { id },
      data,
    })

    return this.toWebsiteSection(section)
  }

  async upsertHomeSection(
    websiteId: string,
    content: WebsiteSection['content']
  ): Promise<WebsiteSection> {
    const section = await this.db.websiteSection.upsert({
      where: {
        websiteId_type: {
          websiteId,
          type: WebsiteSectionType.HOME,
        },
      },
      update: {
        content,
        isEnabled: true,
      },
      create: {
        websiteId,
        type: WebsiteSectionType.HOME,
        isEnabled: true,
        position: 0,
        content,
      },
    })

    return this.toWebsiteSection(section)
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
    return {
      ...section,
      content: homeSectionContentSchema.parse(section.content),
    }
  }
}
