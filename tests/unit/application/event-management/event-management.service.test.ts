jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/checklist')

import {
  type EventManagementRepos,
  EventManagementService,
} from '~/server/application/event-management/event-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import { mockEnsureSeeded, resetMocks as resetChecklistMocks } from '~/server/domains/checklist'
import { ForbiddenError } from '~/server/domains/shared/domain-error'
import type { UnitOfWork } from '~/server/infrastructure/database/unit-of-work'

const mockRequirePermission = requirePermission as jest.Mock
const mockEnsureSeededFn = mockEnsureSeeded as jest.Mock

const actorContext = {
  userId: 'user-123',
  activeOrganization: {
    organizationId: 'org-123',
    role: 'owner',
  },
}

const mockEvent = {
  id: 'event-123',
  name: 'Wedding Day',
  weddingId: 'wedding-123',
  allowTagAlongs: false,
}

const createRepos = () => ({
  event: {
    create: jest.fn().mockResolvedValue(mockEvent),
    findById: jest.fn().mockResolvedValue(mockEvent),
    update: jest.fn().mockResolvedValue(mockEvent),
    belongsToWedding: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(mockEvent),
  },
  guest: {
    findIdsForNewEvent: jest.fn().mockResolvedValue([]),
    findTagAlongIdsWithoutInvitation: jest.fn().mockResolvedValue([]),
  },
  invitation: {
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  checklist: { id: 'tx-bound-checklist-repo' },
})

describe('EventManagementService', () => {
  let service: EventManagementService
  let repos: ReturnType<typeof createRepos>
  let unitOfWork: jest.Mock

  beforeEach(() => {
    resetChecklistMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    mockEnsureSeededFn.mockResolvedValue({
      eventId: 'event-123',
      seededMilestoneCount: 13,
      seededTaskCount: 58,
      enabledAddOnsUpdated: false,
    })

    repos = createRepos()
    unitOfWork = jest.fn((work: (r: unknown) => Promise<unknown>) => work(repos))
    service = new EventManagementService(
      repos.event as never,
      unitOfWork as unknown as UnitOfWork<EventManagementRepos>
    )
  })

  describe('createEvent', () => {
    it('requires event create permission', async () => {
      await service.createEvent(actorContext, 'wedding-123', { eventName: 'Ceremony' } as never)

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['create'] })
    })

    it('rejects when permission is missing, before opening a transaction', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new ForbiddenError()
      })

      await expect(
        service.createEvent(actorContext, 'wedding-123', { eventName: 'Blocked' } as never)
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(unitOfWork).not.toHaveBeenCalled()
    })

    it('creates the event with its details inside one unit of work', async () => {
      await service.createEvent(actorContext, 'wedding-123', {
        eventName: 'Wedding Day',
        date: '2027-06-15',
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Beautiful Garden',
        attire: 'Formal',
        description: 'Our special day!',
        collectRsvp: true,
        allowTagAlongs: false,
      })

      expect(unitOfWork).toHaveBeenCalledTimes(1)
      expect(repos.event.create).toHaveBeenCalledWith({
        name: 'Wedding Day',
        weddingId: 'wedding-123',
        date: expect.any(Date),
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Beautiful Garden',
        attire: 'Formal',
        description: 'Our special day!',
        collectRsvp: true,
        allowTagAlongs: false,
      })
    })

    it('invites existing guests as Not Invited, excluding tag-alongs by default', async () => {
      repos.guest.findIdsForNewEvent.mockResolvedValue([1, 2])

      await service.createEvent(actorContext, 'wedding-123', { eventName: 'Ceremony' } as never)

      expect(repos.guest.findIdsForNewEvent).toHaveBeenCalledWith('wedding-123', {
        includeTagAlongs: false,
      })
      expect(repos.invitation.createMany).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-123', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 2, eventId: 'event-123', rsvp: 'Not Invited', weddingId: 'wedding-123' },
      ])
    })

    it('includes tag-alongs when the event allows them', async () => {
      await service.createEvent(actorContext, 'wedding-123', {
        eventName: 'Welcome Party',
        allowTagAlongs: true,
      } as never)

      expect(repos.guest.findIdsForNewEvent).toHaveBeenCalledWith('wedding-123', {
        includeTagAlongs: true,
      })
    })

    it('skips invitation creation when there are no guests', async () => {
      await service.createEvent(actorContext, 'wedding-123', { eventName: 'Ceremony' } as never)

      expect(repos.invitation.createMany).not.toHaveBeenCalled()
    })

    it('seeds the checklist with the transaction-bound repository', async () => {
      await service.createEvent(actorContext, 'wedding-123', { eventName: 'Ceremony' } as never)

      expect(mockEnsureSeededFn).toHaveBeenCalledWith('wedding-123', repos.checklist)
    })

    it('bubbles seeding failures from inside the unit of work', async () => {
      mockEnsureSeededFn.mockRejectedValue(new Error('seed failed'))

      await expect(
        service.createEvent(actorContext, 'wedding-123', { eventName: 'Ceremony' } as never)
      ).rejects.toThrow('seed failed')
    })
  })

  describe('createEventSystem', () => {
    it('creates the event and invitations without a permission check or checklist seeding', async () => {
      repos.guest.findIdsForNewEvent.mockResolvedValue([7])

      await service.createEventSystem('wedding-123', { eventName: 'Ceremony' } as never)

      expect(mockRequirePermission).not.toHaveBeenCalled()
      expect(repos.invitation.createMany).toHaveBeenCalledWith([
        { guestId: 7, eventId: 'event-123', rsvp: 'Not Invited', weddingId: 'wedding-123' },
      ])
      expect(mockEnsureSeededFn).not.toHaveBeenCalled()
    })
  })

  describe('updateEvent', () => {
    const update = (data: Record<string, unknown>) =>
      service.updateEvent(actorContext, 'wedding-123', {
        eventId: 'event-123',
        eventName: 'Wedding Day',
        ...data,
      } as never)

    it('requires event update permission', async () => {
      await update({})

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['update'] })
    })

    it('rejects when the event is outside the wedding', async () => {
      repos.event.belongsToWedding.mockResolvedValue(false)

      await expect(update({})).rejects.toBeInstanceOf(ForbiddenError)
      expect(unitOfWork).not.toHaveBeenCalled()
    })

    it('updates every editable field', async () => {
      await update({ collectRsvp: true, venue: 'Hall', date: '2027-01-01' })

      expect(repos.event.update).toHaveBeenCalledWith(
        'event-123',
        expect.objectContaining({
          name: 'Wedding Day',
          venue: 'Hall',
          collectRsvp: true,
          date: expect.any(Date),
        })
      )
    })

    it('invites tag-alongs without an invitation when tag-alongs are toggled on', async () => {
      repos.event.findById.mockResolvedValue({ ...mockEvent, allowTagAlongs: false })
      repos.guest.findTagAlongIdsWithoutInvitation.mockResolvedValue([10, 11])

      await update({ allowTagAlongs: true })

      expect(repos.guest.findTagAlongIdsWithoutInvitation).toHaveBeenCalledWith(
        'wedding-123',
        'event-123'
      )
      expect(repos.invitation.createMany).toHaveBeenCalledWith([
        { guestId: 10, eventId: 'event-123', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 11, eventId: 'event-123', rsvp: 'Not Invited', weddingId: 'wedding-123' },
      ])
    })

    it('does not create duplicates when every tag-along already has an invitation', async () => {
      repos.event.findById.mockResolvedValue({ ...mockEvent, allowTagAlongs: false })

      await update({ allowTagAlongs: true })

      expect(repos.invitation.createMany).not.toHaveBeenCalled()
    })

    it.each([
      ['toggled off', true, false],
      ['unchanged', false, false],
      ['already on', true, true],
    ])('leaves invitations alone when tag-alongs are %s', async (_label, was, now) => {
      repos.event.findById.mockResolvedValue({ ...mockEvent, allowTagAlongs: was })

      await update({ allowTagAlongs: now })

      expect(repos.guest.findTagAlongIdsWithoutInvitation).not.toHaveBeenCalled()
      expect(repos.invitation.createMany).not.toHaveBeenCalled()
    })
  })

  describe('deleteEvent', () => {
    it('requires event delete permission', async () => {
      await service.deleteEvent(actorContext, 'wedding-123', 'event-123')

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['delete'] })
    })

    it('rejects when the event is outside the wedding', async () => {
      repos.event.belongsToWedding.mockResolvedValue(false)

      await expect(
        service.deleteEvent(actorContext, 'wedding-123', 'event-123')
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(repos.event.delete).not.toHaveBeenCalled()
    })
  })
})
