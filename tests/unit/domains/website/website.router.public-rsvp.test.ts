/**
 * Tests for website router public RSVP boundary.
 */

jest.mock('~/lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))
jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))
jest.mock('~/server/db', () => ({ db: {} }))

jest.mock('~/server/domains/website', () => ({
  websiteService: {
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

jest.mock('~/server/application/website-management', () => ({
  websiteManagementService: {
    enableWebsite: jest.fn(),
    fetchWeddingData: jest.fn(),
  },
}))

jest.mock('~/server/application/rsvp-submission', () => ({
  // Real schema, so the router boundary is tested with production validation.
  submitPublicRsvpSchema: jest.requireActual(
    '~/server/application/rsvp-submission/rsvp-submission.validator'
  ).submitPublicRsvpSchema,
  rsvpSubmissionService: {
    submitPublicRsvp: jest.fn(),
  },
}))

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

  // openspec rsvp-status: public submission rejects unknown values before any write
  it.each([
    'Maybe',
    'attending',
  ])('rejects a submission containing RSVP status %p without calling the service', async (rsvp) => {
    await expect(
      makePublicCaller().submitPublicRsvpForm({
        ...validInput,
        rsvpResponses: [
          { guestId: 1, eventId: 'event-1', rsvp: 'Attending' },
          { guestId: 2, eventId: 'event-1', rsvp: rsvp as 'Attending' },
        ],
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(mockSubmitPublicRsvp).not.toHaveBeenCalled()
  })
})
