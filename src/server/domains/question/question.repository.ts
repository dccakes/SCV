/**
 * Question Domain - Repository
 *
 * Database operations for the Question entity and related entities.
 * This layer handles all direct database access for questions, options, and answers.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

import type {
  Answer,
  OptionInput,
  Question,
  QuestionWithOptions,
} from '~/server/domains/question/question.types'

export class QuestionRepository {
  constructor(private db: PrismaClient | Prisma.TransactionClient) {}

  /**
   * Find a question by ID
   */
  async findById(id: string): Promise<Question | null> {
    return this.db.question.findUnique({
      where: { id },
    })
  }

  /**
   * Find a question by ID with options
   */
  async findByIdWithOptions(id: string): Promise<QuestionWithOptions | null> {
    return this.db.question.findUnique({
      where: { id },
      include: {
        options: true,
        _count: {
          select: { answers: true },
        },
      },
    })
  }

  /**
   * Find all questions for an event
   */
  async findByEventId(eventId: string): Promise<QuestionWithOptions[]> {
    return this.db.question.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: {
        options: true,
        _count: {
          select: { answers: true },
        },
      },
    })
  }

  /**
   * Find all questions for a website
   */
  async findByWebsiteId(websiteId: string): Promise<QuestionWithOptions[]> {
    return this.db.question.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'asc' },
      include: {
        options: true,
        _count: {
          select: { answers: true },
        },
      },
    })
  }

  async deleteOptionsForQuestion(
    questionId: string,
    optionIds: string[]
  ): Promise<{ count: number }> {
    return this.db.option.deleteMany({
      where: {
        id: {
          in: optionIds,
        },
        questionId,
      },
    })
  }

  /**
   * Upsert a question (create or update)
   */
  async upsert(data: {
    questionId?: string
    eventId?: string | null
    websiteId?: string | null
    text: string
    type: string
    isRequired: boolean
    allowOther?: boolean
    options?: OptionInput[]
  }): Promise<Question> {
    // Build upsert options for Option type questions
    const upsertOptions =
      data.type === 'Option' && data.options
        ? {
            upsert: data.options.map((option) => ({
              where: {
                id: option.id ?? '-1',
              },
              update: {
                text: option.text ?? undefined,
                description: option.description ?? undefined,
              },
              create: {
                text: option.text,
                description: option.description ?? '',
                responseCount: 0,
              },
            })),
          }
        : undefined

    const createOptions =
      data.type === 'Option' && data.options
        ? {
            create: data.options.map((option) => ({
              text: option.text,
              description: option.description ?? '',
              responseCount: 0,
            })),
          }
        : undefined

    return this.db.question.upsert({
      where: {
        id: data.questionId ?? '-1',
      },
      update: {
        text: data.text,
        type: data.type,
        isRequired: data.isRequired,
        allowOther: data.type === 'Option' ? (data.allowOther ?? false) : false,
        options: upsertOptions,
      },
      create: {
        eventId: data.eventId ?? undefined,
        websiteId: data.websiteId ?? undefined,
        text: data.text,
        type: data.type,
        isRequired: data.isRequired,
        allowOther: data.type === 'Option' ? (data.allowOther ?? false) : false,
        options: createOptions,
      },
    })
  }

  /**
   * Delete a question
   */
  async delete(id: string): Promise<Question> {
    return this.db.question.delete({
      where: { id },
    })
  }

  /**
   * Check if a question exists
   */
  async exists(id: string): Promise<boolean> {
    const question = await this.db.question.findUnique({
      where: { id },
      select: { id: true },
    })
    return question !== null
  }

  /**
   * Find the most recent answer for a question
   */
  async findMostRecentAnswerByQuestionId(questionId: string): Promise<Answer | null> {
    return this.db.answer.findFirst({
      where: { questionId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async belongsToWedding(questionId: string, weddingId: string): Promise<boolean> {
    const question = await this.db.question.findFirst({
      where: {
        id: questionId,
        OR: [{ event: { weddingId } }, { website: { weddingId } }],
      },
      select: { id: true },
    })

    return question !== null
  }

  async eventBelongsToWedding(eventId: string, weddingId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: { id: eventId, weddingId },
      select: { id: true },
    })

    return event !== null
  }

  async websiteBelongsToWedding(websiteId: string, weddingId: string): Promise<boolean> {
    const website = await this.db.website.findFirst({
      where: { id: websiteId, weddingId },
      select: { id: true },
    })

    return website !== null
  }

  /**
   * Find a single option response by question + guest/household composite key.
   */
  async findOptionResponse(
    questionId: string,
    guestId: number,
    householdId: string
  ): Promise<{ optionId: string } | null> {
    return this.db.optionResponse.findUnique({
      where: {
        optionResponseId: {
          questionId,
          guestId,
          householdId,
        },
      },
      select: { optionId: true },
    })
  }

  async deleteOptionResponse(
    questionId: string,
    guestId: number,
    householdId: string
  ): Promise<void> {
    await this.db.optionResponse.deleteMany({
      where: {
        questionId,
        guestId,
        householdId,
      },
    })
  }

  /**
   * Create or update an option response.
   */
  async upsertOptionResponse(data: {
    questionId: string
    optionId: string
    guestId: number
    householdId: string
    guestFirstName?: string | null
    guestLastName?: string | null
  }): Promise<void> {
    await this.db.optionResponse.upsert({
      where: {
        optionResponseId: {
          questionId: data.questionId,
          guestId: data.guestId,
          householdId: data.householdId,
        },
      },
      update: { optionId: data.optionId },
      create: {
        questionId: data.questionId,
        optionId: data.optionId,
        guestId: data.guestId,
        householdId: data.householdId,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
      },
    })
  }

  /**
   * Adjust an option response count using increment/decrement semantics.
   */
  async adjustOptionResponseCount(optionId: string, delta: number): Promise<void> {
    if (delta === 0) return

    await this.db.option.update({
      where: { id: optionId },
      data: {
        responseCount: delta > 0 ? { increment: delta } : { decrement: Math.abs(delta) },
      },
    })
  }

  /**
   * Create or update text answer response.
   */
  async upsertAnswer(data: {
    questionId: string
    guestId: number
    householdId: string
    response: string
    guestFirstName?: string | null
    guestLastName?: string | null
  }): Promise<void> {
    await this.db.answer.upsert({
      where: {
        answerId: {
          questionId: data.questionId,
          guestId: data.guestId,
          householdId: data.householdId,
        },
      },
      update: { response: data.response },
      create: {
        questionId: data.questionId,
        guestId: data.guestId,
        householdId: data.householdId,
        response: data.response,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
      },
    })
  }

  async deleteAnswer(questionId: string, guestId: number, householdId: string): Promise<void> {
    await this.db.answer.deleteMany({
      where: {
        questionId,
        guestId,
        householdId,
      },
    })
  }
}
