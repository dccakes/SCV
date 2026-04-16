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
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { QuestionRepository } from '~/server/domains/question/question.repository'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'

// Re-use types from validator for internal use
type RsvpResponse = SubmitRsvpSchemaInput['rsvpResponses'][number]
type AnswerToQuestion = SubmitRsvpSchemaInput['answersToQuestions'][number]
type GuestDietaryResponse = NonNullable<SubmitRsvpSchemaInput['guestDietaryResponses']>[number]

export class RsvpSubmissionService {
  constructor(
    private invitationRepo: InvitationRepository,
    private questionRepo: QuestionRepository,
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
    const weddingId = await this.getWeddingIdFromValidToken(data.subUrl, data.token)
    await this.ensureSubmissionBelongsToWedding(weddingId, data)

    return this.submitRsvp({
      rsvpResponses: data.rsvpResponses,
      answersToQuestions: data.answersToQuestions,
      guestDietaryResponses: data.guestDietaryResponses,
    })
  }

  async submitRsvp(data: SubmitRsvpSchemaInput): Promise<{ success: boolean }> {
    await this.preValidateSubmission(data)

    await this.db.$transaction(async (tx) => {
      const txInvitationRepo = new InvitationRepository(tx)
      const txQuestionRepo = new QuestionRepository(tx)
      const txGuestRepo = new GuestRepository(tx)

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

      await Promise.all(
        (data.guestDietaryResponses ?? []).map(async (dietaryResponse: GuestDietaryResponse) => {
          await txGuestRepo.updateDietaryRestrictions(
            dietaryResponse.guestId,
            JSON.stringify(dietaryResponse.dietaryRestrictions)
          )
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
    data: Pick<
      SubmitRsvpSchemaInput,
      'rsvpResponses' | 'answersToQuestions' | 'guestDietaryResponses'
    >
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

    for (const dietaryResponse of data.guestDietaryResponses ?? []) {
      guestIds.add(dietaryResponse.guestId)
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

  private async preValidateSubmission(data: SubmitRsvpSchemaInput): Promise<void> {
    this.validateDietaryGuestScope(data)
    await this.validateOptionAnswers(data.answersToQuestions)
    await this.validateRequiredAnswers(data.rsvpResponses, data.answersToQuestions)
  }

  private validateDietaryGuestScope(data: SubmitRsvpSchemaInput): void {
    const rsvpGuestIds = new Set(data.rsvpResponses.map((response) => response.guestId))
    for (const dietaryResponse of data.guestDietaryResponses ?? []) {
      if (!rsvpGuestIds.has(dietaryResponse.guestId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Dietary updates must reference guests included in RSVP responses',
        })
      }
    }
  }

  private async validateOptionAnswers(answers: AnswerToQuestion[]): Promise<void> {
    const optionAnswers = answers.filter((answer) => answer.questionType === 'Option')
    const uniquePairs = new Map<string, { questionId: string; optionId: string }>()

    for (const answer of optionAnswers) {
      uniquePairs.set(`${answer.questionId}:${answer.response}`, {
        questionId: answer.questionId,
        optionId: answer.response,
      })
    }

    const validations = await Promise.all(
      Array.from(uniquePairs.values()).map(async (pair) => {
        const optionBelongs = await this.questionRepo.optionBelongsToQuestion(
          pair.optionId,
          pair.questionId
        )
        return { pair, optionBelongs }
      })
    )

    for (const validation of validations) {
      if (!validation.optionBelongs) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid option response for question ${validation.pair.questionId}`,
        })
      }
    }
  }

  private async validateRequiredAnswers(
    rsvpResponses: RsvpResponse[],
    answers: AnswerToQuestion[]
  ): Promise<void> {
    const attendingResponses = rsvpResponses.filter((response) => response.rsvp === 'Attending')
    if (attendingResponses.length === 0) return

    const requiredQuestions = await this.questionRepo.findRequiredQuestionsByEventIds([
      ...new Set(attendingResponses.map((response) => response.eventId)),
    ])
    const requiredByEvent = new Map<string, string[]>()
    for (const question of requiredQuestions) {
      if (!question.eventId) continue
      const current = requiredByEvent.get(question.eventId) ?? []
      current.push(question.id)
      requiredByEvent.set(question.eventId, current)
    }

    const answerKeys = new Set(
      answers
        .filter((answer) => typeof answer.guestId === 'number' && answer.response.trim() !== '')
        .map((answer) => `${answer.questionId}:${answer.guestId}`)
    )

    for (const response of attendingResponses) {
      const eventQuestionIds = requiredByEvent.get(response.eventId) ?? []

      for (const questionId of eventQuestionIds) {
        if (!answerKeys.has(`${questionId}:${response.guestId}`)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Missing required answer for question ${questionId}`,
          })
        }
      }
    }
  }
}
