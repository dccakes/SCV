/**
 * Website Domain - Service
 *
 * Business logic for the Website domain.
 * Handles website creation, updates, and public data fetching.
 *
 * Note: The website creation process involves cross-domain operations
 * (creating User and Event). This is kept here for Phase 1, but could
 * be moved to an Application Service in the future.
 *
 * TODO: ARCHITECTURAL VIOLATION - This service directly accesses PrismaClient
 * for cross-domain queries (wedding data, complex includes). It should inject
 * WeddingRepository and create repository methods for complex queries like
 * getPublicPageBySubUrl(). See ARCHITECTURAL_VIOLATIONS.md for details.
 */

// biome-ignore lint/style/noRestrictedImports: architectural violation, tracked in ARCHITECTURAL_VIOLATIONS.md
import type { Prisma, PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import type {
  CreateWebsiteInput,
  PublicWebsite,
  PublicWebsiteWithQuestions,
  UpdateWebsiteInput,
  Website,
  WebsiteWithQuestions,
  WeddingPageData,
} from '~/server/domains/website/website.types'
import type {
  AnswerToQuestion,
  RsvpResponse,
  SubmitRsvpSchemaInput,
} from '~/server/domains/website/website.validator'
import { WebsitePasswordService } from '~/server/domains/website/website-password.service'

export class WebsiteService {
  constructor(
    private websiteRepository: WebsiteRepository,
    private db: PrismaClient,
    private websitePasswordService: WebsitePasswordService = new WebsitePasswordService()
  ) {}

  /**
   * Enable website add-on for a wedding
   *
   * Creates the website configuration and generates URL from wedding details.
   * Note: Wedding must already exist. This is called when user enables the website add-on.
   */
  async enableWebsite(
    ctx: AuthzContext,
    weddingId: string,
    data: CreateWebsiteInput
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'publish')

    const { basePath } = data

    // Get wedding to generate URL
    const wedding = await this.db.wedding.findUnique({
      where: { id: weddingId },
    })

    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    // Generate URL from wedding couple names
    const subUrl =
      `${wedding.groomFirstName}${wedding.groomLastName}and${wedding.brideFirstName}${wedding.brideLastName}`.toLowerCase()
    const url = `${basePath}/${subUrl}`

    // Check for duplicate URLs
    const existingWebsite = await this.websiteRepository.findBySubUrl(subUrl)
    if (existingWebsite) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This URL is already taken',
      })
    }

    // Create website with default questions
    return this.websiteRepository.create({
      weddingId,
      url,
      subUrl,
    })
  }

  /**
   * Update website settings
   */
  async updateWebsite(
    ctx: AuthzContext,
    weddingId: string,
    data: UpdateWebsiteInput
  ): Promise<Website> {
    const updateRequiresContentPermission = data.subUrl !== undefined || data.basePath !== undefined
    const updateRequiresPasswordPermission =
      data.password !== undefined || data.isPasswordEnabled !== undefined

    if (!updateRequiresContentPermission && !updateRequiresPasswordPermission) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'At least one website setting must be provided',
      })
    }

    if (updateRequiresContentPermission) {
      this.requireWebsitePermission(ctx, 'update')
    }

    if (updateRequiresPasswordPermission) {
      this.requireWebsitePermission(ctx, 'password_update')
    }

    const url = data.subUrl !== undefined ? `${data.basePath}/${data.subUrl}` : undefined
    const password = data.password
      ? this.websitePasswordService.hashPassword(data.password)
      : undefined

    return this.websiteRepository.update(weddingId, {
      isPasswordEnabled: data.isPasswordEnabled,
      password,
      subUrl: data.subUrl,
      url,
    })
  }

  /**
   * Update RSVP enabled status
   */
  async updateRsvpEnabled(
    ctx: AuthzContext,
    weddingId: string,
    websiteId: string,
    isRsvpEnabled: boolean
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'publish')

    const belongsToWedding = await this.websiteRepository.belongsToWedding(websiteId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this website',
      })
    }

    return this.websiteRepository.updateRsvpEnabled(websiteId, isRsvpEnabled)
  }

  /**
   * Update cover photo
   */
  async updateCoverPhoto(
    ctx: AuthzContext,
    weddingId: string,
    coverPhotoUrl: string | null
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'update')
    return this.websiteRepository.updateCoverPhoto(weddingId, coverPhotoUrl)
  }

  /**
   * Get website by wedding ID
   */
  async getByWeddingId(weddingId: string | null): Promise<Website | null> {
    if (!weddingId) {
      return null
    }
    return this.websiteRepository.findByWeddingId(weddingId)
  }

  /**
   * Get website by sub URL
   */
  async getBySubUrl(subUrl: string | null | undefined): Promise<PublicWebsite | null> {
    if (!subUrl) {
      return null
    }
    const website = await this.websiteRepository.findBySubUrl(subUrl)
    if (!website) {
      return null
    }

    return this.toPublicWebsite(website)
  }

  async hasPasswordAccess(subUrl: string, accessToken: string | undefined): Promise<boolean> {
    const website = await this.websiteRepository.findBySubUrl(subUrl)
    if (!website) {
      return false
    }

    if (!website.isPasswordEnabled) {
      return true
    }

    return this.websitePasswordService.verifyAccessToken(accessToken, website.id, website.password)
  }

  async verifyWebsitePassword(subUrl: string, inputPassword: string): Promise<string | null> {
    const website = await this.websiteRepository.findBySubUrl(subUrl)

    if (!website?.isPasswordEnabled) {
      return null
    }

    const isValidPassword = this.websitePasswordService.verifyPassword(
      inputPassword,
      website.password
    )
    if (!isValidPassword) {
      return null
    }

    if (!website.password) {
      return null
    }

    return this.websitePasswordService.createAccessToken(website.id, website.password)
  }

  /**
   * Fetch complete wedding data for public website display
   */
  async fetchWeddingData(
    subUrl: string,
    accessToken: string | undefined
  ): Promise<WeddingPageData> {
    // Get website with general questions
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

    // Get the wedding entity (couple names live here now)
    const wedding = await this.db.wedding.findUnique({
      where: { id: website.weddingId },
    })

    if (!wedding) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch wedding data.',
      })
    }

    // Get all events for this wedding with their questions
    const events = await this.db.event.findMany({
      where: { weddingId: website.weddingId },
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
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

    // Get wedding date from Wedding Day event
    // TODO: Once weddingDate field is added to Wedding model, use: wedding.weddingDate ?? events.find(...)?.date
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

  /**
   * Submit RSVP form responses
   *
   * This is a cross-domain operation that:
   * 1. Updates invitation RSVP statuses
   * 2. Processes question answers (both text and option types)
   *
   * Note: This will be moved to an RSVP Submission Application Service in Phase 4
   */
  async submitRsvpForm(data: SubmitRsvpSchemaInput): Promise<void> {
    await this.db.$transaction(async (prisma: Prisma.TransactionClient) => {
      // Update RSVP statuses for all invitations
      await Promise.all(
        data.rsvpResponses.map(async (response: RsvpResponse) => {
          await prisma.invitation.update({
            where: {
              guestId_eventId: {
                guestId: response.guestId,
                eventId: response.eventId,
              },
            },
            data: { rsvp: response.rsvp },
          })
        })
      )

      // Process question answers
      await Promise.all(
        data.answersToQuestions.map(async (answer: AnswerToQuestion) => {
          if (answer.questionType === 'Option') {
            // Handle option-based questions
            const optionResponse = await prisma.optionResponse.findFirst({
              where: {
                AND: [
                  { questionId: answer.questionId ?? '-1' },
                  {
                    OR: [
                      { guestId: answer.guestId ?? -1 },
                      { householdId: answer.householdId ?? '-1' },
                    ],
                  },
                ],
              },
            })

            if (optionResponse === null) {
              // Create new option response
              await prisma.optionResponse.create({
                data: {
                  questionId: answer.questionId,
                  optionId: answer.response,
                  guestId: answer.guestId ?? -1,
                  guestFirstName: answer.guestFirstName,
                  guestLastName: answer.guestLastName,
                  householdId: answer.householdId ?? '-1',
                },
              })
              await prisma.option.update({
                where: { id: answer.response },
                data: {
                  responseCount: { increment: 1 },
                },
              })
            } else if (optionResponse.optionId !== answer.response) {
              // Update existing option response if selection changed
              await prisma.optionResponse.update({
                where: {
                  optionResponseId: {
                    questionId: answer.questionId ?? '-1',
                    guestId: answer.guestId ?? -1,
                    householdId: answer.householdId ?? '-1',
                  },
                },
                data: { optionId: answer.response },
              })
              // Decrement old option count
              await prisma.option.update({
                where: { id: optionResponse.optionId },
                data: {
                  responseCount: { decrement: 1 },
                },
              })
              // Increment new option count
              await prisma.option.update({
                where: { id: answer.response },
                data: {
                  responseCount: { increment: 1 },
                },
              })
            }
          } else {
            // Handle text-based questions
            await prisma.answer.upsert({
              where: {
                answerId: {
                  questionId: answer.questionId,
                  guestId: answer.guestId ?? -1,
                  householdId: answer.householdId ?? '-1',
                },
              },
              update: { response: answer.response },
              create: {
                response: answer.response,
                questionId: answer.questionId,
                guestId: answer.guestId ?? -1,
                guestFirstName: answer.guestFirstName,
                guestLastName: answer.guestLastName,
                householdId: answer.householdId ?? '-1',
              },
            })
          }
        })
      )
    })
  }

  /**
   * Look up households by guest name — public, returns no email addresses
   */
  async lookupHouseholdByName(subUrl: string, name: string) {
    const website = await this.websiteRepository.findBySubUrl(subUrl)
    if (!website) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Wedding website not found' })
    }

    const households = await this.db.household.findMany({
      where: {
        weddingId: website.weddingId,
        OR: [
          {
            guests: {
              some: {
                firstName: { contains: name, mode: 'insensitive' },
                invitations: { some: { rsvp: { in: ['Invited', 'Attending', 'Declined'] } } },
              },
            },
          },
          {
            guests: {
              some: {
                lastName: { contains: name, mode: 'insensitive' },
                invitations: { some: { rsvp: { in: ['Invited', 'Attending', 'Declined'] } } },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isPrimaryContact: true,
            isTagAlong: true,
            invitations: {
              select: { eventId: true, rsvp: true },
            },
          },
        },
      },
    })

    return households.map((h) => {
      const primaryContact = h.guests.find((g) => g.isPrimaryContact)
      return {
        id: h.id,
        primaryContactHasEmail: !!primaryContact?.email,
        guests: h.guests.map(({ email: _email, ...g }) => g),
      }
    })
  }

  /**
   * Validate a household RSVP token and return household data
   */
  async validateRsvpToken(subUrl: string, rsvpToken: string) {
    const household = await this.db.household.findFirst({
      where: {
        rsvpToken,
        wedding: { website: { subUrl } },
      },
      select: {
        id: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isPrimaryContact: true,
            isTagAlong: true,
            invitations: { select: { eventId: true, rsvp: true } },
          },
        },
      },
    })

    if (!household) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid RSVP token' })
    }

    return {
      rsvpToken,
      household: { id: household.id, guests: household.guests },
    }
  }

  /**
   * Confirm household identity by name + email; returns rsvpToken on match
   */
  async confirmHouseholdIdentity(subUrl: string, householdId: string, email: string) {
    const household = await this.db.household.findFirst({
      where: {
        id: householdId,
        wedding: { website: { subUrl } },
      },
      select: {
        id: true,
        rsvpToken: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isPrimaryContact: true,
            isTagAlong: true,
            invitations: { select: { eventId: true, rsvp: true } },
          },
        },
      },
    })

    if (!household) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Household not found' })
    }

    const primaryContact = household.guests.find((g) => g.isPrimaryContact)
    if (!primaryContact?.email) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'No email on file. Please contact the couple to receive your personal RSVP link.',
      })
    }

    if (primaryContact.email.toLowerCase() !== email.toLowerCase().trim()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Email does not match our records. Please try again.',
      })
    }

    let { rsvpToken } = household
    if (!rsvpToken) {
      rsvpToken = randomUUID()
      await this.db.household.update({ where: { id: householdId }, data: { rsvpToken } })
    }

    return {
      rsvpToken,
      household: { id: household.id, guests: household.guests },
    }
  }

  /**
   * Update primary contact's email/phone — scoped by rsvpToken
   */
  async updateGuestContactInfo(
    subUrl: string,
    rsvpToken: string,
    data: { email?: string; phone?: string }
  ) {
    const household = await this.db.household.findFirst({
      where: {
        rsvpToken,
        wedding: { website: { subUrl } },
      },
      select: {
        guests: {
          where: { isPrimaryContact: true },
          select: { id: true },
        },
      },
    })

    if (!household) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid RSVP token' })
    }

    const primaryContact = household.guests[0]
    if (!primaryContact) {
      return { success: false }
    }

    await this.db.guest.update({
      where: { id: primaryContact.id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    })

    return { success: true }
  }

  private toPublicWebsite(website: Website): PublicWebsite {
    const { password: _password, ...publicWebsite } = website
    return publicWebsite
  }

  private toPublicWebsiteWithQuestions(website: WebsiteWithQuestions): PublicWebsiteWithQuestions {
    const { password: _password, ...publicWebsite } = website
    return publicWebsite
  }

  private requireWebsitePermission(
    ctx: AuthzContext,
    action: 'read' | 'update' | 'publish' | 'password_update'
  ): void {
    requirePermission(ctx, {
      website: [action],
    })
  }
}
