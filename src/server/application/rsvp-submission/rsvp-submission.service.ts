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
 */

import { type Prisma, type PrismaClient } from '@prisma/client'

import { type SubmitRsvpSchemaInput } from '~/server/application/rsvp-submission/rsvp-submission.validator'

// Re-use types from validator for internal use
type RsvpResponse = SubmitRsvpSchemaInput['rsvpResponses'][number]
type AnswerToQuestion = SubmitRsvpSchemaInput['answersToQuestions'][number]

export class RsvpSubmissionService {
  constructor(private db: PrismaClient) {}

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
              invitationId: {
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
            OR: [
              { guestId: answer.guestId ?? -1 },
              { householdId: answer.householdId ?? '-1' },
            ],
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
}
