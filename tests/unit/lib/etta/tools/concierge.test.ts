/**
 * @jest-environment node
 */

import { getConciergeTools } from '~/lib/etta/tools/concierge'
import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

jest.mock('~/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://oswp.test' },
}))

jest.mock('~/server/db', () => ({
  db: {
    wedding: { findUnique: jest.fn() },
    event: { findMany: jest.fn() },
    faq: { findMany: jest.fn() },
    guestQuestion: { create: jest.fn() },
    invitation: { updateMany: jest.fn() },
    guest: { findUnique: jest.fn() },
    household: { findUnique: jest.fn(), update: jest.fn() },
    website: { findFirst: jest.fn() },
  },
}))

const mockDb = db as {
  wedding: { findUnique: jest.Mock }
  event: { findMany: jest.Mock }
  faq: { findMany: jest.Mock }
  guestQuestion: { create: jest.Mock }
  invitation: { updateMany: jest.Mock }
  guest: { findUnique: jest.Mock }
  household: { findUnique: jest.Mock; update: jest.Mock }
  website: { findFirst: jest.Mock }
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
    it('returns wedding info from context and events from DB', async () => {
      const events = [
        { id: 'e1', name: 'Ceremony', date: '2026-06-15', startTime: '14:00', venue: 'Chapel' },
        { id: 'e2', name: 'Reception', date: '2026-06-15', startTime: '18:00', venue: 'Ballroom' },
      ]
      mockDb.event.findMany.mockResolvedValue(events)

      const result = await tools.get_public_info.execute({}, toolOpts)

      // Wedding data comes from ctx.wedding, not a DB query
      expect(mockDb.wedding.findUnique).not.toHaveBeenCalled()
      expect(mockDb.event.findMany).toHaveBeenCalledWith({
        where: { weddingId: 'wedding-123' },
        select: { name: true, date: true, startTime: true, venue: true },
      })
      expect(result).toEqual({
        couple: mockCtx.wedding,
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
    it('updates invitation via Prisma with correct params', async () => {
      mockDb.invitation.updateMany.mockResolvedValue({ count: 1 })

      const params = {
        eventId: 'e1',
        rsvp: 'Attending' as const,
      }
      const result = await tools.submit_rsvp.execute(params, toolOpts)

      expect(mockDb.invitation.updateMany).toHaveBeenCalledWith({
        where: { guestId: 42, eventId: 'e1' },
        data: { rsvp: 'Attending' },
      })
      expect(result).toEqual({ message: 'RSVP submitted successfully' })
    })

    it('throws when no guestId in context', async () => {
      const noGuestCtx: EttaContext = { ...mockCtx, guestId: undefined }
      const noGuestTools = getConciergeTools(noGuestCtx)

      await expect(
        noGuestTools.submit_rsvp.execute({ eventId: 'e1', rsvp: 'Attending' as const }, toolOpts)
      ).rejects.toThrow('Guest context required')
    })
  })

  describe('get_my_household', () => {
    it('returns household members with their RSVP statuses', async () => {
      mockDb.guest.findUnique.mockResolvedValue({ householdId: 'household-1' })
      mockDb.household.findUnique.mockResolvedValue({
        id: 'household-1',
        guests: [
          {
            id: 42,
            firstName: 'Maria',
            lastName: 'Lopez',
            isPrimaryContact: true,
            invitations: [{ eventId: 'e1', rsvp: 'Attending', event: { name: 'Ceremony' } }],
          },
        ],
      })

      const result = await tools.get_my_household.execute({}, toolOpts)

      expect(result).toEqual({
        householdId: 'household-1',
        members: [
          {
            firstName: 'Maria',
            lastName: 'Lopez',
            isPrimaryContact: true,
            rsvps: [{ event: 'Ceremony', rsvp: 'Attending' }],
          },
        ],
      })
    })

    it('throws when no guestId in context', async () => {
      const noGuestTools = getConciergeTools({ ...mockCtx, guestId: undefined })
      await expect(noGuestTools.get_my_household.execute({}, toolOpts)).rejects.toThrow(
        'Guest context required'
      )
    })
  })

  describe('get_invite_link', () => {
    it('returns the existing invite link when the code is still valid', async () => {
      mockDb.guest.findUnique.mockResolvedValue({ householdId: 'household-1' })
      mockDb.household.findUnique.mockResolvedValue({
        id: 'household-1',
        weddingId: 'wedding-123',
        inviteCode: 'ml-abc234',
        inviteCodeExpiresAt: new Date(Date.now() + 86_400_000),
        guests: [{ firstName: 'Maria', lastName: 'Lopez' }],
      })
      mockDb.website.findFirst.mockResolvedValue({ subUrl: 'maria-and-john' })

      const result = await tools.get_invite_link.execute({}, toolOpts)

      expect(result).toEqual(
        expect.objectContaining({
          url: 'https://oswp.test/w/maria-and-john/save-the-date/ml-abc234',
        })
      )
      expect(mockDb.household.update).not.toHaveBeenCalled()
    })

    it('generates a fresh code when the household has none', async () => {
      mockDb.guest.findUnique.mockResolvedValue({ householdId: 'household-1' })
      mockDb.household.findUnique.mockResolvedValue({
        id: 'household-1',
        weddingId: 'wedding-123',
        inviteCode: null,
        inviteCodeExpiresAt: null,
        guests: [{ firstName: 'Maria', lastName: 'Lopez' }],
      })
      mockDb.website.findFirst.mockResolvedValue({ subUrl: 'maria-and-john' })
      mockDb.household.update.mockResolvedValue({})

      const result = (await tools.get_invite_link.execute({}, toolOpts)) as { url: string }

      expect(mockDb.household.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'household-1' } })
      )
      expect(result.url).toMatch(
        /^https:\/\/oswp\.test\/w\/maria-and-john\/save-the-date\/ml-[a-z0-9]{6}$/
      )
    })

    it('explains when the couple has no published website yet', async () => {
      mockDb.guest.findUnique.mockResolvedValue({ householdId: 'household-1' })
      mockDb.household.findUnique.mockResolvedValue({
        id: 'household-1',
        weddingId: 'wedding-123',
        inviteCode: null,
        inviteCodeExpiresAt: null,
        guests: [],
      })
      mockDb.website.findFirst.mockResolvedValue(null)

      const result = await tools.get_invite_link.execute({}, toolOpts)

      expect(result).toEqual({
        status: 'unavailable',
        message: expect.stringContaining('website'),
      })
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
