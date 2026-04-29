import { TRPCError } from '@trpc/server'

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import type {
  PublicWebsiteWithQuestions,
  Website,
  WebsiteWithQuestions,
  WeddingPageData,
} from '~/server/domains/website/website.types'
import { computeWebsiteUrl } from '~/server/domains/website/website.utils'
import type { WebsitePasswordService } from '~/server/domains/website/website-password.service'
import type { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'

export class WebsiteManagementService {
  constructor(
    private websiteRepository: WebsiteRepository,
    private weddingRepository: WeddingRepository,
    private eventRepository: EventRepository,
    private websitePasswordService: Pick<WebsitePasswordService, 'verifyAccessToken'>,
    private websiteSectionRepository: Pick<
      WebsiteSectionRepository,
      'findByWebsiteIdAndType' | 'upsertHomeSection'
    >
  ) {}

  async enableWebsite(ctx: AuthzContext, weddingId: string): Promise<Website> {
    requirePermission(ctx, { website: ['publish'] })

    const wedding = await this.weddingRepository.findById(weddingId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const subUrl =
      `${wedding.groomFirstName}${wedding.groomLastName}and${wedding.brideFirstName}${wedding.brideLastName}`.toLowerCase()
    const existingSubUrlWebsite = await this.websiteRepository.findBySubUrl(subUrl)
    if (existingSubUrlWebsite && existingSubUrlWebsite.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This URL is already taken',
      })
    }

    if (existingSubUrlWebsite) {
      return existingSubUrlWebsite
    }

    try {
      return await this.websiteRepository.upsertByWeddingId({
        weddingId,
        subUrl,
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        const website = await this.websiteRepository.findByWeddingId(weddingId)
        if (website) {
          return website
        }

        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This URL is already taken',
        })
      }

      throw error
    }
  }

  async getHomeSection(ctx: AuthzContext, weddingId: string) {
    requirePermission(ctx, { website: ['read'] })

    const website = await this.websiteRepository.findByWeddingId(weddingId)
    if (!website) {
      return null
    }

    return this.websiteSectionRepository.findByWebsiteIdAndType(website.id, WebsiteSectionType.HOME)
  }

  async updateHomeSection(ctx: AuthzContext, weddingId: string, input: { introText: string }) {
    requirePermission(ctx, { website: ['update'] })

    const website = await this.websiteRepository.findByWeddingId(weddingId)
    if (!website) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Website not found',
      })
    }

    return this.websiteSectionRepository.upsertHomeSection(website.id, input)
  }

  async fetchWeddingData(
    subUrl: string,
    accessToken: string | undefined
  ): Promise<WeddingPageData> {
    const website = await this.websiteRepository.findBySubUrlWithQuestions(subUrl)
    if (!website) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'This website does not exist.',
      })
    }

    if (website.isPasswordEnabled) {
      const hasAccess = this.websitePasswordService.verifyAccessToken(
        accessToken,
        website.id,
        website.password
      )

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Password access required for this wedding website',
        })
      }
    }

    const [wedding, events, homeSection] = await Promise.all([
      this.weddingRepository.findById(website.weddingId),
      this.eventRepository.findByWeddingIdWithQuestions(website.weddingId),
      this.websiteSectionRepository.findByWebsiteIdAndType(website.id, WebsiteSectionType.HOME),
    ])
    if (!wedding) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch wedding data.',
      })
    }
    const weddingDate = events.find((event) => event.name === 'Wedding Day')?.date
    const introText = homeSection?.isEnabled ? homeSection.content.introText : ''

    return {
      groomFirstName: wedding.groomFirstName,
      groomLastName: wedding.groomLastName,
      brideFirstName: wedding.brideFirstName,
      brideLastName: wedding.brideLastName,
      date: {
        standardFormat: weddingDate?.toLocaleDateString('en-us', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        numberFormat: formatDateNumber(weddingDate),
      },
      websiteBuilderEnabled: wedding.enabledAddOns.includes('website_builder'),
      website: this.toPublicWebsiteWithQuestions(website, introText),
      daysRemaining: calculateDaysRemaining(weddingDate) ?? -1,
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        attire: event.attire,
        description: event.description,
        weddingId: event.weddingId,
        collectRsvp: event.collectRsvp,
        questions: event.questions,
      })),
    }
  }

  private toPublicWebsiteWithQuestions(
    website: WebsiteWithQuestions,
    introText: string
  ): PublicWebsiteWithQuestions & { introText: string } {
    const { password: _password, ...publicWebsite } = website
    return {
      ...publicWebsite,
      url: computeWebsiteUrl(website.subUrl),
      introText,
    }
  }
}
