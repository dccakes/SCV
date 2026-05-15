import {
  getOutstandingInvitations,
  type OrganizationInvitation,
} from '~/components/settings/organization-outstanding-invites'

describe('getOutstandingInvitations', () => {
  it('returns only pending and unexpired invitations sorted by creation date desc', () => {
    const now = new Date('2026-04-06T16:00:00.000Z')
    const invites: OrganizationInvitation[] = [
      {
        createdAt: '2026-04-06T10:00:00.000Z',
        email: 'pending-new@example.com',
        expiresAt: '2026-04-10T10:00:00.000Z',
        id: '1',
        role: 'member',
        status: 'pending',
      },
      {
        createdAt: '2026-04-04T10:00:00.000Z',
        email: 'accepted@example.com',
        expiresAt: '2026-04-10T10:00:00.000Z',
        id: '2',
        role: 'member',
        status: 'accepted',
      },
      {
        createdAt: '2026-04-05T10:00:00.000Z',
        email: 'pending-old@example.com',
        expiresAt: '2026-04-08T10:00:00.000Z',
        id: '3',
        role: 'admin',
        status: 'pending',
      },
      {
        createdAt: '2026-04-03T10:00:00.000Z',
        email: 'expired@example.com',
        expiresAt: '2026-04-04T10:00:00.000Z',
        id: '4',
        role: 'member',
        status: 'pending',
      },
    ]

    expect(getOutstandingInvitations(invites, now)).toEqual([invites[0], invites[2]])
  })
})
