/**
 * Tests for TelegramHandler — debounce, PDF ingest, pairing, Etta invocation.
 */

import type { TelegramUpdate } from '~/lib/telegram/types'
import { TelegramHandler } from '~/server/application/messaging/telegram-handler'

const makeMessage = (overrides: Partial<TelegramUpdate['message']> = {}) =>
  ({
    message_id: 1,
    chat: { id: 42, type: 'private' },
    from: { id: 7, first_name: 'Alice' },
    date: 0,
    text: 'hello',
    ...overrides,
  }) as NonNullable<TelegramUpdate['message']>

const makeUpdate = (msg: NonNullable<TelegramUpdate['message']>): TelegramUpdate => ({
  update_id: Math.floor(Math.random() * 10000),
  message: msg,
})

const baseIdentity = {
  id: 'identity-123',
  weddingId: 'wedding-123',
  channel: 'telegram',
  externalChatId: '42',
  externalUserId: '7',
  displayName: 'Alice',
  linkedByUserId: 'user-1',
  linkedAt: new Date(),
  revokedAt: null,
  pendingInvokeSeq: 0,
}

function buildHandler(
  overrides: Partial<Parameters<typeof TelegramHandler.prototype.handle>[0]> = {}
) {
  void overrides
  const messaging = {
    findWeddingForChat: jest.fn(),
    consumePairingToken: jest.fn(),
    appendMessage: jest.fn().mockResolvedValue({}),
    loadConversation: jest.fn().mockResolvedValue([]),
    findOrphanBlocks: jest.fn().mockResolvedValue([]),
    bumpPendingInvokeSeq: jest.fn(),
    getPendingInvokeSeq: jest.fn(),
  }
  const tg = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    sendChatAction: jest.fn().mockResolvedValue(undefined),
    getFile: jest.fn(),
    downloadFile: jest.fn(),
  }
  const blob = jest.fn()
  const runEtta = jest.fn()
  const summarizer = { summarizeSession: jest.fn(), sweepStale: jest.fn() }
  const sleep = jest.fn().mockResolvedValue(undefined)

  const handler = new TelegramHandler({
    messaging: messaging as never,
    tg: tg as never,
    blob: blob as never,
    runEtta: runEtta as never,
    summarizer: summarizer as never,
    debounceMs: 100,
    sleep,
  })

  return { handler, messaging, tg, blob, runEtta, summarizer, sleep }
}

describe('TelegramHandler', () => {
  describe('routing', () => {
    it('ignores non-private chats', async () => {
      const { handler, messaging, tg } = buildHandler()
      const msg = makeMessage({ chat: { id: 42, type: 'group' } })
      await handler.handle(makeUpdate(msg))
      expect(messaging.findWeddingForChat).not.toHaveBeenCalled()
      expect(tg.sendMessage).not.toHaveBeenCalled()
    })

    it('replies with pairing instruction when chat is not linked', async () => {
      const { handler, messaging, tg, runEtta } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue(null)
      await handler.handle(makeUpdate(makeMessage()))
      expect(tg.sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('Settings'))
      expect(runEtta).not.toHaveBeenCalled()
    })

    it('ignores empty messages with no text or document', async () => {
      const { handler, messaging, runEtta } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })
      await handler.handle(makeUpdate(makeMessage({ text: undefined })))
      expect(messaging.appendMessage).not.toHaveBeenCalled()
      expect(runEtta).not.toHaveBeenCalled()
    })
  })

  describe('pairing', () => {
    it('consumes a pairing token and confirms success', async () => {
      const { handler, messaging, tg } = buildHandler()
      messaging.consumePairingToken.mockResolvedValue(baseIdentity)
      await handler.handle(makeUpdate(makeMessage({ text: '/start tok-abc-123' })))
      expect(messaging.consumePairingToken).toHaveBeenCalledWith({
        token: 'tok-abc-123',
        channel: 'telegram',
        externalChatId: '42',
        externalUserId: '7',
        displayName: 'Alice',
      })
      expect(tg.sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('linked'))
    })

    it('surfaces pairing errors to the user', async () => {
      const { handler, messaging, tg } = buildHandler()
      messaging.consumePairingToken.mockRejectedValue(new Error('Pairing token expired'))
      await handler.handle(makeUpdate(makeMessage({ text: '/start expired-tok' })))
      expect(tg.sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('expired'))
    })
  })

  describe('text round-trip', () => {
    it('persists, invokes Etta, sends reply, persists assistant reply', async () => {
      const { handler, messaging, tg, runEtta } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })
      messaging.bumpPendingInvokeSeq.mockResolvedValue(1)
      messaging.getPendingInvokeSeq.mockResolvedValue(1)
      messaging.loadConversation.mockResolvedValue([
        {
          id: 'm1',
          role: 'user',
          content: 'how many guests?',
          identityId: baseIdentity.id,
          weddingId: 'wedding-123',
          attachmentUrl: null,
          attachmentName: null,
          externalMessageId: null,
          summarizedAt: null,
          createdAt: new Date(),
        },
      ])
      runEtta.mockResolvedValue({ text: Promise.resolve('We have 120 guests.') })

      await handler.handle(makeUpdate(makeMessage({ text: 'how many guests?' })))

      expect(messaging.appendMessage).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          identityId: 'identity-123',
          role: 'user',
          content: 'how many guests?',
          externalMessageId: '1',
        })
      )
      expect(runEtta).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: 'couple-bot',
          weddingId: 'wedding-123',
          authz: { userId: 'user-1', activeOrganization: null },
          messages: [{ role: 'user', content: 'how many guests?' }],
        })
      )
      expect(tg.sendMessage).toHaveBeenCalledWith(42, 'We have 120 guests.')
      expect(messaging.appendMessage).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ role: 'assistant', content: 'We have 120 guests.' })
      )
    })
  })

  describe('debounce', () => {
    it('skips the Etta invocation when the sequence was superseded', async () => {
      const { handler, messaging, runEtta } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })
      messaging.bumpPendingInvokeSeq.mockResolvedValue(3)
      messaging.getPendingInvokeSeq.mockResolvedValue(5) // a later message bumped again

      await handler.handle(makeUpdate(makeMessage({ text: 'first' })))

      expect(runEtta).not.toHaveBeenCalled()
    })

    it('invokes Etta when the stored sequence still matches', async () => {
      const { handler, messaging, runEtta, tg } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })
      messaging.bumpPendingInvokeSeq.mockResolvedValue(2)
      messaging.getPendingInvokeSeq.mockResolvedValue(2)
      messaging.loadConversation.mockResolvedValue([
        {
          id: 'm1',
          role: 'user',
          content: 'hello',
          identityId: baseIdentity.id,
          weddingId: 'wedding-123',
          attachmentUrl: null,
          attachmentName: null,
          externalMessageId: null,
          summarizedAt: null,
          createdAt: new Date(),
        },
      ])
      runEtta.mockResolvedValue({ text: Promise.resolve('hi') })

      await handler.handle(makeUpdate(makeMessage({ text: 'hello' })))

      expect(runEtta).toHaveBeenCalledTimes(1)
      expect(tg.sendMessage).toHaveBeenCalledWith(42, 'hi')
    })
  })

  describe('PDF ingest', () => {
    it('downloads, uploads to blob, appends message with attachment URL', async () => {
      const { handler, messaging, tg, blob, runEtta } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })
      messaging.bumpPendingInvokeSeq.mockResolvedValue(1)
      messaging.getPendingInvokeSeq.mockResolvedValue(1)
      messaging.loadConversation.mockResolvedValue([])
      tg.getFile.mockResolvedValue({ file_id: 'fid', file_path: 'documents/file1.pdf' })
      tg.downloadFile.mockResolvedValue({
        buffer: new ArrayBuffer(8),
        contentType: 'application/pdf',
      })
      blob.mockResolvedValue({
        url: 'https://blob.example/telegram/wedding-123/foo.pdf',
        pathname: 'telegram/wedding-123/foo.pdf',
        size: 8,
        contentType: 'application/pdf',
      })
      runEtta.mockResolvedValue({ text: Promise.resolve('') })

      const msg = makeMessage({
        text: undefined,
        caption: 'florist quote',
        document: {
          file_id: 'fid',
          file_name: 'quote.pdf',
          mime_type: 'application/pdf',
          file_size: 1000,
        },
      })
      await handler.handle(makeUpdate(msg))

      expect(tg.getFile).toHaveBeenCalledWith('fid')
      expect(tg.downloadFile).toHaveBeenCalledWith('documents/file1.pdf')
      expect(blob).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'application/pdf',
          pathname: expect.stringContaining('telegram/wedding-123/'),
        })
      )
      expect(messaging.appendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('https://blob.example/telegram/wedding-123/foo.pdf'),
          attachmentUrl: 'https://blob.example/telegram/wedding-123/foo.pdf',
          attachmentName: 'quote.pdf',
        })
      )
    })

    it('rejects PDFs over 20 MB without uploading', async () => {
      const { handler, messaging, tg, blob } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })

      const msg = makeMessage({
        text: undefined,
        document: {
          file_id: 'fid',
          file_name: 'huge.pdf',
          mime_type: 'application/pdf',
          file_size: 25 * 1024 * 1024,
        },
      })
      await handler.handle(makeUpdate(msg))

      expect(tg.sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('20 MB'))
      expect(blob).not.toHaveBeenCalled()
      expect(messaging.appendMessage).not.toHaveBeenCalled()
    })

    it('rejects non-PDF documents', async () => {
      const { handler, messaging, tg, blob } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })

      const msg = makeMessage({
        text: undefined,
        document: {
          file_id: 'fid',
          file_name: 'scan.jpg',
          mime_type: 'image/jpeg',
          file_size: 1000,
        },
      })
      await handler.handle(makeUpdate(msg))

      expect(tg.sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('PDF'))
      expect(blob).not.toHaveBeenCalled()
      expect(messaging.appendMessage).not.toHaveBeenCalled()
    })
  })

  describe('orphan summarisation', () => {
    it('summarises orphan blocks before invoking Etta for the new message', async () => {
      const { handler, messaging, runEtta, summarizer, tg } = buildHandler()
      messaging.findWeddingForChat.mockResolvedValue({
        identity: baseIdentity,
        weddingId: 'wedding-123',
      })
      messaging.bumpPendingInvokeSeq.mockResolvedValue(1)
      messaging.getPendingInvokeSeq.mockResolvedValue(1)
      const orphan = [
        {
          id: 'old-1',
          role: 'user',
          content: 'old message',
          identityId: baseIdentity.id,
          weddingId: 'wedding-123',
          attachmentUrl: null,
          attachmentName: null,
          externalMessageId: null,
          summarizedAt: null,
          createdAt: new Date(),
        },
      ]
      messaging.findOrphanBlocks.mockResolvedValue([orphan])
      messaging.loadConversation.mockResolvedValue([
        {
          id: 'm1',
          role: 'user',
          content: 'new message',
          identityId: baseIdentity.id,
          weddingId: 'wedding-123',
          attachmentUrl: null,
          attachmentName: null,
          externalMessageId: null,
          summarizedAt: null,
          createdAt: new Date(),
        },
      ])
      runEtta.mockResolvedValue({ text: Promise.resolve('ok') })

      await handler.handle(makeUpdate(makeMessage({ text: 'new message' })))

      expect(summarizer.summarizeSession).toHaveBeenCalledWith(
        orphan,
        expect.objectContaining({ weddingId: 'wedding-123' })
      )
      const summariseCallOrder = summarizer.summarizeSession.mock.invocationCallOrder[0]
      const ettaCallOrder = runEtta.mock.invocationCallOrder[0]
      expect(summariseCallOrder).toBeLessThan(ettaCallOrder)
      expect(tg.sendMessage).toHaveBeenCalledWith(42, 'ok')
    })
  })
})
