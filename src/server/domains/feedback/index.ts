/**
 * Feedback Domain - Barrel Export
 */

import { FeedbackRepository } from '~/server/domains/feedback/feedback.repository'
import { FeedbackService } from '~/server/domains/feedback/feedback.service'
import { db } from '~/server/infrastructure/database'

const feedbackRepository = new FeedbackRepository(db)
export const feedbackService = new FeedbackService(feedbackRepository)

export { FeedbackRepository } from '~/server/domains/feedback/feedback.repository'
export { FeedbackService } from '~/server/domains/feedback/feedback.service'
export type {
  Feedback,
  FeedbackKind,
  FeedbackReaction,
  FeedbackSource,
  SubmitOpenEndedInput,
  SubmitReactionInput,
} from '~/server/domains/feedback/feedback.types'
