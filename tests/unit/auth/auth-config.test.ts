jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config: unknown) => ({
    config,
    api: { sendVerificationOTP: jest.fn() },
    $Infer: { Session: {} },
  })),
}))

jest.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: jest.fn(() => ({})),
}))

jest.mock('better-auth/next-js', () => ({
  nextCookies: jest.fn(() => ({ id: 'next-cookies-plugin' })),
}))

jest.mock('better-auth/plugins/access', () => ({
  createAccessControl: () => ({ statements: {}, newRole: () => ({}) }),
}))

jest.mock('better-auth/plugins', () => ({
  emailOTP: jest.fn((options: unknown) => ({ id: 'email-otp-plugin', options })),
  organization: jest.fn((options: unknown) => ({ id: 'organization-plugin', options })),
}))

jest.mock('~/env', () => ({
  env: {
    BETTER_AUTH_SECRET: 'test-secret-for-otp-hashing',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    VERCEL_URL: undefined,
    VERCEL_BRANCH_URL: undefined,
  },
}))

jest.mock('~/server/db', () => ({ db: {} }))

jest.mock('~/lib/email', () => ({
  sendOrganizationInvitationEmail: jest.fn(),
  sendOtpEmail: jest.fn(),
  sendResetPasswordEmail: jest.fn(),
}))

import { auth, hashOtp } from '~/lib/auth'
import { sendOtpEmail } from '~/lib/email'

type AuthConfig = {
  emailAndPassword: {
    enabled: boolean
    requireEmailVerification?: boolean
    onExistingUserSignUp?: (data: {
      user: { email: string; emailVerified: boolean }
    }) => Promise<void>
  }
  rateLimit?: { storage?: string }
  emailVerification?: {
    sendOnSignUp?: boolean
    sendOnSignIn?: boolean
    autoSignInAfterVerification?: boolean
  }
  plugins: Array<{ id: string; options?: unknown }>
}

const { config, api } = auth as unknown as {
  config: AuthConfig
  api: { sendVerificationOTP: jest.Mock }
}

describe('auth email verification config', () => {
  it('requires a verified email before a session is created', () => {
    expect(config.emailAndPassword.enabled).toBe(true)
    expect(config.emailAndPassword.requireEmailVerification).toBe(true)
  })

  it('sends the OTP on sign-up and on unverified sign-in, then signs the user in', () => {
    expect(config.emailVerification).toEqual({
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
    })
  })

  it('routes core verification emails through the OTP plugin', async () => {
    const options = config.plugins.find((plugin) => plugin.id === 'email-otp-plugin')?.options as {
      overrideDefaultEmailVerification: boolean
      sendVerificationOTP: (data: { email: string; otp: string; type: string }) => Promise<void>
    }

    expect(options.overrideDefaultEmailVerification).toBe(true)

    await options.sendVerificationOTP({
      email: 'new@example.com',
      otp: '123456',
      type: 'email-verification',
    })
    expect(sendOtpEmail).toHaveBeenCalledWith({
      to: 'new@example.com',
      otp: '123456',
      type: 'email-verification',
    })
  })

  it('stores OTPs as a keyed hash, never the plain code', async () => {
    const options = config.plugins.find((plugin) => plugin.id === 'email-otp-plugin')?.options as {
      storeOTP: { hash: (otp: string) => Promise<string> }
    }

    expect(options.storeOTP.hash).toBe(hashOtp)

    const hash = await hashOtp('123456')
    expect(hash).not.toContain('123456')
    expect(await hashOtp('123456')).toBe(hash)
    expect(await hashOtp('654321')).not.toBe(hash)
  })

  it('persists rate limits in the database', () => {
    expect(config.rateLimit?.storage).toBe('database')
  })

  describe('sign-up with an existing email', () => {
    const onExistingUserSignUp = () => {
      const handler = config.emailAndPassword.onExistingUserSignUp
      if (!handler) {
        throw new Error('onExistingUserSignUp is not configured')
      }
      return handler
    }

    it('sends a fresh OTP when the existing account is unverified', async () => {
      await onExistingUserSignUp()({ user: { email: 'pending@example.com', emailVerified: false } })

      expect(api.sendVerificationOTP).toHaveBeenCalledWith({
        body: { email: 'pending@example.com', type: 'email-verification' },
      })
    })

    it('sends nothing when the existing account is already verified', async () => {
      await onExistingUserSignUp()({ user: { email: 'done@example.com', emailVerified: true } })

      expect(api.sendVerificationOTP).not.toHaveBeenCalled()
    })
  })
})
