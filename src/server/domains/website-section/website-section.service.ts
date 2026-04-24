import { TRPCError } from '@trpc/server'
import type { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'
import {
  createWebsiteSectionSchema,
  updateHomeSectionSchema,
} from '~/server/domains/website-section/website-section.validator'

export class WebsiteSectionService {
  constructor(private websiteSectionRepository: WebsiteSectionRepository) {}

  async createHomeSection(websiteId: string) {
    return this.websiteSectionRepository.create(
      createWebsiteSectionSchema.parse({
        websiteId,
        type: WebsiteSectionType.HOME,
        isEnabled: true,
        position: 0,
        content: { introText: '' },
      })
    )
  }

  async getByWebsiteId(websiteId: string) {
    return this.websiteSectionRepository.findByWebsiteId(websiteId)
  }

  async getHomeSection(websiteId: string) {
    return this.websiteSectionRepository.findByWebsiteIdAndType(websiteId, WebsiteSectionType.HOME)
  }

  async updateHomeSection(websiteId: string, input: { introText: string }) {
    const parsed = updateHomeSectionSchema.safeParse(input)
    if (!parsed.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: parsed.error.issues[0]?.message ?? 'Invalid HOME section content',
      })
    }

    const content = parsed.data
    const existingSection = await this.websiteSectionRepository.findByWebsiteIdAndType(
      websiteId,
      WebsiteSectionType.HOME
    )

    if (!existingSection) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'HOME section not found',
      })
    }

    return this.websiteSectionRepository.update(existingSection.id, {
      content,
    })
  }
}
