jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

import { HouseholdInviteService } from '~/server/application/household-invite/household-invite.service'
import { verifyHouseholdInviteToken } from '~/server/application/household-invite/household-invite-token'

const authz = {
  userId: 'user-123',
  activeOrganization: {
    organizationId: 'org-123',
    role: 'owner',
  },
}

const createDb = () => {
  const tx = {
    household: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    guest: {
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  }

  return {
    household: {
      findFirst: jest.fn(),
    },
    website: {
      findFirst: jest.fn(),
    },
    guest: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: typeof tx) => unknown) => callback(tx)),
    __tx: tx,
  }
}

const inviteHousehold = {
  id: 'household-123',
  weddingId: 'wedding-123',
  address1: null,
  address2: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  wedding: {
    groomFirstName: 'Diego',
    groomLastName: 'Carvallo',
    brideFirstName: 'Laura',
    brideLastName: 'Zurich',
  },
  guests: [
    {
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
    },
  ],
}

describe('HouseholdInviteService', () => {
  const originalBetterAuthSecret = process.env.BETTER_AUTH_SECRET

  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-household-invite-service'
    jest.useFakeTimers().setSystemTime(new Date('2026-06-18T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    process.env.BETTER_AUTH_SECRET = originalBetterAuthSecret
  })

  it('generates a one-year invite link for a household in the active wedding', async () => {
    const db = createDb()
    db.household.findFirst.mockResolvedValue({ id: 'household-123', weddingId: 'wedding-123' })
    db.website.findFirst.mockResolvedValue({ subUrl: 'diego-and-laura' })
    const service = new HouseholdInviteService(db as never)

    const result = await service.generateInviteLink(authz, 'wedding-123', {
      householdId: 'household-123',
      baseUrl: 'https://example.com/dashboard',
    })

    const token = result.url.split('/').at(-1)
    expect(result.url).toMatch(/^https:\/\/example\.com\/diego-and-laura\/invite\//)
    expect(verifyHouseholdInviteToken(token)).toEqual({
      weddingId: 'wedding-123',
      householdId: 'household-123',
      expiresAt: new Date('2027-06-18T12:00:00.000Z'),
    })
    expect(db.household.findFirst).toHaveBeenCalledWith({
      where: { id: 'household-123', weddingId: 'wedding-123' },
      select: { id: true, weddingId: true },
    })
  })

  it('returns null when the invite token wedding does not match the website sub URL', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'different-wedding' })
    const service = new HouseholdInviteService(db as never)

    const token = service.createTokenForTesting({
      weddingId: 'wedding-123',
      householdId: 'household-123',
    })

    await expect(service.getInviteData('diego-and-laura', token)).resolves.toBeNull()
    expect(db.household.findFirst).not.toHaveBeenCalled()
  })

  it('rejects updates that include a guest outside the token household', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const token = service.createTokenForTesting({
      weddingId: 'wedding-123',
      householdId: 'household-123',
    })

    await expect(
      service.updateHouseholdDetails('diego-and-laura', token, {
        address1: '123 Main St',
        address2: null,
        city: 'Puebla',
        state: 'Puebla',
        zipCode: '72000',
        country: 'Mexico',
        guests: [
          {
            guestId: 1,
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
            phone: null,
          },
          {
            guestId: 2,
            firstName: 'Grace',
            lastName: 'Hopper',
            email: 'grace@example.com',
            phone: null,
          },
        ],
      })
    ).rejects.toHaveProperty('code', 'FORBIDDEN')
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('updates only the scoped household and guests with normalized details', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const token = service.createTokenForTesting({
      weddingId: 'wedding-123',
      householdId: 'household-123',
    })

    await expect(
      service.updateHouseholdDetails('diego-and-laura', token, {
        address1: ' 123 Main St ',
        address2: '',
        city: ' Puebla ',
        state: 'Puebla',
        zipCode: '72000',
        country: 'Mexico',
        guests: [
          {
            guestId: 1,
            firstName: ' Ada ',
            lastName: ' Lovelace ',
            email: ' ADA@EXAMPLE.COM ',
            phone: ' +1 555 0100 ',
          },
        ],
      })
    ).resolves.toEqual({ success: true })

    expect(db.__tx.household.updateMany).toHaveBeenCalledWith({
      where: { id: 'household-123', weddingId: 'wedding-123' },
      data: {
        address1: '123 Main St',
        address2: null,
        city: 'Puebla',
        state: 'Puebla',
        zipCode: '72000',
        country: 'Mexico',
      },
    })
    expect(db.__tx.guest.findFirst).toHaveBeenCalledWith({
      where: {
        weddingId: 'wedding-123',
        email: { in: ['ada@example.com'] },
        id: { notIn: [1] },
      },
      select: { id: true },
    })
    expect(db.__tx.guest.updateMany).toHaveBeenCalledWith({
      where: { id: 1, householdId: 'household-123', weddingId: 'wedding-123' },
      data: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+1 555 0100',
      },
    })
  })

  it('rejects malformed guest IDs before opening a transaction', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const token = service.createTokenForTesting({
      weddingId: 'wedding-123',
      householdId: 'household-123',
    })

    await expect(
      service.updateHouseholdDetails('diego-and-laura', token, {
        address1: null,
        address2: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        guests: [
          {
            guestId: Number.NaN,
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
            phone: null,
          },
        ],
      })
    ).rejects.toHaveProperty('code', 'BAD_REQUEST')
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects duplicate submitted emails before writing', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue({
      ...inviteHousehold,
      guests: [
        inviteHousehold.guests[0],
        {
          id: 2,
          firstName: 'Grace',
          lastName: 'Hopper',
          email: null,
          phone: null,
        },
      ],
    })
    const service = new HouseholdInviteService(db as never)
    const token = service.createTokenForTesting({
      weddingId: 'wedding-123',
      householdId: 'household-123',
    })

    await expect(
      service.updateHouseholdDetails('diego-and-laura', token, {
        address1: null,
        address2: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        guests: [
          {
            guestId: 1,
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'shared@example.com',
            phone: null,
          },
          {
            guestId: 2,
            firstName: 'Grace',
            lastName: 'Hopper',
            email: ' Shared@Example.com ',
            phone: null,
          },
        ],
      })
    ).rejects.toHaveProperty('code', 'BAD_REQUEST')
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
