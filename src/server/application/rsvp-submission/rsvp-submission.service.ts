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
    private weddingRepo: WeddingRepository,
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
    const weddingId = await this.resolvePublicSubmitWeddingId(data.subUrl, data.token)
    await this.ensureSubmissionBelongsToWedding(weddingId, data)

    return this.submitRsvp({
      rsvpResponses: data.rsvpResponses,
      answersToQuestions: data.answersToQuestions,
    })
  }

  /**
   * Resolve the wedding a public RSVP submission belongs to.
   *
   * Guests reach the RSVP form from the wedding website (name search or
   * save-the-date recognition), so the submission is scoped by the website's
   * subUrl — mirroring the public name search. A shared self-fill link may still
   * carry a token, which is honored as a fallback. The submission is separately
   * verified to belong to this wedding in `ensureSubmissionBelongsToWedding`.
   */
  private async resolvePublicSubmitWeddingId(
    subUrl: string,
    token: string | undefined
  ): Promise<string> {
    const website = await this.db.website.findFirst({
      where: { subUrl },
      select: { weddingId: true, isRsvpEnabled: true },
    })

    if (website?.isRsvpEnabled) {
      return website.weddingId
    }

    if (token) {
      return this.getWeddingIdFromValidToken(subUrl, token)
    }

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'RSVP is not available for this wedding',
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

  private async getWeddingIdFromValidToken(subUrl: string, token: string): Promise<string> {
    const weddingId = await this.weddingRepo.findWeddingIdByValidTokenAndSubUrl(subUrl, token)

    if (!weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid or expired RSVP token',
      })
    }

    return weddingId
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
      const guestCount = await this.guestRepo.countByIdsInWedding(weddingId, Array.from(guestIds))

      if (guestCount !== guestIds.size) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid RSVP submission scope for token',
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
          message: 'Invalid RSVP submission scope for token',
        })
      }
    }
  }
}
