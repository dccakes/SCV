import { GuestRepository } from '~/server/domains/guest/guest.repository'

describe('GuestRepository event invitation queries', () => {
  const findMany = jest.fn()
  const repository = new GuestRepository({ guest: { findMany } } as never)

  beforeEach(() => {
    findMany.mockReset()
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
  })

  it('finds non-tag-along guest ids for a new event by default', async () => {
    await expect(
      repository.findIdsForNewEvent('wedding-1', { includeTagAlongs: false })
    ).resolves.toEqual([1, 2])

    expect(findMany).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1', isTagAlong: false },
      select: { id: true },
    })
  })

  it('includes tag-alongs when the event allows them', async () => {
    await repository.findIdsForNewEvent('wedding-1', { includeTagAlongs: true })

    expect(findMany).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1' },
      select: { id: true },
    })
  })

  it('finds tag-alongs that have no invitation to the event yet', async () => {
    await expect(
      repository.findTagAlongIdsWithoutInvitation('wedding-1', 'event-1')
    ).resolves.toEqual([1, 2])

    expect(findMany).toHaveBeenCalledWith({
      where: {
        weddingId: 'wedding-1',
        isTagAlong: true,
        invitations: { none: { eventId: 'event-1' } },
      },
      select: { id: true },
    })
  })
})
