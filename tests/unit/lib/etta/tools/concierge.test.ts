/**
 * @jest-environment node
 */

import { db } from '~/server/db'
import { invitationService } from '~/server/domains/invitation'
import { getConciergeTools } from '~/lib/etta/tools/concierge'
import type { EttaContext } from '~/lib/etta/types'

jest.mock('~/server/db', () => ({
  db: {
    wedding: { findUnique: jest.fn() },
    event: { findMany: jest.fn() },
    faq: { findMany: jest.fn() },
    guestQuestion: { create: jest.fn() },
  },
}))

jest.mock('~/server/domains/invitation', () => ({
  invitationService: {
    updateInvitation: jest.fn(),
  },
}))

const mockDb = db as {
  wedding: { findUnique: jest.Mock }
  event: { findMany: jest.Mock }
  faq: { findMany: jest.Mock }
  guestQuestion: { create: jest.Mock }
}

const mockInvitationService = invitationService as {
  updateInvitation: jest.Mock
}

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'guest',
  guestId: 42,
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

const toolOpts = { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }

describe('getConciergeTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getConciergeTools(mockCtx)

  describe('get_public_info', () => {
    it('returns wedding info and events', async () => {
      const wedding = {
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      }
      const events = [
        { id: 'e1', name: 'Ceremony', date: '2026-06-15', startTime: '14:00', venue: 'Chapel' },
        { id: 'e2', name: 'Reception', date: '2026-06-15', startTime: '18:00', venue: 'Ballroom' },
      ]
      mockDb.wedding.findUnique.mockResolvedValue(wedding)
      mockDb.event.findMany.mockResolvedValue(events)

      const result = await tools.get_public_info.execute({}, toolOpts)

      expect(mockDb.wedding.findUnique).toHaveBeenCalledWith({
        where: { id: 'wedding-123' },
        select: {
          groomFirstName: true,
          groomLastName: true,
          brideFirstName: true,
          brideLastName: true,
        },
      })
      expect(mockDb.event.findMany).toHaveBeenCalledWith({
        where: { weddingId: 'wedding-123' },
        select: { name: true, date: true, startTime: true, venue: true },
      })
      expect(result).toEqual({
        couple: wedding,
        events: events,
      })
    })
  })

  describe('get_faq', () => {
    it('returns published FAQs only', async () => {
      const faqs = [
        { question: 'What to wear?', answer: 'Formal attire' },
        { question: 'Parking?', answer: 'Free parking available' },
      ]
      mockDb.faq.findMany.mockResolvedValue(faqs)

      const result = await tools.get_faq.execute({}, toolOpts)

      expect(mockDb.faq.findMany).toHaveBeenCalledWith({
        where: { weddingId: 'wedding-123', published: true },
        select: { question: true, answer: true },
      })
      expect(result).toEqual(faqs)
    })
  })

  describe('submit_rsvp', () => {
    it('calls invitationService with correct params', async () => {
      mockInvitationService.updateInvitation.mockResolvedValue({})

      const params = {
        eventId: 'e1',
        rsvp: 'Attending' as const,
      }
      const result = await tools.submit_rsvp.execute(params, toolOpts)

      expect(mockInvitationService.updateInvitation).toHaveBeenCalledWith({
        guestId: 42,
        eventId: 'e1',
        rsvp: 'Attending',
      })
      expect(result).toEqual({ message: 'RSVP submitted successfully' })
    })

    it('throws when no guestId in context', async () => {
      const noGuestCtx: EttaContext = { ...mockCtx, guestId: undefined }
      const noGuestTools = getConciergeTools(noGuestCtx)

      await expect(
        noGuestTools.submit_rsvp.execute(
          { eventId: 'e1', rsvp: 'Attending' as const },
          toolOpts
        )
      ).rejects.toThrow('Guest context required')
    })
  })

  describe('flag_question', () => {
    it('creates a GuestQuestion record', async () => {
      mockDb.guestQuestion.create.mockResolvedValue({ id: 'q-1' })

      const params = { question: 'Is there a shuttle?', context: 'Asked about transport' }
      const result = await tools.flag_question.execute(params, toolOpts)

      expect(mockDb.guestQuestion.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          guestId: 42,
          question: 'Is there a shuttle?',
          context: 'Asked about transport',
        },
      })
      expect(result).toEqual({ message: 'Question flagged for the couple to answer' })
    })
  })
})
