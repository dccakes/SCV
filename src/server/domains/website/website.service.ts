/**
 * Website Domain - Service
 *
 * Business logic for the Website domain.
 * Handles website creation, updates, and public data fetching.
 *
 * Note: The website creation process involves cross-domain operations
 * (creating User and Event). This is kept here for Phase 1, but could
 * be moved to an Application Service in the future.
 */

import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'
import { type PrismaClient, type Prisma } from '@prisma/client'

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'

import {
  type Website,
  type CreateWebsiteInput,
  type UpdateWebsiteInput,
  type WeddingPageData,
} from './website.types'
import { type WebsiteRepository } from './website.repository'
import { type RsvpResponse, type AnswerToQuestion, type SubmitRsvpSchemaInput } from './website.validator'

export class WebsiteService {
  constructor(
    private websiteRepository: WebsiteRepository,
    private db: PrismaClient
  ) {}

  /**
   * Create a new website and associated user/event
   *
   * This is a cross-domain operation that creates:
   * 1. A default "Wedding Day" event
   * 2. The user profile with wedding couple info
   * 3. The website with default questions
   */
  async createWebsite(userId: string, data: CreateWebsiteInput): Promise<Website> {
    const { firstName, lastName, partnerFirstName, partnerLastName, basePath, email } = data

    const subUrl = `${firstName}${lastName}and${partnerFirstName}${partnerLastName}`.toLowerCase()
    const url = `${basePath}/${subUrl}`

    // TODO: Check for duplicate URLs

    // Create default Wedding Day event
    await this.db.event.create({
      data: {
        name: 'Wedding Day',
        userId,
        collectRsvp: true,
      },
    })

    // Create user profile with wedding couple info
    await this.db.user.create({
      data: {
        id: userId,
        websiteUrl: url,
        email,
        groomFirstName: firstName,
        groomLastName: lastName,
        brideFirstName: partnerFirstName,
        brideLastName: partnerLastName,
      },
    })

    // Create website with default questions
    return this.websiteRepository.create({
      userId,
      url,
      subUrl,
      groomFirstName: firstName,
      groomLastName: lastName,
      brideFirstName: partnerFirstName,
      brideLastName: partnerLastName,
    })
  }

  /**
   * Update website settings
   */
  async updateWebsite(userId: string, data: UpdateWebsiteInput): Promise<Website> {
    const url = data.subUrl !== undefined ? `${data.basePath}/${data.subUrl}` : undefined

    // Also update the user's website URL
    await this.db.user.update({
      where: { id: userId },
      data: { websiteUrl: url },
    })

    return this.websiteRepository.update(userId, {
      isPasswordEnabled: data.isPasswordEnabled,
      password: data.password,
      subUrl: data.subUrl,
      url,
    })
  }

  /**
   * Update RSVP enabled status
   */
  async updateRsvpEnabled(websiteId: string, isRsvpEnabled: boolean): Promise<Website> {
    return this.websiteRepository.updateRsvpEnabled(websiteId, isRsvpEnabled)
  }

  /**
   * Update cover photo
   */
  async updateCoverPhoto(userId: string, coverPhotoUrl: string | null): Promise<Website> {
    return this.websiteRepository.updateCoverPhoto(userId, coverPhotoUrl)
  }

  /**
   * Get website by user ID
   */
  async getByUserId(userId: string | null): Promise<Website | null> {
    if (!userId) {
      return null
    }
    return this.websiteRepository.findByUserId(userId)
  }

  /**
   * Get website by sub URL
   */
  async getBySubUrl(subUrl: string | null | undefined): Promise<Website | null> {
    if (!subUrl) {
      return null
    }
    return this.websiteRepository.findBySubUrl(subUrl)
  }

  /**
   * Fetch complete wedding data for public website display
   */
  async fetchWeddingData(subUrl: string): Promise<WeddingPageData> {
    // Get website with general questions
    const website = await this.websiteRepository.findBySubUrlWithQuestions(subUrl)

    if (!website) {
      throw new TRPCClientError('This website does not exist.')
    }

    // Get the wedding user
    const weddingUser = await this.db.user.findFirst({
      where: { id: website.userId },
    })

    if (!weddingUser) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch wedding website data.',
      })
    }

    // Get all events for this user with their questions
    const events = await this.db.event.findMany({
      where: { userId: website.userId },
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

    // Find the wedding date from the Wedding Day event
    const weddingDateEvent = events.find((event) => event.name === 'Wedding Day')
    const weddingDate = weddingDateEvent?.date

    return {
      groomFirstName: weddingUser.groomFirstName,
      groomLastName: weddingUser.groomLastName,
      brideFirstName: weddingUser.brideFirstName,
      brideLastName: weddingUser.brideLastName,
      date: {
        standardFormat: weddingDate?.toLocaleDateString('en-us', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        numberFormat: formatDateNumber(weddingDate),
      },
      website,
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
        userId: event.userId,
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
              invitationId: {
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
}
