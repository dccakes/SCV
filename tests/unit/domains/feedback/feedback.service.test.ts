/**
 * Tests for FeedbackService — open-ended + reaction submissions, validation.
 */

import { FeedbackService } from '~/server/domains/feedback/feedback.service'

function buildService() {
  const repo = {
    create: jest.fn().mockImplementation(async (data) => ({ id: 'fb-1', ...data })),
  }
  const service = new FeedbackService(repo as never)
  return { service, repo }
}

describe('FeedbackService', () => {
  describe('submitOpenEnded', () => {
    it('persists trimmed body with kind = open_ended', async () => {
      const { service, repo } = buildService()
      await service.submitOpenEnded({
        weddingId: 'w-1',
        source: 'telegram_command',
        body: '   the vendor summaries are great   ',
        userId: 'u-1',
        messagingIdentityId: 'mi-1',
      })
      expect(repo.create).toHaveBeenCalledWith({
        weddingId: 'w-1',
        kind: 'open_ended',
        source: 'telegram_command',
        userId: 'u-1',
        messagingIdentityId: 'mi-1',
        body: 'the vendor summaries are great',
      })
    })

    it('rejects empty body', async () => {
      const { service, repo } = buildService()
      await expect(
        service.submitOpenEnded({
          weddingId: 'w-1',
          source: 'telegram_command',
          body: '   ',
        })
      ).rejects.toThrow(/required/)
      expect(repo.create).not.toHaveBeenCalled()
    })
  })

  describe('submitReaction', () => {
    it('persists a positive reaction tied to a chat message', async () => {
      const { service, repo } = buildService()
      await service.submitReaction({
        weddingId: 'w-1',
        source: 'etta_chat_message',
        reaction: 'positive',
        chatMessageId: 'cm-1',
        userId: 'u-1',
      })
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId: 'w-1',
          kind: 'reaction',
          source: 'etta_chat_message',
          reaction: 'positive',
          chatMessageId: 'cm-1',
          userId: 'u-1',
        })
      )
    })

    it('persists a negative reaction tied to a suggestion', async () => {
      const { service, repo } = buildService()
      await service.submitReaction({
        weddingId: 'w-1',
        source: 'etta_suggestion',
        reaction: 'negative',
        ettaSuggestionId: 'sg-1',
      })
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'reaction',
          source: 'etta_suggestion',
          reaction: 'negative',
          ettaSuggestionId: 'sg-1',
        })
      )
    })

    it('rejects reactions with no target id', async () => {
      const { service, repo } = buildService()
      await expect(
        service.submitReaction({
          weddingId: 'w-1',
          source: 'etta_chat_message',
          reaction: 'positive',
        })
      ).rejects.toThrow(/chatMessageId|ettaSuggestionId/)
      expect(repo.create).not.toHaveBeenCalled()
    })
  })
})
