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

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { QuestionRepository } from '~/server/domains/question/question.repository'
import type {
  DeleteQuestionInput,
  Question,
  QuestionWithOptions,
  UpsertQuestionInput,
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
  async upsertQuestion(input: {
    ctx: AuthzContext
    weddingId: string
    organizationId: string | null
    data: UpsertQuestionInput
  }): Promise<Question> {
    const { ctx, weddingId, organizationId, data } = input

    if (!organizationId) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Wedding must be linked to an organization before question updates are allowed',
      })
    }

    let permissionScope: 'event' | 'website'
    let existingQuestion: Question | null = null

    if (data.questionId) {
      existingQuestion = await this.getScopedQuestionOrDeny(data.questionId, weddingId)
      permissionScope = existingQuestion.eventId ? 'event' : 'website'

      if (permissionScope === 'event' && data.websiteId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Question update context must match existing event question scope',
        })
      }

      if (permissionScope === 'website' && data.eventId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Question update context must match existing website question scope',
        })
      }

      if (data.eventId && existingQuestion.eventId && data.eventId !== existingQuestion.eventId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Question event context does not match existing question scope',
        })
      }

      if (
        data.websiteId &&
        existingQuestion.websiteId &&
        data.websiteId !== existingQuestion.websiteId
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Question website context does not match existing question scope',
        })
      }
    } else {
      // Validate context - must have Event OR Website
      this.validateContext(data.eventId, data.websiteId)
      permissionScope = data.eventId ? 'event' : 'website'
    }

    this.requireQuestionPermission(ctx, permissionScope)

    if (permissionScope === 'event' && data.eventId) {
      await this.assertEventInWeddingScope(data.eventId, weddingId)
    }

    if (permissionScope === 'website' && data.websiteId) {
      await this.assertWebsiteInWeddingScope(data.websiteId, weddingId)
    }

    const resolvedEventId = data.eventId ?? existingQuestion?.eventId
    const resolvedWebsiteId = data.websiteId ?? existingQuestion?.websiteId

    // Delete removed options first
    if (data.deletedOptions && data.deletedOptions.length > 0) {
      if (!data.questionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Question ID is required when deleting options',
        })
      }

      await this.questionRepository.deleteOptionsForQuestion(data.questionId, data.deletedOptions)
    }

    return this.questionRepository.upsert({
      questionId: data.questionId,
      eventId: resolvedEventId,
      websiteId: resolvedWebsiteId,
      text: data.text,
      type: data.type,
      isRequired: data.isRequired,
      options: data.options,
    })
  }

  /**
   * Delete a question
   */
  async deleteQuestion(input: {
    ctx: AuthzContext
    weddingId: string
    organizationId: string | null
    data: DeleteQuestionInput
  }): Promise<Question> {
    const { ctx, weddingId, organizationId, data } = input

    if (!organizationId) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Wedding must be linked to an organization before question updates are allowed',
      })
    }

    const question = await this.getScopedQuestionOrDeny(data.questionId, weddingId)
    this.requireQuestionPermission(ctx, question.eventId ? 'event' : 'website')
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

  private requireQuestionPermission(ctx: AuthzContext, scope: 'event' | 'website'): void {
    if (scope === 'event') {
      requirePermission(ctx, { event: ['update'] })
      return
    }

    requirePermission(ctx, { website: ['update'] })
  }

  private async getScopedQuestionOrDeny(questionId: string, weddingId: string): Promise<Question> {
    const question = await this.questionRepository.findById(questionId)
    if (!question) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const inScope = await this.questionRepository.belongsToWedding(questionId, weddingId)
    if (!inScope) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return question
  }

  private async assertEventInWeddingScope(eventId: string, weddingId: string): Promise<void> {
    const inScope = await this.questionRepository.eventBelongsToWedding(eventId, weddingId)
    if (!inScope) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }

  private async assertWebsiteInWeddingScope(websiteId: string, weddingId: string): Promise<void> {
    const inScope = await this.questionRepository.websiteBelongsToWedding(websiteId, weddingId)
    if (!inScope) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }
}
