/** @jest-environment node */

// Mirrors the mocking approach in auth-permissions.test.ts: better-auth is ESM-only, so we
// capture the config passed to betterAuth() and assert on it directly.
jest.mock('better-auth/plugins/access', () => ({
  createAccessControl: () => ({ newRole: () => ({}) }),
}))
jest.mock('better-auth', () => ({
  APIError: class APIError extends Error {
    constructor(
      public status: string,
      body: { message: string }
    ) {
      super(body.message)
    }
  },
  betterAuth: jest.fn((config: unknown) => ({ config, api: {}, $Infer: { Session: {} } })),
}))
jest.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: jest.fn(() => ({})) }))
jest.mock('better-auth/next-js', () => ({ nextCookies: jest.fn(() => ({})) }))
jest.mock('better-auth/plugins', () => ({
  emailOTP: jest.fn((options: unknown) => ({ id: 'email-otp', options })),
  organization: jest.fn(() => ({ id: 'organization' })),
}))
jest.mock('~/env', () => ({
  env: {
    BETTER_AUTH_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    get ALLOW_SIGNUPS() {
      return process.env.ALLOW_SIGNUPS
    },
  },
}))
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/lib/observability/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}))
jest.mock('~/lib/email', () => ({
  sendOrganizationInvitationEmail: jest.fn(),
  sendOtpEmail: jest.fn(),
  sendResetPasswordEmail: jest.fn(),
}))

type AuthConfig = {
  emailAndPassword: { disableSignUp: boolean }
  databaseHooks: { user: { create: { before: (user: unknown) => Promise<unknown> } } }
  plugins: { id?: string; options?: { disableSignUp?: boolean } }[]
}

async function loadConfig(allowSignups: string | undefined): Promise<AuthConfig> {
  jest.resetModules()
  if (allowSignups === undefined) {
    delete process.env.ALLOW_SIGNUPS
  } else {
    process.env.ALLOW_SIGNUPS = allowSignups
  }
  const { auth } = await import('~/lib/auth')
  return (auth as unknown as { config: AuthConfig }).config
}

const originalAllowSignups = process.env.ALLOW_SIGNUPS

afterEach(() => {
  if (originalAllowSignups === undefined) delete process.env.ALLOW_SIGNUPS
  else process.env.ALLOW_SIGNUPS = originalAllowSignups
  jest.resetModules()
})

describe('auth with ALLOW_SIGNUPS=false', () => {
  it('disables every known sign up entry point', async () => {
    const config = await loadConfig('false')
    const otp = config.plugins.find((plugin) => plugin.id === 'email-otp')

    expect(config.emailAndPassword.disableSignUp).toBe(true)
    expect(otp?.options?.disableSignUp).toBe(true)
  })

  it('rejects user creation from any path with a 403-style error', async () => {
    const config = await loadConfig('false')

    await expect(
      config.databaseHooks.user.create.before({ email: 'new@example.com' })
    ).rejects.toMatchObject({ status: 'FORBIDDEN', message: 'Sign ups are currently closed.' })
  })
})

describe('blocked sign up logging', () => {
  it('warns operators without logging any email address', async () => {
    const config = await loadConfig('false')
    const { logger } = await import('~/lib/observability/logger')

    await config.databaseHooks.user.create.before({ email: 'new@example.com' }).catch(() => {})

    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(JSON.stringify((logger.warn as jest.Mock).mock.calls)).not.toContain('new@example.com')
  })
})

describe('auth with ALLOW_SIGNUPS unset or "true"', () => {
  it.each([undefined, 'true'])('keeps sign up open when the flag is %s', async (value) => {
    const config = await loadConfig(value)
    const otp = config.plugins.find((plugin) => plugin.id === 'email-otp')

    expect(config.emailAndPassword.disableSignUp).toBe(false)
    expect(otp?.options?.disableSignUp).toBe(false)
    await expect(
      config.databaseHooks.user.create.before({ email: 'new@example.com' })
    ).resolves.toBeUndefined()
  })
})
