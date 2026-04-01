/**
 * @jest-environment node
 */

import { getOutboundTools } from '~/lib/etta/tools/outbound'
import { db } from '~/server/db'
import type { EttaContext } from '~/lib/etta/types'

jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      create: jest.fn(),
    },
  },
}))

const mockDb = db as unknown as {
  ettaSuggestion: { create: jest.Mock }
}

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

const toolOpts = {
  toolCallId: 'tc1',
  messages: [],
  abortSignal: undefined as never,
}

describe('getOutboundTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getOutboundTools(mockCtx)

  // ── send_whatsapp_blast ───────────────────────────────────────────────

  describe('send_whatsapp_blast', () => {
    it('creates a T2 suggestion with correct payload', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-wa-1' })

      await tools.send_whatsapp_blast.execute(
        { message: 'Save the date!', recipientFilter: 'all' },
        toolOpts,
      )

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          actorId: 'actor-123',
          actionType: 'send_whatsapp_blast',
          tier: 'T2',
          summary: 'Send WhatsApp blast to guests',
          payload: { message: 'Save the date!', recipientFilter: 'all' },
          status: 'pending',
        },
      })
    })

    it('returns suggestionId and pending_approval status', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-wa-2' })

      const result = await tools.send_whatsapp_blast.execute(
        { message: 'Hello guests!' },
        toolOpts,
      )

      expect(result).toEqual({
        suggestionId: 'sug-wa-2',
        status: 'pending_approval',
        message:
          'WhatsApp blast draft created. Requires your approval before sending.',
      })
    })

    it('handles missing recipientFilter', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-wa-3' })

      await tools.send_whatsapp_blast.execute(
        { message: 'No filter' },
        toolOpts,
      )

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: { message: 'No filter', recipientFilter: undefined },
          }),
        }),
      )
    })
  })

  // ── draft_vendor_email ────────────────────────────────────────────────

  describe('draft_vendor_email', () => {
    it('creates a T2 suggestion with vendorId, subject, and body', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-ve-1' })

      await tools.draft_vendor_email.execute(
        {
          vendorId: 'vendor-42',
          subject: 'Menu options',
          body: 'Hi, could you send your latest menu?',
        },
        toolOpts,
      )

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          actorId: 'actor-123',
          actionType: 'draft_vendor_email',
          tier: 'T2',
          summary: 'Draft email to vendor: Menu options',
          payload: {
            vendorId: 'vendor-42',
            subject: 'Menu options',
            body: 'Hi, could you send your latest menu?',
          },
          status: 'pending',
        },
      })
    })

    it('includes subject in the summary', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-ve-2' })

      await tools.draft_vendor_email.execute(
        { vendorId: 'v1', subject: 'Pricing inquiry', body: 'Details please' },
        toolOpts,
      )

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            summary: 'Draft email to vendor: Pricing inquiry',
          }),
        }),
      )
    })

    it('returns suggestionId and pending_approval status', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-ve-3' })

      const result = await tools.draft_vendor_email.execute(
        { vendorId: 'v1', subject: 'Test', body: 'Body' },
        toolOpts,
      )

      expect(result).toEqual({
        suggestionId: 'sug-ve-3',
        status: 'pending_approval',
        message:
          'Vendor email draft created. Requires your approval before sending.',
      })
    })
  })
})
