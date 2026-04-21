/**
 * Tests for SessionSummarizer — memory-only Etta pass + stale sweep.
 */

import { SessionSummarizer } from '~/server/application/messaging/session-summarizer'

const makeChatMessage = (id: string, role: 'user' | 'assistant' = 'user', content = 'hi') => ({
  id,
  role,
  content,
  identityId: 'identity-1',
  weddingId: 'wedding-1',
  attachmentUrl: null,
  attachmentName: null,
  externalMessageId: null,
  summarizedAt: null,
  createdAt: new Date(),
})

function build() {
  const messaging = {
    markSummarized: jest.fn().mockResolvedValue(undefined),
    findIdentitiesWithUnsummarized: jest.fn().mockResolvedValue([]),
    findOrphanBlocks: jest.fn().mockResolvedValue([]),
  }
  const runEtta = jest.fn()
  const summarizer = new SessionSummarizer({
    messaging: messaging as never,
    runEtta: runEtta as never,
  })
  return { summarizer, messaging, runEtta }
}

describe('SessionSummarizer', () => {
  describe('summarizeSession', () => {
    it('runs Etta in memory-only mode and marks the block summarised', async () => {
      const { summarizer, messaging, runEtta } = build()
      runEtta.mockResolvedValue({ text: Promise.resolve('noted') })

      const block = [makeChatMessage('m1'), makeChatMessage('m2', 'assistant', 'hello')]
      await summarizer.summarizeSession(block, {
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
      })

      expect(runEtta).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: 'couple-bot',
          weddingId: 'wedding-1',
          toolsetMode: 'memory-only',
          messages: [
            { role: 'user', content: 'hi' },
            { role: 'assistant', content: 'hello' },
          ],
        })
      )
      expect(messaging.markSummarized).toHaveBeenCalledWith(['m1', 'm2'])
    })

    it('does not mark summarised when Etta throws', async () => {
      const { summarizer, messaging, runEtta } = build()
      runEtta.mockRejectedValue(new Error('rate-limited'))

      await expect(
        summarizer.summarizeSession([makeChatMessage('m1')], {
          weddingId: 'wedding-1',
          authz: { userId: 'user-1', activeOrganization: null },
        })
      ).rejects.toThrow('rate-limited')

      expect(messaging.markSummarized).not.toHaveBeenCalled()
    })

    it('is a no-op for an empty block', async () => {
      const { summarizer, messaging, runEtta } = build()
      await summarizer.summarizeSession([], {
        weddingId: 'wedding-1',
        authz: { userId: 'user-1', activeOrganization: null },
      })
      expect(runEtta).not.toHaveBeenCalled()
      expect(messaging.markSummarized).not.toHaveBeenCalled()
    })
  })

  describe('sweepStale', () => {
    it('summarises orphan blocks for each identity and counts them', async () => {
      const { summarizer, messaging, runEtta } = build()
      messaging.findIdentitiesWithUnsummarized.mockResolvedValue([
        {
          id: 'identity-1',
          weddingId: 'wedding-1',
          linkedByUserId: 'user-1',
        },
        {
          id: 'identity-2',
          weddingId: 'wedding-2',
          linkedByUserId: 'user-2',
        },
      ])
      messaging.findOrphanBlocks
        .mockResolvedValueOnce([[makeChatMessage('m1')]])
        .mockResolvedValueOnce([[makeChatMessage('m2')], [makeChatMessage('m3')]])
      runEtta.mockResolvedValue({ text: Promise.resolve('ok') })

      const count = await summarizer.sweepStale({ olderThanMs: 30 * 60_000 })

      expect(count).toBe(3)
      expect(messaging.findIdentitiesWithUnsummarized).toHaveBeenCalledWith(30 * 60_000, 20)
      expect(runEtta).toHaveBeenCalledTimes(3)
      expect(messaging.markSummarized).toHaveBeenCalledTimes(3)
    })

    it('respects the maxIdentities cap', async () => {
      const { summarizer, messaging } = build()
      messaging.findIdentitiesWithUnsummarized.mockResolvedValue([])
      await summarizer.sweepStale({ olderThanMs: 1000, maxIdentities: 5 })
      expect(messaging.findIdentitiesWithUnsummarized).toHaveBeenCalledWith(1000, 5)
    })

    it('continues after a per-identity failure', async () => {
      const { summarizer, messaging, runEtta } = build()
      messaging.findIdentitiesWithUnsummarized.mockResolvedValue([
        { id: 'i1', weddingId: 'w1', linkedByUserId: 'u1' },
        { id: 'i2', weddingId: 'w2', linkedByUserId: 'u2' },
      ])
      messaging.findOrphanBlocks
        .mockResolvedValueOnce([[makeChatMessage('m1')]])
        .mockResolvedValueOnce([[makeChatMessage('m2')]])
      runEtta
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ text: Promise.resolve('ok') })

      const count = await summarizer.sweepStale({ olderThanMs: 1000 })
      expect(count).toBe(1)
      expect(messaging.markSummarized).toHaveBeenCalledTimes(1)
      expect(messaging.markSummarized).toHaveBeenCalledWith(['m2'])
    })
  })
})
