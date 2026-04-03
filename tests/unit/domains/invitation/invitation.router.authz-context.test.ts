jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/domains/invitation', () => ({
  invitationService: {
    createInvitation: jest.fn(),
    getAllByWeddingId: jest.fn(),
    updateInvitation: jest.fn(),
  },
}))

import { invitationService } from 'server/domains/invitation'
import { invitationRouter } from 'server/domains/invitation/invitation.router'

const mockCreateInvitation = invitationService.createInvitation as jest.Mock
const mockUpdateInvitation = invitationService.updateInvitation as jest.Mock

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
})
