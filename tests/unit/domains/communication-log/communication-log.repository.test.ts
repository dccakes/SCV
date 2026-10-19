import { CommunicationLogRepository } from '~/server/domains/communication-log/communication-log.repository'

describe('CommunicationLogRepository timeline read model', () => {
  const householdFindFirst = jest.fn()
  const invitationFindMany = jest.fn()
  const giftFindMany = jest.fn()
  const repository = new CommunicationLogRepository({
    household: { findFirst: householdFindFirst },
    invitation: { findMany: invitationFindMany },
    gift: { findMany: giftFindMany },
  } as never)

  beforeEach(() => jest.resetAllMocks())

  it.each([
    [{ id: 'h1' }, true],
    [null, false],
  ])('householdBelongsToWedding is %p -> %p', async (row, expected) => {
    householdFindFirst.mockResolvedValue(row)

    await expect(repository.householdBelongsToWedding('h1', 'w1')).resolves.toBe(expected)
    expect(householdFindFirst).toHaveBeenCalledWith({
      where: { id: 'h1', weddingId: 'w1' },
      select: { id: true },
    })
  })

  it('reads invitations for every guest in the household', async () => {
    invitationFindMany.mockResolvedValue([])

    await repository.findInvitationEventsForHousehold('h1')

    expect(invitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { guest: { householdId: 'h1' } } })
    )
  })

  it('reads only gifts with a thank-you timestamp', async () => {
    giftFindMany.mockResolvedValue([])

    await repository.findThankYouGiftsForHousehold('h1')

    expect(giftFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { householdId: 'h1', thankYouSentAt: { not: null } } })
    )
  })
})
