jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config: unknown) => ({
    config,
    api: {},
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
    BETTER_AUTH_SECRET: 'test-secret',
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

import { auth } from '~/lib/auth'
import { sendOtpEmail } from '~/lib/email'

type AuthConfig = {
  emailAndPassword: { enabled: boolean; requireEmailVerification?: boolean }
  emailVerification?: {
    sendOnSignUp?: boolean
    sendOnSignIn?: boolean
    autoSignInAfterVerification?: boolean
  }
  plugins: Array<{ id: string; options?: unknown }>
}

const config = (auth as unknown as { config: AuthConfig }).config

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
})
