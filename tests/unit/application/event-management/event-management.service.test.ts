import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/checklist')
jest.mock('~/server/domains/event/event.repository')

import { EventManagementService } from '~/server/application/event-management/event-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import { mockEnsureSeeded, resetMocks as resetChecklistMocks } from '~/server/domains/checklist'
import {
  EventRepository,
  mockBelongsToWedding,
  mockCreate,
  mockDelete,
  mockEvent,
  mockUpdate,
  resetMocks as resetEventRepoMocks,
} from '~/server/domains/event/event.repository'

const mockRequirePermission = requirePermission as jest.Mock
const mockEnsureSeededFn = mockEnsureSeeded as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock

const actorContext = {
  userId: 'user-123',
  activeOrganization: {
    organizationId: 'org-123',
    role: 'owner',
  },
}

const createMockDb = () => {
  const tx = {
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    guest: {
      findMany: jest.fn(),
    },
    invitation: {
      createMany: jest.fn(),
    },
  }

  return {
    $transaction: jest.fn().mockImplementation(async (fn: (t: unknown) => unknown) => fn(tx)),
    _tx: tx,
  }
}

describe('EventManagementService', () => {
  let service: EventManagementService
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    resetEventRepoMocks()
    resetChecklistMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    mockEnsureSeededFn.mockResolvedValue({
      eventId: 'event-123',
      seededMilestoneCount: 13,
      seededTaskCount: 58,
      enabledAddOnsUpdated: false,
    })

    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockCreateFn.mockResolvedValue(mockEvent)
    mockUpdateFn.mockResolvedValue(mockEvent)
    mockDeleteFn.mockResolvedValue(mockEvent)

    mockDb = createMockDb()
    const repo = new EventRepository({})
    service = new EventManagementService(repo, mockDb as never)
  })

  it('requires event create permission before creating', async () => {
    mockDb._tx.event.create.mockResolvedValue(mockEvent)
    mockDb._tx.guest.findMany.mockResolvedValue([])
    mockDb._tx.invitation.createMany.mockResolvedValue({ count: 0 })
    await service.createEvent(actorContext, 'wedding-123', { eventName: 'Ceremony' })

    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['create'] })
    expect(mockEnsureSeededFn).toHaveBeenCalledWith('wedding-123', mockDb._tx)
  })

  it('requires event update permission before updating', async () => {
    mockDb._tx.event.findUnique.mockResolvedValue({ id: 'event-123', allowTagAlongs: false })
    mockDb._tx.event.update.mockResolvedValue(mockEvent)

    await service.updateEvent(actorContext, 'wedding-123', {
      eventId: 'event-123',
      eventName: 'Updated',
    })

    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['update'] })
  })

  it('requires event delete permission before deleting', async () => {
    mockDeleteFn.mockResolvedValue(mockEvent)

    await service.deleteEvent(actorContext, 'wedding-123', 'event-123')

    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['delete'] })
    expect(mockDeleteFn).toHaveBeenCalledWith('event-123')
  })

  it('rejects update when event is outside wedding scope', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(false)

    await expect(
      service.updateEvent(actorContext, 'wedding-123', {
        eventId: 'event-999',
        eventName: 'Blocked',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('rejects delete when event is outside wedding scope', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(false)

    await expect(
      service.deleteEvent(actorContext, 'wedding-123', 'event-999')
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })

    expect(mockDeleteFn).not.toHaveBeenCalled()
  })

  it('rejects create when permission is missing', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    await expect(
      service.createEvent(actorContext, 'wedding-123', {
        eventName: 'Blocked',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('bubbles seeding failures from inside the event transaction', async () => {
    mockDb._tx.event.create.mockResolvedValue(mockEvent)
    mockDb._tx.guest.findMany.mockResolvedValue([])
    mockEnsureSeededFn.mockRejectedValue(new Error('seed failed'))

    await expect(
      service.createEvent(actorContext, 'wedding-123', {
        eventName: 'Ceremony',
      })
    ).rejects.toThrow('seed failed')
  })
})
