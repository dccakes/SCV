import type { TRPCError } from '@trpc/server'

import {
  assertEntityInActiveOrganization,
  assertEventInActiveOrganization,
  assertGuestInActiveOrganization,
  assertInvitationInActiveOrganization,
} from 'server/authz/organization-scope'

const activeOrganization = {
  organizationId: 'org-1',
  role: 'owner',
}

describe('organization scope guards', () => {
  it('allows access when entity organization matches active organization', () => {
    expect(() =>
      assertEntityInActiveOrganization({
        activeOrganization,
        entityName: 'event',
        entityId: 'evt-1',
        entityOrganizationId: 'org-1',
      })
    ).not.toThrow()
  })

  it('throws FORBIDDEN when entity organization differs from active organization', () => {
    expect(() =>
      assertEntityInActiveOrganization({
        activeOrganization,
        entityName: 'event',
        entityId: 'evt-1',
        entityOrganizationId: 'org-2',
      })
    ).toThrow(
      expect.objectContaining<Partial<TRPCError>>({
        code: 'FORBIDDEN',
      })
    )
  })

  it('resolves event scope using repository helper', async () => {
    const eventRepository = {
      findOrganizationIdByEventId: jest.fn().mockResolvedValue('org-1'),
    }

    await expect(
      assertEventInActiveOrganization({
        activeOrganization,
        eventId: 'evt-1',
        eventRepository,
      })
    ).resolves.toBeUndefined()
  })

  it('throws PRECONDITION_FAILED when event is missing organization mapping', async () => {
    const eventRepository = {
      findOrganizationIdByEventId: jest.fn().mockResolvedValue(null),
    }

    await expect(
      assertEventInActiveOrganization({
        activeOrganization,
        eventId: 'evt-1',
        eventRepository,
      })
    ).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })

  it('resolves guest scope using repository helper', async () => {
    const guestRepository = {
      findOrganizationIdByGuestId: jest.fn().mockResolvedValue('org-1'),
    }

    await expect(
      assertGuestInActiveOrganization({
        activeOrganization,
        guestId: 10,
        guestRepository,
      })
    ).resolves.toBeUndefined()
  })

  it('resolves invitation scope using repository helper', async () => {
    const invitationRepository = {
      findOrganizationIdByInvitationId: jest.fn().mockResolvedValue('org-1'),
    }

    await expect(
      assertInvitationInActiveOrganization({
        activeOrganization,
        invitation: { guestId: 10, eventId: 'evt-1' },
        invitationRepository,
      })
    ).resolves.toBeUndefined()
  })
})
