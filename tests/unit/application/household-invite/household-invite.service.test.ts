jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

const mockCaptureServerEvent = jest.fn()
jest.mock('~/server/infrastructure/analytics/capture', () => ({
  captureServerEvent: (...args: unknown[]) => mockCaptureServerEvent(...args),
}))

import { HouseholdInviteService } from '~/server/application/household-invite/household-invite.service'

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
      update: jest.fn().mockResolvedValue({}),
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

const INVITE_CODE = 'al-4f9k2c'
const INVITE_CODE_EXPIRES_AT = new Date('2027-06-18T12:00:00.000Z')

const inviteHousehold = {
  id: 'household-123',
  weddingId: 'wedding-123',
  inviteCode: INVITE_CODE,
  inviteCodeExpiresAt: INVITE_CODE_EXPIRES_AT,
  address1: null,
  address2: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  wedding: {
    groomFirstName: 'Harry',
    groomLastName: 'Potter',
    brideFirstName: 'Hermione',
    brideLastName: 'Granger',
    events: [{ date: new Date('2027-05-30T12:00:00.000Z'), venue: 'Hogsmeade, Scotland' }],
  },
  guests: [
    {
      id: 1,
      firstName: 'Ron',
      lastName: 'Weasley',
      email: 'ron@example.com',
      phone: null,
      isTagAlong: false,
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
    db.household.findFirst.mockResolvedValue({
      id: 'household-123',
      weddingId: 'wedding-123',
      guests: [{ firstName: 'Ada', lastName: 'Lovelace' }],
    })
    db.website.findFirst.mockResolvedValue({ subUrl: 'harry-and-hermione' })
    const service = new HouseholdInviteService(db as never)

    const result = await service.generateInviteLink(authz, 'wedding-123', {
      householdId: 'household-123',
      baseUrl: 'https://example.com/dashboard',
    })

    expect(result.url).toMatch(
      /^https:\/\/example\.com\/w\/harry-and-hermione\/save-the-date\/al-[a-z0-9]+$/
    )
    expect(result.expiresAt).toEqual(new Date('2027-06-18T12:00:00.000Z'))
    expect(db.household.findFirst).toHaveBeenCalledWith({
      where: { id: 'household-123', weddingId: 'wedding-123' },
      select: {
        id: true,
        weddingId: true,
        guests: {
          orderBy: { id: 'asc' },
          take: 1,
          select: { firstName: true, lastName: true },
        },
      },
    })
    expect(db.household.update).toHaveBeenCalledWith({
      where: { id: 'household-123' },
      data: {
        inviteCode: expect.stringMatching(/^al-[a-z0-9]+$/),
        inviteCodeExpiresAt: new Date('2027-06-18T12:00:00.000Z'),
      },
    })
  })

  it('returns public couple names, date, and venue for a website slug without a code', async () => {
    const weddingDate = new Date('2027-05-30T12:00:00.000Z')
    const db = createDb()
    db.website.findFirst.mockResolvedValue({
      wedding: {
        groomFirstName: 'Diego',
        brideFirstName: 'Laura',
        events: [{ date: weddingDate, venue: 'Puebla, Mexico' }],
      },
    })
    const service = new HouseholdInviteService(db as never)

    await expect(service.getPublicWeddingSummary('harry-and-hermione')).resolves.toEqual({
      groomFirstName: 'Diego',
      brideFirstName: 'Laura',
      date: weddingDate,
      venue: 'Puebla, Mexico',
    })
    expect(db.website.findFirst).toHaveBeenCalledWith({
      where: { subUrl: 'harry-and-hermione' },
      select: {
        wedding: {
          select: {
            groomFirstName: true,
            brideFirstName: true,
            events: {
              where: { name: 'Wedding Day' },
              orderBy: { date: 'asc' },
              take: 1,
              select: { date: true, venue: true },
            },
          },
        },
      },
    })
  })

  it('falls back to null date and venue when the wedding has no Wedding Day event', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({
      wedding: { groomFirstName: 'Diego', brideFirstName: 'Laura', events: [] },
    })
    const service = new HouseholdInviteService(db as never)

    await expect(service.getPublicWeddingSummary('harry-and-hermione')).resolves.toEqual({
      groomFirstName: 'Diego',
      brideFirstName: 'Laura',
      date: null,
      venue: null,
    })
  })

  it('returns null public summary when no website matches the slug', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue(null)
    const service = new HouseholdInviteService(db as never)

    await expect(service.getPublicWeddingSummary('unknown-slug')).resolves.toBeNull()
  })

  it('returns the website template and enabled Save the Date copy with the invite data', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({
      weddingId: 'wedding-123',
      templateId: 'aurelia',
      websiteSections: [
        {
          isEnabled: true,
          content: { eyebrow: "You're Invited", message: 'Join us in Puebla.' },
        },
      ],
    })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const code = INVITE_CODE

    const inviteData = await service.getInviteData('harry-and-hermione', code)

    expect(inviteData?.templateId).toBe('aurelia')
    expect(inviteData?.saveTheDate).toEqual({
      eyebrow: "You're Invited",
      message: 'Join us in Puebla.',
    })
  })

  it('ignores Save the Date copy that is present but disabled', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({
      weddingId: 'wedding-123',
      templateId: null,
      websiteSections: [{ isEnabled: false, content: { eyebrow: 'Hidden' } }],
    })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const code = INVITE_CODE

    const inviteData = await service.getInviteData('harry-and-hermione', code)

    expect(inviteData?.templateId).toBeNull()
    expect(inviteData?.saveTheDate).toBeUndefined()
  })

  it('surfaces which household guests are tag-alongs', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123', templateId: null })
    db.household.findFirst.mockResolvedValue({
      ...inviteHousehold,
      guests: [
        ...inviteHousehold.guests,
        {
          id: 2,
          firstName: 'Grace',
          lastName: 'Hopper',
          email: null,
          phone: null,
          isTagAlong: true,
        },
      ],
    })
    const service = new HouseholdInviteService(db as never)

    const inviteData = await service.getInviteData('harry-and-hermione', INVITE_CODE)

    expect(inviteData?.guests).toEqual([
      expect.objectContaining({ firstName: 'Ron', isTagAlong: false }),
      expect.objectContaining({ firstName: 'Grace', isTagAlong: true }),
    ])
  })

  it('returns null when the invite code household is scoped to a different wedding', async () => {
    const db = createDb()
    db.household.findFirst.mockResolvedValue({
      id: 'household-123',
      weddingId: 'wedding-123',
      inviteCodeExpiresAt: INVITE_CODE_EXPIRES_AT,
    })
    db.website.findFirst.mockResolvedValue({ weddingId: 'different-wedding' })
    const service = new HouseholdInviteService(db as never)

    await expect(service.getInviteData('harry-and-hermione', INVITE_CODE)).resolves.toBeNull()
    expect(db.household.findFirst).toHaveBeenCalledTimes(1)
    expect(db.household.findFirst).toHaveBeenCalledWith({
      where: { inviteCode: INVITE_CODE },
      select: { id: true, weddingId: true, inviteCodeExpiresAt: true },
    })
  })

  it('returns null for an unknown or expired invite code', async () => {
    const db = createDb()
    const service = new HouseholdInviteService(db as never)

    db.household.findFirst.mockResolvedValueOnce(null)
    await expect(service.getInviteData('harry-and-hermione', 'no-such-code')).resolves.toBeNull()

    db.household.findFirst.mockResolvedValueOnce({
      id: 'household-123',
      weddingId: 'wedding-123',
      inviteCodeExpiresAt: new Date('2026-06-18T11:59:59.000Z'),
    })
    await expect(service.getInviteData('harry-and-hermione', INVITE_CODE)).resolves.toBeNull()

    expect(db.website.findFirst).not.toHaveBeenCalled()
  })

  it('returns null when no code is supplied', async () => {
    const db = createDb()
    const service = new HouseholdInviteService(db as never)

    await expect(service.getInviteData('harry-and-hermione', undefined)).resolves.toBeNull()
    expect(db.household.findFirst).not.toHaveBeenCalled()
  })

  it('rejects updates that include a guest outside the invite code household', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const code = INVITE_CODE

    await expect(
      service.updateHouseholdDetails('harry-and-hermione', code, {
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
    const code = INVITE_CODE

    await expect(
      service.updateHouseholdDetails('harry-and-hermione', code, {
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

  it('captures an analytics event with the submitted household + guest responses', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const code = INVITE_CODE

    mockCaptureServerEvent.mockClear()

    await service.updateHouseholdDetails('harry-and-hermione', code, {
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

    expect(mockCaptureServerEvent).toHaveBeenCalledTimes(1)
    const call = mockCaptureServerEvent.mock.calls[0][0]
    expect(call.event).toBe('guest_list.household_details.updated')
    expect(call.context).toMatchObject({
      weddingId: 'wedding-123',
      householdId: 'household-123',
      subUrl: 'harry-and-hermione',
      token: code,
    })
    // The normalized (trimmed/lowercased) guest responses actually submitted
    // must be present on the event, not just a count.
    expect(call.properties.payload).toEqual({
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
          phone: '+1 555 0100',
        },
      ],
    })
  })

  it('rejects malformed guest IDs before opening a transaction', async () => {
    const db = createDb()
    db.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123' })
    db.household.findFirst.mockResolvedValue(inviteHousehold)
    const service = new HouseholdInviteService(db as never)
    const code = INVITE_CODE

    await expect(
      service.updateHouseholdDetails('harry-and-hermione', code, {
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
    const code = INVITE_CODE

    await expect(
      service.updateHouseholdDetails('harry-and-hermione', code, {
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
