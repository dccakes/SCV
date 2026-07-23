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

describe('HouseholdRepository.searchPublicByName', () => {
  const mockHouseholdFindMany = jest.fn()

  const mockDb = {
    household: {
      findMany: mockHouseholdFindMany,
    },
  }

  let repository: HouseholdRepository

  const guest = (firstName: string, lastName: string) => ({
    firstName,
    lastName,
    invitations: [],
    guestTagAssignments: [],
  })

  const household = (id: string, ...guests: ReturnType<typeof guest>[]) => ({ id, guests })

  const HOUSEHOLDS = [
    household('h-sarah-smith', guest('Sarah', 'Smith')),
    household('h-sarah-jones', guest('Sarah', 'Jones')),
    household('h-sarah-jane', guest('Sarah-Jane', 'Baker')),
    household('h-obrien', guest("O'Brien", 'Murphy')),
    // Two members whose names each match one term of "Papa Baby".
    household('h-bears', guest('Papa', 'Bear'), guest('Baby', 'Bear')),
  ]

  beforeEach(() => {
    jest.resetAllMocks()
    mockHouseholdFindMany.mockResolvedValue(HOUSEHOLDS)
    repository = new HouseholdRepository(mockDb as never)
  })

  const idsFor = async (searchText: string) =>
    (await repository.searchPublicByName(searchText, 'wedding-1')).map((h) => h.id)

  it('returns nothing without querying for a single (first-name-only) term', async () => {
    const result = await repository.searchPublicByName('Sarah', 'wedding-1')

    expect(result).toEqual([])
    expect(mockHouseholdFindMany).not.toHaveBeenCalled()
  })

  it('scopes the query to the wedding and to invited households', async () => {
    await repository.searchPublicByName('Sarah Smith', 'wedding-1')

    expect(mockHouseholdFindMany.mock.calls[0][0].where).toEqual({
      weddingId: 'wedding-1',
      guests: {
        some: {
          invitations: { some: { rsvp: { in: ['Invited', 'Attending', 'Declined'] } } },
        },
      },
    })
  })

  it('requires first and last name, so a common first name no longer matches everyone', async () => {
    // "Sarah" alone is rejected above; "Sarah Smith" pins one household.
    expect(await idsFor('Sarah Smith')).toEqual(['h-sarah-smith'])
  })

  it('requires all terms to match the SAME guest, not different household members', async () => {
    // "Papa Baby" would match the Bears household if terms could spread across
    // members; matched against a single guest it should find no one.
    expect(await idsFor('Papa Baby')).toEqual([])
    expect(await idsFor('Papa Bear')).toEqual(['h-bears'])
  })

  it('treats hyphens and spaces interchangeably', async () => {
    expect(await idsFor('Sarah Jane Baker')).toEqual(['h-sarah-jane'])
    expect(await idsFor('Sarah-Jane Baker')).toEqual(['h-sarah-jane'])
  })

  it('ignores apostrophes when matching', async () => {
    expect(await idsFor('OBrien Murphy')).toEqual(['h-obrien'])
    expect(await idsFor("O'Brien Murphy")).toEqual(['h-obrien'])
  })

  it('stays partial- and case-tolerant', async () => {
    expect(await idsFor('sar smi')).toEqual(['h-sarah-smith'])
  })

  it('returns nothing when no single guest matches every term', async () => {
    expect(await idsFor('Sarah Nonexistent')).toEqual([])
  })
})
