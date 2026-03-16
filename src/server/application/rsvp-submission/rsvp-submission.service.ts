/**
 * RSVP Submission Application Service
 *
 * Handles the complete RSVP submission flow from the guest-facing website.
 * Orchestrates multiple domains:
 * - Invitation domain (RSVP status updates)
 * - Question domain (answer submissions)
 *
 * This service was extracted from the Website domain service to properly
 * separate cross-domain orchestration concerns.
 *
 * TODO: ARCHITECTURAL VIOLATION - This service directly accesses PrismaClient
 * instead of using repositories/services. It should inject InvitationService
 * and QuestionService and use their methods instead of direct DB access.
 * See ARCHITECTURAL_VIOLATIONS.md for details.
 */

// biome-ignore lint/style/noRestrictedImports: architectural violation, tracked in ARCHITECTURAL_VIOLATIONS.md
import type { Prisma, PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type {
  SubmitPublicRsvpSchemaInput,
  SubmitRsvpSchemaInput,
} from '~/server/application/rsvp-submission/rsvp-submission.validator'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

// Re-use types from validator for internal use
type RsvpResponse = SubmitRsvpSchemaInput['rsvpResponses'][number]
type AnswerToQuestion = SubmitRsvpSchemaInput['answersToQuestions'][number]

const TOKEN_EXPIRY_DAYS = 90

export class RsvpSubmissionService {
  constructor(private db: PrismaClient) {}

  async submitManagedRsvp(
    ctx: AuthzContext,
    weddingId: string,
    data: SubmitRsvpSchemaInput
  ): Promise<{ success: boolean }> {
    await requirePermission(
      ctx,
      { rsvp: ['edit_response'] },
      { organizationId: ctx.sessionActiveOrganizationId ?? undefined }
    )
    await this.ensureSubmissionBelongsToWedding(weddingId, data)
    return this.submitRsvp(data)
  }

  async submitPublicRsvp(data: SubmitPublicRsvpSchemaInput): Promise<{ success: boolean }> {
    const weddingId = await this.getWeddingIdFromValidToken(data.subUrl, data.token)
    await this.ensureSubmissionBelongsToWedding(weddingId, data)

    return this.submitRsvp({
      rsvpResponses: data.rsvpResponses,
      answersToQuestions: data.answersToQuestions,
    })
  }

  /**
   * Submit RSVP form responses
   *
   * This is a transactional operation that:
   * 1. Updates invitation RSVP statuses for all guests/events
   * 2. Processes question answers (both text and option types)
   *
   * The transaction ensures all updates succeed or all fail together.
   */
  async submitRsvp(data: SubmitRsvpSchemaInput): Promise<{ success: boolean }> {
    await this.db.$transaction(async (prisma: Prisma.TransactionClient) => {
      // 1. Update RSVP statuses for all invitations
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

      // 2. Process question answers
      await Promise.all(
        data.answersToQuestions.map(async (answer: AnswerToQuestion) => {
          if (answer.questionType === 'Option') {
            // Handle option-based questions
            await this.processOptionAnswer(prisma, answer)
          } else {
            // Handle text-based questions
            await this.processTextAnswer(prisma, answer)
          }
        })
      )
    })

    return { success: true }
  }

  /**
   * Process an option-based question answer
   *
   * Handles three cases:
   * 1. New response - creates option response and increments count
   * 2. Changed response - updates option response and adjusts counts
   * 3. Same response - no action needed
   */
  private async processOptionAnswer(
    prisma: Prisma.TransactionClient,
    answer: AnswerToQuestion
  ): Promise<void> {
    // Find existing option response
    const existingResponse = await prisma.optionResponse.findFirst({
      where: {
        AND: [
          { questionId: answer.questionId ?? '-1' },
          {
            OR: [{ guestId: answer.guestId ?? -1 }, { householdId: answer.householdId ?? '-1' }],
          },
        ],
      },
    })

    if (existingResponse === null) {
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

      // Increment option count
      await prisma.option.update({
        where: { id: answer.response },
        data: {
          responseCount: { increment: 1 },
        },
      })
    } else if (existingResponse.optionId !== answer.response) {
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
        where: { id: existingResponse.optionId },
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
    // If same response, no action needed
  }

  /**
   * Process a text-based question answer
   *
   * Uses upsert to create or update the answer.
   */
  private async processTextAnswer(
    prisma: Prisma.TransactionClient,
    answer: AnswerToQuestion
  ): Promise<void> {
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

  private async getWeddingIdFromValidToken(subUrl: string, token: string): Promise<string> {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() - TOKEN_EXPIRY_DAYS)

    const wedding = await this.db.wedding.findFirst({
      where: {
        selfFillToken: token,
        website: { is: { subUrl } },
        OR: [
          { selfFillTokenGeneratedAt: { equals: null } },
          { selfFillTokenGeneratedAt: { gte: expiryDate } },
        ],
      },
      select: { id: true },
    })

    if (!wedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid or expired RSVP token',
      })
    }

    return wedding.id
  }

  private async ensureSubmissionBelongsToWedding(
    weddingId: string,
    data: Pick<SubmitRsvpSchemaInput, 'rsvpResponses' | 'answersToQuestions'>
  ): Promise<void> {
    if (data.rsvpResponses.length > 0) {
      const invitationCount = await this.db.invitation.count({
        where: {
          weddingId,
          OR: data.rsvpResponses.map((response) => ({
            guestId: response.guestId,
            eventId: response.eventId,
          })),
        },
      })

      if (invitationCount !== data.rsvpResponses.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope for token',
        })
      }
    }

    const guestIds = new Set<number>()
    const householdIds = new Set<string>()

    for (const response of data.rsvpResponses) {
      guestIds.add(response.guestId)
    }

    for (const answer of data.answersToQuestions) {
      if (typeof answer.guestId === 'number') {
        guestIds.add(answer.guestId)
      }

      if (typeof answer.householdId === 'string') {
        householdIds.add(answer.householdId)
      }
    }

    if (guestIds.size > 0) {
      const guestCount = await this.db.guest.count({
        where: {
          weddingId,
          id: { in: Array.from(guestIds) },
        },
      })

      if (guestCount !== guestIds.size) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope for token',
        })
      }
    }

    if (householdIds.size > 0) {
      const householdCount = await this.db.household.count({
        where: {
          weddingId,
          id: { in: Array.from(householdIds) },
        },
      })

      if (householdCount !== householdIds.size) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope for token',
        })
      }
    }
  }
}
