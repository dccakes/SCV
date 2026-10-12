/**
 * Feedback Domain - Types
 */

import type { Feedback as PrismaFeedback } from '@prisma/client'

export type Feedback = PrismaFeedback

export type FeedbackKind = 'open_ended' | 'reaction'
export type FeedbackReaction = 'positive' | 'negative'
export type FeedbackSource = 'telegram_command' | 'etta_chat_message' | 'etta_suggestion'

export interface SubmitOpenEndedInput {
  weddingId: string
  source: FeedbackSource
  body: string
  userId?: string
  messagingIdentityId?: string
}

export interface SubmitReactionInput {
  weddingId: string
  source: FeedbackSource
  reaction: FeedbackReaction
  userId?: string
  messagingIdentityId?: string
  chatMessageId?: string
  ettaSuggestionId?: string
  body?: string
}
