/**
 * Question Domain - Repository
 *
 * Database operations for the Question entity and related entities.
 * This layer handles all direct database access for questions, options, and answers.
 */

import { type PrismaClient } from '@prisma/client'

import {
  type OptionInput,
  type Question,
  type QuestionWithOptions,
} from '~/server/domains/question/question.types'

export class QuestionRepository {
  constructor(private db: PrismaClient) {}

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

  /**
   * Delete options by IDs
   */
  async deleteOptions(optionIds: string[]): Promise<{ count: number }> {
    return this.db.option.deleteMany({
      where: {
        id: {
          in: optionIds,
        },
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
        options: upsertOptions,
      },
      create: {
        eventId: data.eventId ?? undefined,
        websiteId: data.websiteId ?? undefined,
        text: data.text,
        type: data.type,
        isRequired: data.isRequired,
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
}
