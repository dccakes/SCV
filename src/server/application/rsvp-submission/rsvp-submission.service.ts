/**
 * RSVP Submission Application Service
 *
 * Handles the complete RSVP submission flow from the guest-facing website.
 * Orchestrates multiple domains:
 * - Invitation domain (RSVP status updates)
 * - Question domain (answer submissions)
 * - Wedding domain (public token validation)
 */

// biome-ignore lint/style/noRestrictedImports: Application services use PrismaClient for cross-domain transactions
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type {
  SubmitPublicRsvpSchemaInput,
  SubmitRsvpSchemaInput,
} from '~/server/application/rsvp-submission/rsvp-submission.validator'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { QuestionRepository } from '~/server/domains/question/question.repository'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'

// Re-use types from validator for internal use
type RsvpResponse = SubmitRsvpSchemaInput['rsvpResponses'][number]
type AnswerToQuestion = SubmitRsvpSchemaInput['answersToQuestions'][number]

export class RsvpSubmissionService {
  constructor(
    private invitationRepo: InvitationRepository,
    _questionRepo: QuestionRepository,
    private guestRepo: GuestRepository,
    private householdRepo: HouseholdRepository,
    _weddingRepo: WeddingRepository,
    private db: PrismaClient
  ) {}

  async submitManagedRsvp(
    ctx: AuthzContext,
    weddingId: string,
    data: SubmitRsvpSchemaInput
  ): Promise<{ success: boolean }> {
    requirePermission(ctx, { rsvp: ['edit_response'] })
    await this.ensureSubmissionBelongsToWedding(weddingId, data)
    return this.submitRsvp(data)
  }

  async submitPublicRsvp(data: SubmitPublicRsvpSchemaInput): Promise<{ success: boolean }> {
    const { householdId, weddingId } = await this.getHouseholdFromRsvpToken(
      data.subUrl,
      data.rsvpToken
    )
    await this.ensureSubmissionBelongsToHousehold(householdId, weddingId, data)

    return this.submitRsvp({
      rsvpResponses: data.rsvpResponses,
      answersToQuestions: data.answersToQuestions,
    })
  }

  async submitRsvp(data: SubmitRsvpSchemaInput): Promise<{ success: boolean }> {
    await this.db.$transaction(async (tx) => {
      const txInvitationRepo = new InvitationRepository(tx)
      const txQuestionRepo = new QuestionRepository(tx)

      await Promise.all(
        data.rsvpResponses.map(async (response: RsvpResponse) => {
          await txInvitationRepo.update(response.guestId, response.eventId, {
            rsvp: response.rsvp,
            submittedAt: new Date(),
          })
        })
      )

      await Promise.all(
        data.answersToQuestions.map(async (answer: AnswerToQuestion) => {
          if (answer.questionType === 'Option') {
            await this.processOptionAnswer(txQuestionRepo, answer)
          } else {
            await this.processTextAnswer(txQuestionRepo, answer)
          }
        })
      )
    })

    return { success: true }
  }

  private async processOptionAnswer(
    questionRepo: QuestionRepository,
    answer: AnswerToQuestion
  ): Promise<void> {
    const guestId = answer.guestId ?? -1
    const householdId = answer.householdId ?? '-1'

    await questionRepo.deleteAnswer(answer.questionId, guestId, householdId)

    const existingResponse = await questionRepo.findOptionResponse(
      answer.questionId,
      guestId,
      householdId
    )

    if (existingResponse === null) {
      await questionRepo.upsertOptionResponse({
        questionId: answer.questionId,
        optionId: answer.response,
        guestId,
        guestFirstName: answer.guestFirstName,
        guestLastName: answer.guestLastName,
        householdId,
      })
      await questionRepo.adjustOptionResponseCount(answer.response, 1)
      return
    }

    if (existingResponse.optionId !== answer.response) {
      await questionRepo.upsertOptionResponse({
        questionId: answer.questionId,
        optionId: answer.response,
        guestId,
        guestFirstName: answer.guestFirstName,
        guestLastName: answer.guestLastName,
        householdId,
      })
      await questionRepo.adjustOptionResponseCount(existingResponse.optionId, -1)
      await questionRepo.adjustOptionResponseCount(answer.response, 1)
    }
  }

  private async processTextAnswer(
    questionRepo: QuestionRepository,
    answer: AnswerToQuestion
  ): Promise<void> {
    const guestId = answer.guestId ?? -1
    const householdId = answer.householdId ?? '-1'
    const existingResponse = await questionRepo.findOptionResponse(
      answer.questionId,
      guestId,
      householdId
    )

    if (existingResponse !== null) {
      await questionRepo.deleteOptionResponse(answer.questionId, guestId, householdId)
      await questionRepo.adjustOptionResponseCount(existingResponse.optionId, -1)
    }

    await questionRepo.upsertAnswer({
      questionId: answer.questionId,
      guestId,
      householdId,
      response: answer.response,
      guestFirstName: answer.guestFirstName,
      guestLastName: answer.guestLastName,
    })
  }

  private async ensureSubmissionBelongsToWedding(
    weddingId: string,
    data: Pick<SubmitRsvpSchemaInput, 'rsvpResponses' | 'answersToQuestions'>
  ): Promise<void> {
    if (data.rsvpResponses.length > 0) {
      const invitationCount = await this.invitationRepo.countByWeddingAndGuestEventPairs(
        weddingId,
        data.rsvpResponses.map((response) => ({
          guestId: response.guestId,
          eventId: response.eventId,
        }))
      )

      if (invitationCount !== data.rsvpResponses.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope',
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
      const guestCount = await this.guestRepo.countByIdsInWedding(weddingId, Array.from(guestIds))

      if (guestCount !== guestIds.size) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope',
        })
      }
    }

    if (householdIds.size > 0) {
      const householdCount = await this.householdRepo.countByIdsInWedding(
        weddingId,
        Array.from(householdIds)
      )

      if (householdCount !== householdIds.size) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope',
        })
      }
    }
  }

  private async getHouseholdFromRsvpToken(
    subUrl: string,
    rsvpToken: string
  ): Promise<{ householdId: string; weddingId: string }> {
    const household = await this.db.household.findFirst({
      where: {
        rsvpToken,
        wedding: { website: { subUrl } },
      },
      select: { id: true, weddingId: true },
    })

    if (!household) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid or expired RSVP token',
      })
    }

    return { householdId: household.id, weddingId: household.weddingId }
  }

  private async ensureSubmissionBelongsToHousehold(
    householdId: string,
    weddingId: string,
    data: Pick<SubmitRsvpSchemaInput, 'rsvpResponses' | 'answersToQuestions'>
  ): Promise<void> {
    if (data.rsvpResponses.length > 0) {
      const invitationCount = await this.db.invitation.count({
        where: {
          weddingId,
          guest: { householdId },
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
          householdId,
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
          id: householdId,
          AND: { id: { in: Array.from(householdIds) } },
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
