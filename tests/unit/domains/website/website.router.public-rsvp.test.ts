/**
 * Tests for website router public RSVP boundary.
 */

jest.mock('~/lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))
jest.mock('~/server/db', () => ({ db: {} }))

jest.mock('~/server/domains/website', () => ({
  websiteService: {
    enableWebsite: jest.fn(),
    updateWebsite: jest.fn(),
    updateRsvpEnabled: jest.fn(),
    updateCoverPhoto: jest.fn(),
    getByWeddingId: jest.fn(),
    getBySubUrl: jest.fn(),
    hasPasswordAccess: jest.fn(),
    verifyWebsitePassword: jest.fn(),
    fetchWeddingData: jest.fn(),
  },
}))

jest.mock('~/server/application/rsvp-submission', () => {
  const { z } = require('zod')

  return {
    submitPublicRsvpSchema: z.object({
      subUrl: z.string().min(1),
      token: z.string().min(1),
      rsvpResponses: z.array(
        z.object({
          guestId: z.number(),
          eventId: z.string(),
          rsvp: z.string(),
        })
      ),
      answersToQuestions: z.array(z.object({}).passthrough()),
    }),
    rsvpSubmissionService: {
      submitPublicRsvp: jest.fn(),
    },
  }
})

// @ts-expect-error - mocked module
import { rsvpSubmissionService } from '~/server/application/rsvp-submission'
import { websiteRouter } from '~/server/domains/website/website.router'

const mockSubmitPublicRsvp = rsvpSubmissionService.submitPublicRsvp as jest.Mock

const validInput = {
  subUrl: 'ash-and-jamie',
  token: 'a'.repeat(32),
  rsvpResponses: [{ guestId: 1, eventId: 'event-1', rsvp: 'Attending' }],
  answersToQuestions: [],
}

function makePublicCaller() {
  return websiteRouter.createCaller({
    db: {} as never,
    auth: { userId: null, session: null },
    headers: new Headers(),
  })
}

describe('websiteRouter public RSVP boundary', () => {
  beforeEach(() => {
    mockSubmitPublicRsvp.mockReset()
  })

  it('allows unauthenticated valid-token submissions', async () => {
    mockSubmitPublicRsvp.mockResolvedValue({ success: true })
    const caller = makePublicCaller()

    const result = await caller.submitPublicRsvpForm(validInput)

    expect(result).toEqual({ success: true })
    expect(mockSubmitPublicRsvp).toHaveBeenCalledWith(validInput)
  })

  it('propagates invalid or expired token rejection', async () => {
    const { TRPCError } = await import('@trpc/server')
    mockSubmitPublicRsvp.mockRejectedValue(
      new TRPCError({ code: 'FORBIDDEN', message: 'Invalid or expired RSVP token' })
    )

    const caller = makePublicCaller()

    await expect(caller.submitPublicRsvpForm(validInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Invalid or expired RSVP token',
    })
  })
})
