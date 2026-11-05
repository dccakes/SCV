/**
 * Feedback Domain - Repository
 */

import type { PrismaClient } from '@prisma/client'

import type {
  Feedback,
  FeedbackKind,
  FeedbackReaction,
  FeedbackSource,
} from '~/server/domains/feedback/feedback.types'

export interface CreateFeedbackInput {
  weddingId: string
  kind: FeedbackKind
  source: FeedbackSource
  userId?: string
  messagingIdentityId?: string
  reaction?: FeedbackReaction
  body?: string
  chatMessageId?: string
  ettaSuggestionId?: string
}

export class FeedbackRepository {
  constructor(private db: PrismaClient) {}

  async create(data: CreateFeedbackInput): Promise<Feedback> {
    return this.db.feedback.create({ data })
  }
}
