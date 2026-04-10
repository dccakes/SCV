import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/application/event-insights', () => ({
  eventInsightsService: {
    listInvitations: jest.fn(),
  },
}))

jest.mock('server/domains/invitation', () => ({
  invitationService: {
    createInvitation: jest.fn(),
    updateInvitation: jest.fn(),
    bulkUpdateInvitations: jest.fn(),
  },
}))

import { eventInsightsService } from 'server/application/event-insights'
import { invitationService } from 'server/domains/invitation'
import { invitationRouter } from 'server/domains/invitation/invitation.router'

const mockCreateInvitation = invitationService.createInvitation as jest.Mock
const mockListInvitations = eventInsightsService.listInvitations as jest.Mock
const mockUpdateInvitation = invitationService.updateInvitation as jest.Mock
const mockBulkUpdateInvitations = invitationService.bulkUpdateInvitations as jest.Mock

describe('invitationRouter authz context plumbing', () => {
  const activeOrganization = {
    organizationId: 'org-123',
    role: 'owner',
  }

  const caller = invitationRouter.createCaller({
    auth: {
      session: { user: { id: 'user-123' } },
      activeOrganization,
      activeWeddingId: 'wedding-123',
      userId: 'user-123',
    },
    authz: {
      userId: 'user-123',
      activeOrganization,
    },
    db: {} as never,
    headers: new Headers(),
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('passes authz context to create mutation service call', async () => {
    mockCreateInvitation.mockResolvedValue({ id: 'inv-1' })

    await caller.create({
      eventId: 'event-1',
      guestId: 1,
      rsvp: 'Invited',
    })

    expect(mockCreateInvitation).toHaveBeenCalledWith(
      {
        activeOrganization,
        userId: 'user-123',
      },
      'wedding-123',
      {
        eventId: 'event-1',
        guestId: 1,
        rsvp: 'Invited',
      }
    )
  })

  it('passes authz context to update mutation service call', async () => {
    mockUpdateInvitation.mockResolvedValue({ id: 'inv-1' })

    await caller.update({
      eventId: 'event-1',
      guestId: 1,
      rsvp: 'Attending',
    })

    expect(mockUpdateInvitation).toHaveBeenCalledWith(
      {
        activeOrganization,
        userId: 'user-123',
      },
      'wedding-123',
      {
        eventId: 'event-1',
        guestId: 1,
        rsvp: 'Attending',
      }
    )
  })

  it('keeps invitation list route protected and scoped to active wedding', async () => {
    mockListInvitations.mockResolvedValue([{ id: 'inv-1' }])

    await caller.getAllByUserId()

    expect(mockListInvitations).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123'
    )
  })

  it('rejects unauthenticated invitation reads with UNAUTHORIZED', async () => {
    const unauthenticatedCaller = invitationRouter.createCaller({
      auth: {
        session: null,
        activeOrganization: null,
        activeWeddingId: 'wedding-123',
        userId: null,
      },
      authz: {
        userId: '',
        activeOrganization: null,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(unauthenticatedCaller.getAllByUserId()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('passes authz context to bulkUpdate mutation service call', async () => {
    mockBulkUpdateInvitations.mockResolvedValue([{ id: 'inv-1' }, { id: 'inv-2' }])

    await caller.bulkUpdate({
      invitations: [
        { eventId: 'event-1', guestId: 1, rsvp: 'Invited' },
        { eventId: 'event-1', guestId: 2, rsvp: 'Invited' },
      ],
    })

    expect(mockBulkUpdateInvitations).toHaveBeenCalledWith(
      {
        activeOrganization,
        userId: 'user-123',
      },
      'wedding-123',
      {
        invitations: [
          { eventId: 'event-1', guestId: 1, rsvp: 'Invited' },
          { eventId: 'event-1', guestId: 2, rsvp: 'Invited' },
        ],
      }
    )
  })

  it('rejects unauthenticated bulkUpdate with UNAUTHORIZED', async () => {
    const unauthenticatedCaller = invitationRouter.createCaller({
      auth: {
        session: null,
        activeOrganization: null,
        activeWeddingId: 'wedding-123',
        userId: null,
      },
      authz: {
        userId: '',
        activeOrganization: null,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(
      unauthenticatedCaller.bulkUpdate({
        invitations: [{ eventId: 'event-1', guestId: 1, rsvp: 'Invited' }],
      })
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects viewer invitation reads with FORBIDDEN', async () => {
    const forbiddenError = new TRPCError({ code: 'FORBIDDEN' })
    mockListInvitations.mockRejectedValue(forbiddenError)

    const viewerCaller = invitationRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization: { organizationId: 'org-123', role: 'viewer' },
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization: { organizationId: 'org-123', role: 'viewer' },
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(viewerCaller.getAllByUserId()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
