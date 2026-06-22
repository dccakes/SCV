import {
  createHouseholdInviteToken,
  verifyHouseholdInviteToken,
} from '~/server/application/household-invite/household-invite-token'

describe('household invite token', () => {
  const originalBetterAuthSecret = process.env.BETTER_AUTH_SECRET
  const originalNextAuthSecret = process.env.NEXTAUTH_SECRET

  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-household-invite-tokens'
    jest.useFakeTimers().setSystemTime(new Date('2026-06-18T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    process.env.BETTER_AUTH_SECRET = originalBetterAuthSecret
    process.env.NEXTAUTH_SECRET = originalNextAuthSecret
  })

  it('creates a token that verifies to the household and wedding payload', () => {
    const token = createHouseholdInviteToken({
      weddingId: 'wedding-123',
      householdId: 'household-456',
    })

    expect(verifyHouseholdInviteToken(token)).toEqual({
      weddingId: 'wedding-123',
      householdId: 'household-456',
      expiresAt: new Date('2027-06-18T12:00:00.000Z'),
    })
  })

  it('rejects a tampered token payload', () => {
    const token = createHouseholdInviteToken({
      weddingId: 'wedding-123',
      householdId: 'household-456',
    })
    const [payload, signature] = token.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        purpose: 'household-invite',
        weddingId: 'wedding-999',
        householdId: 'household-456',
        exp: Math.floor(new Date('2027-06-18T12:00:00.000Z').getTime() / 1000),
      })
    ).toString('base64url')

    expect(verifyHouseholdInviteToken(`${tamperedPayload}.${signature}`)).toBeNull()
    expect(payload).toBeDefined()
  })

  it('rejects tokens signed for another purpose', () => {
    const token = createHouseholdInviteToken({
      weddingId: 'wedding-123',
      householdId: 'household-456',
      purpose: 'other-purpose',
    })

    expect(verifyHouseholdInviteToken(token)).toBeNull()
  })

  it('rejects expired tokens', () => {
    const token = createHouseholdInviteToken({
      weddingId: 'wedding-123',
      householdId: 'household-456',
      expiresAt: new Date('2026-06-18T11:59:59.000Z'),
    })

    expect(verifyHouseholdInviteToken(token)).toBeNull()
  })

  it('requires a signing secret when creating tokens', () => {
    delete process.env.BETTER_AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET

    expect(() =>
      createHouseholdInviteToken({
        weddingId: 'wedding-123',
        householdId: 'household-456',
      })
    ).toThrow('BETTER_AUTH_SECRET is required')
  })
})
