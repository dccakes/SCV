/**
 * Feedback Domain - Service
 *
 * Captures user feedback on Etta. Two shapes today:
 * - open-ended free text (e.g. /feedback in Telegram)
 * - reactions on Etta chat messages or suggestions (UI not wired yet)
 */

import type { FeedbackRepository } from '~/server/domains/feedback/feedback.repository'
import type {
  Feedback,
  SubmitOpenEndedInput,
  SubmitReactionInput,
} from '~/server/domains/feedback/feedback.types'

export class FeedbackService {
  constructor(private repo: FeedbackRepository) {}

  async submitOpenEnded(input: SubmitOpenEndedInput): Promise<Feedback> {
    const body = input.body.trim()
    if (body.length === 0) {
      throw new Error('Feedback body is required')
    }
    return this.repo.create({
      weddingId: input.weddingId,
      kind: 'open_ended',
      source: input.source,
      userId: input.userId,
      messagingIdentityId: input.messagingIdentityId,
      body,
    })
  }

  async submitReaction(input: SubmitReactionInput): Promise<Feedback> {
    if (!input.chatMessageId && !input.ettaSuggestionId) {
      throw new Error('Reactions must reference a chatMessageId or ettaSuggestionId')
    }
    return this.repo.create({
      weddingId: input.weddingId,
      kind: 'reaction',
      source: input.source,
      reaction: input.reaction,
      userId: input.userId,
      messagingIdentityId: input.messagingIdentityId,
      chatMessageId: input.chatMessageId,
      ettaSuggestionId: input.ettaSuggestionId,
      body: input.body?.trim() || undefined,
    })
  }
}
