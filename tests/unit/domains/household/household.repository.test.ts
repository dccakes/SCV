import { HouseholdRepository } from '~/server/domains/household/household.repository'

describe('HouseholdRepository.search', () => {
  const mockHouseholdFindMany = jest.fn()

  const mockDb = {
    household: {
      findMany: mockHouseholdFindMany,
    },
  }

  let repository: HouseholdRepository

  beforeEach(() => {
    jest.resetAllMocks()
    mockHouseholdFindMany.mockResolvedValue([])
    repository = new HouseholdRepository(mockDb as never)
  })

  const whereOf = () => mockHouseholdFindMany.mock.calls[0]?.[0]?.where

  it('scopes the search to the wedding and only invited households', async () => {
    await repository.search('Betum', 'wedding-1')

    const where = whereOf()
    expect(where.weddingId).toBe('wedding-1')
    // Households must have at least one guest with an actionable invitation.
    expect(where.guests).toEqual({
      some: {
        invitations: { some: { rsvp: { in: ['Invited', 'Attending', 'Declined'] } } },
      },
    })
  })

  it('matches a single term against first or last name, case-insensitively', async () => {
    await repository.search('Betum', 'wedding-1')

    expect(whereOf().AND).toEqual([
      {
        guests: {
          some: {
            OR: [
              { firstName: { contains: 'Betum', mode: 'insensitive' } },
              { lastName: { contains: 'Betum', mode: 'insensitive' } },
            ],
          },
        },
      },
    ])
  })

  it('requires every whitespace-separated term to match, so a full name works', async () => {
    // The RSVP "Full Name" field leads guests to type first + last together.
    // First/last names live in separate columns, so each term matches
    // independently and all terms must be satisfied by the household.
    await repository.search('Betum Adobo', 'wedding-1')

    const and = whereOf().AND
    expect(and).toHaveLength(2)
    expect(and[0].guests.some.OR).toEqual([
      { firstName: { contains: 'Betum', mode: 'insensitive' } },
      { lastName: { contains: 'Betum', mode: 'insensitive' } },
    ])
    expect(and[1].guests.some.OR).toEqual([
      { firstName: { contains: 'Adobo', mode: 'insensitive' } },
      { lastName: { contains: 'Adobo', mode: 'insensitive' } },
    ])
  })

  it('collapses extra whitespace between terms', async () => {
    await repository.search('  Betum   Adobo  ', 'wedding-1')

    expect(whereOf().AND).toHaveLength(2)
  })

  it('returns nothing without hitting the database for a blank search', async () => {
    const result = await repository.search('   ', 'wedding-1')

    expect(result).toEqual([])
    expect(mockHouseholdFindMany).not.toHaveBeenCalled()
  })
})
