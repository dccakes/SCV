/**
 * Tests for EventRepository.findByWeddingIdWithStats - estimated attendance calculation
 */

jest.mock('server/infrastructure/database/client')

// @ts-expect-error - Importing mock functions from mocked module
import { db, mockEventFindMany } from 'server/infrastructure/database/client'
import { EventRepository } from '~/server/domains/event/event.repository'

const mockEventFindManyFn = mockEventFindMany as jest.Mock

function makeInvitation(
  rsvp: string,
  likelihoodOfAttending: number | null = null,
  isTagAlong = false
) {
  return {
    rsvp,
    guest: {
      isTagAlong,
      household: { likelihoodOfAttending },
    },
  }
}

function makeEvent(overrides: {
  invitations: ReturnType<typeof makeInvitation>[]
  allowTagAlongs?: boolean
}) {
  return {
    id: 'event-1',
    name: 'Wedding',
    date: new Date('2026-06-15'),
    startTime: '14:00',
    endTime: '22:00',
    venue: 'Garden',
    attire: 'Formal',
    description: null,
    weddingId: 'wedding-1',
    collectRsvp: true,
    allowTagAlongs: overrides.allowTagAlongs ?? false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    invitations: overrides.invitations,
  }
}

describe('EventRepository - estimatedAttendance', () => {
  let repo: EventRepository

  beforeEach(() => {
    mockEventFindManyFn.mockReset()
    repo = new EventRepository(db)
  })

  it('should count attending guests at 100%', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Attending', 1), // likelihood irrelevant for attending
          makeInvitation('Attending', 5),
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    expect(result?.estimatedAttendance).toBe(2)
  })

  it('should count declined guests at 0%', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Declined', 5), // even very likely, declined = 0
          makeInvitation('Declined', 5),
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    expect(result?.estimatedAttendance).toBe(0)
  })

  it('should use likelihood weights for pending (Invited) guests', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Invited', 5), // 0.95
          makeInvitation('Invited', 1), // 0.15
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    // round(0.95 + 0.15) = round(1.10) = 1
    expect(result?.estimatedAttendance).toBe(1)
  })

  it('should use default weight (0.65) for null likelihood', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [makeInvitation('Invited', null), makeInvitation('Invited', null)],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    // round(0.65 + 0.65) = round(1.30) = 1
    expect(result?.estimatedAttendance).toBe(1)
  })

  it('should combine attending, declined, and pending correctly', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Attending', 3), // 1.0 (confirmed)
          makeInvitation('Attending', 3), // 1.0 (confirmed)
          makeInvitation('Declined', 5), // 0.0 (declined)
          makeInvitation('Invited', 5), // 0.95
          makeInvitation('Invited', 4), // 0.80
          makeInvitation('Invited', null), // 0.65
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    // round(1 + 1 + 0 + 0.95 + 0.80 + 0.65) = round(4.40) = 4
    expect(result?.estimatedAttendance).toBe(4)
  })

  it('should exclude Not Invited guests entirely', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Not Invited', 5),
          makeInvitation('Not Invited', 5),
          makeInvitation('Attending', 3),
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    expect(result?.estimatedAttendance).toBe(1)
  })

  it('should return 0 when all guests are declined or not invited', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [makeInvitation('Not Invited', 5), makeInvitation('Declined', 5)],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    expect(result?.estimatedAttendance).toBe(0)
  })

  it('should return 0 for event with no invitations', async () => {
    mockEventFindManyFn.mockResolvedValue([makeEvent({ invitations: [] })])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    expect(result?.estimatedAttendance).toBe(0)
  })

  it('should exclude tag-along guests when event does not allow them', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        allowTagAlongs: false,
        invitations: [
          makeInvitation('Attending', 5, false), // counted: 1.0
          makeInvitation('Attending', 5, true), // tag-along: excluded
          makeInvitation('Invited', 4, false), // counted: 0.80
          makeInvitation('Invited', 4, true), // tag-along: excluded
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    // round(1 + 0.80) = round(1.80) = 2
    expect(result?.estimatedAttendance).toBe(2)
    expect(result?.guestResponses.attending).toBe(1)
  })

  it('should include tag-along guests when event allows them', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        allowTagAlongs: true,
        invitations: [
          makeInvitation('Attending', 5, false), // 1.0
          makeInvitation('Attending', 5, true), // 1.0 (included)
          makeInvitation('Invited', 4, true), // 0.80 (included)
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    // round(1 + 1 + 0.80) = round(2.80) = 3
    expect(result?.estimatedAttendance).toBe(3)
  })

  it('should round estimate to nearest integer', async () => {
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Invited', 3), // 0.55 — rounds to 1
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    expect(result?.estimatedAttendance).toBe(1)
  })

  it('should handle each likelihood weight correctly', async () => {
    // One guest at each scale point, all pending
    mockEventFindManyFn.mockResolvedValue([
      makeEvent({
        invitations: [
          makeInvitation('Invited', 1), // 0.15
          makeInvitation('Invited', 2), // 0.35
          makeInvitation('Invited', 3), // 0.55
          makeInvitation('Invited', 4), // 0.80
          makeInvitation('Invited', 5), // 0.95
        ],
      }),
    ])

    const [result] = await repo.findByWeddingIdWithStats('wedding-1')
    // round(0.15 + 0.35 + 0.55 + 0.80 + 0.95) = round(2.80) = 3
    expect(result?.estimatedAttendance).toBe(3)
  })

  it('keeps RSVP counts independent per event when guests overlap', async () => {
    mockEventFindManyFn.mockResolvedValue([
      {
        ...makeEvent({
          invitations: [makeInvitation('Attending', 5), makeInvitation('Declined', 5)],
        }),
        id: 'event-a',
        name: 'Ceremony',
      },
      {
        ...makeEvent({
          invitations: [makeInvitation('Invited', 5), makeInvitation('Attending', 5)],
        }),
        id: 'event-b',
        name: 'Reception',
      },
    ])

    const results = await repo.findByWeddingIdWithStats('wedding-1')
    const ceremony = results.find((event) => event.id === 'event-a')
    const reception = results.find((event) => event.id === 'event-b')

    expect(ceremony).toMatchObject({
      guestResponses: {
        attending: 1,
        invited: 0,
        declined: 1,
        notInvited: 0,
      },
    })
    expect(reception).toMatchObject({
      guestResponses: {
        attending: 1,
        invited: 1,
        declined: 0,
        notInvited: 0,
      },
    })
  })
})
