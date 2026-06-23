import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'
import { deriveWeddingSubUrl } from '~/lib/website-slug'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { CreateWebsiteInput } from '~/server/domains/website'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import type {
  PublicWebsiteWithQuestions,
  Website,
  WebsiteWithQuestions,
  WeddingPageData,
} from '~/server/domains/website/website.types'
import type { WebsitePasswordService } from '~/server/domains/website/website-password.service'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'

export class WebsiteManagementService {
  constructor(
    private websiteRepository: WebsiteRepository,
    private weddingRepository: WeddingRepository,
    private eventRepository: EventRepository,
    private websitePasswordService: Pick<WebsitePasswordService, 'verifyAccessToken'>
  ) {}

  async enableWebsite(
    ctx: AuthzContext,
    weddingId: string,
    data: CreateWebsiteInput
  ): Promise<Website> {
    requirePermission(ctx, { website: ['publish'] })

    const wedding = await this.weddingRepository.findById(weddingId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const subUrl =
      data.subUrl && data.subUrl.length > 0 ? data.subUrl : deriveWeddingSubUrl(wedding)
    const url = `${data.basePath}/${subUrl}`

    const existingWebsite = await this.websiteRepository.findBySubUrl(subUrl)
    if (existingWebsite) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This URL is already taken',
      })
    }

    return this.websiteRepository.create({
      weddingId,
      url,
      subUrl,
    })
  }

  async fetchWeddingData(
    subUrl: string,
    accessToken: string | undefined
  ): Promise<WeddingPageData> {
    const website = await this.websiteRepository.findBySubUrlWithQuestions(subUrl)
    if (!website) {
      throw new TRPCClientError('This website does not exist.')
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

    const wedding = await this.weddingRepository.findById(website.weddingId)
    if (!wedding) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch wedding data.',
      })
    }

    const events = await this.eventRepository.findByWeddingIdWithQuestions(website.weddingId)
    const weddingDate = events.find((event) => event.name === 'Wedding Day')?.date

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
      website: this.toPublicWebsiteWithQuestions(website),
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

  private toPublicWebsiteWithQuestions(website: WebsiteWithQuestions): PublicWebsiteWithQuestions {
    const { password: _password, ...publicWebsite } = website
    return publicWebsite
  }
}
