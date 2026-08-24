import { TRPCError } from '@trpc/server'
import type { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
import {
  type HomeSectionContent,
  type WebsiteSectionContent,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import {
  parseSectionContent,
  updateHomeSectionSchema,
} from '~/server/domains/website-section/website-section.validator'

export class WebsiteSectionService {
  constructor(private websiteSectionRepository: WebsiteSectionRepository) {}

  async createHomeSection(websiteId: string) {
    return this.websiteSectionRepository.create({
      websiteId,
      type: WebsiteSectionType.HOME,
      isEnabled: true,
      position: 0,
      content: { introText: '' },
    })
  }

  async getByWebsiteId(websiteId: string) {
    return this.websiteSectionRepository.findByWebsiteId(websiteId)
  }

  async getHomeSection(websiteId: string) {
    return this.websiteSectionRepository.findByWebsiteIdAndType(websiteId, WebsiteSectionType.HOME)
  }

  async updateHomeSection(websiteId: string, input: HomeSectionContent) {
    const parsed = updateHomeSectionSchema.safeParse(input)
    if (!parsed.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: parsed.error.issues[0]?.message ?? 'Invalid HOME section content',
      })
    }

    return this.websiteSectionRepository.upsertHomeSection(websiteId, parsed.data)
  }

  /**
   * Create or update any section type, validating the content against its
   * schema before persisting.
   */
  async upsertSection(
    websiteId: string,
    type: WebsiteSectionType,
    content: unknown,
    isEnabled: boolean
  ) {
    let validatedContent: WebsiteSectionContent
    try {
      validatedContent = parseSectionContent(type, content)
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : `Invalid content for ${type} section`,
      })
    }

    return this.websiteSectionRepository.upsertByType(websiteId, type, validatedContent, isEnabled)
  }
}
