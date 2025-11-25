/**
 * Question Domain - Service
 *
 * Business logic for the Question domain.
 * Handles question creation, updates, deletion, and retrieval.
 *
 * Business Rules:
 * - A question must belong to either an Event OR a Website (not both, not neither)
 */

import { TRPCError } from '@trpc/server'

import { type QuestionRepository } from '~/server/domains/question/question.repository'
import {
  type DeleteQuestionInput,
  type Question,
  type QuestionWithOptions,
  type UpsertQuestionInput,
} from '~/server/domains/question/question.types'

export class QuestionService {
  constructor(private questionRepository: QuestionRepository) {}

  /**
   * Validate that a question belongs to Event OR Website (not both, not neither)
   */
  private validateContext(eventId?: string | null, websiteId?: string | null): void {
    const hasEvent = !!eventId
    const hasWebsite = !!websiteId

    if (!hasEvent && !hasWebsite) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Question must belong to either Event or Website',
      })
    }

    if (hasEvent && hasWebsite) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Question cannot belong to both Event and Website',
      })
    }
  }

  /**
   * Upsert a question (create or update)
   *
   * Business rules:
   * - Question must belong to Event OR Website (not both)
   * - Option-type questions must have at least 2 options
   * - Deleted options are removed before upsert
   */
  async upsertQuestion(data: UpsertQuestionInput): Promise<Question> {
    // Validate context - must have Event OR Website
    this.validateContext(data.eventId, data.websiteId)

    // Delete removed options first
    if (data.deletedOptions && data.deletedOptions.length > 0) {
      await this.questionRepository.deleteOptions(data.deletedOptions)
    }

    return this.questionRepository.upsert({
      questionId: data.questionId,
      eventId: data.eventId,
      websiteId: data.websiteId,
      text: data.text,
      type: data.type,
      isRequired: data.isRequired,
      options: data.options,
    })
  }

  /**
   * Delete a question
   */
  async deleteQuestion(data: DeleteQuestionInput): Promise<Question> {
    return this.questionRepository.delete(data.questionId)
  }

  /**
   * Get a question by ID
   */
  async getById(questionId: string): Promise<Question | null> {
    return this.questionRepository.findById(questionId)
  }

  /**
   * Get a question by ID with options
   */
  async getByIdWithOptions(questionId: string): Promise<QuestionWithOptions | null> {
    return this.questionRepository.findByIdWithOptions(questionId)
  }

  /**
   * Get all questions for an event
   */
  async getByEventId(eventId: string): Promise<QuestionWithOptions[]> {
    return this.questionRepository.findByEventId(eventId)
  }

  /**
   * Get all questions for a website
   */
  async getByWebsiteId(websiteId: string): Promise<QuestionWithOptions[]> {
    return this.questionRepository.findByWebsiteId(websiteId)
  }
}
