// better-auth 1.5.6: OrganizationPlugin / StrictEndpoint no longer structurally satisfies
// BetterAuthPlugin due to a Zod 4 migration type regression. The cast is safe —
// plugins satisfy the interface at runtime. Track: https://github.com/better-auth/better-auth/issues/5637
import { createHmac } from 'node:crypto'

import { APIError, type BetterAuthPlugin, betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { emailOTP, organization } from 'better-auth/plugins'

import { env } from '~/env'
import { authOrganizationSchema } from '~/lib/auth-organization-schema'
import { ac, organizationRoles } from '~/lib/auth-permissions'
import { sendOrganizationInvitationEmail, sendOtpEmail, sendResetPasswordEmail } from '~/lib/email'
import { logger } from '~/lib/observability/logger'
import { areSignupsAllowed, SIGNUPS_DISABLED_MESSAGE } from '~/lib/signups'
import { db } from '~/server/db'

export const authOrganizationRoles = organizationRoles

const signupsDisabled = !areSignupsAllowed()

// OTPs are stored hashed. Better Auth's built-in 'hashed' mode is an unsalted SHA-256, and a
// 6-digit code has only 1,000,000 possibilities, so anyone who can read the table could
// reverse it instantly. Keying the hash with the auth secret keeps it one-way and means a
// database-only leak can't be brute-forced. Rotating BETTER_AUTH_SECRET only invalidates
// OTPs that are still within their 10 minute lifetime.
export const hashOtp = async (otp: string): Promise<string> =>
  createHmac('sha256', env.BETTER_AUTH_SECRET).update(otp).digest('base64url')

// The emailOTP plugin is cast to BetterAuthPlugin (see top of file), so its endpoints are not
// part of the inferred `auth.api` type.
type EmailOtpApi = {
  sendVerificationOTP: (input: {
    body: { email: string; type: 'email-verification' }
  }) => Promise<unknown>
}

const appBaseUrl = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${env.PORT ?? '3000'}`
const localTrustedHostnames = new Set(['127.0.0.1', '::1', 'localhost'])
const staticTrustedOrigins = [
  'https://oswp.carvallo.io',
  'https://scv-teal.vercel.app',
  ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []),
  ...(env.VERCEL_BRANCH_URL ? [`https://${env.VERCEL_BRANCH_URL}`] : []),
  new URL(appBaseUrl).origin,
]

export function resolveTrustedOrigins(requestUrl?: string): string[] {
  const origins = new Set(staticTrustedOrigins)

  if (requestUrl) {
    try {
      const requestOrigin = new URL(requestUrl)
      if (localTrustedHostnames.has(requestOrigin.hostname)) {
        origins.add(requestOrigin.origin)
      }
    } catch {
      // Ignore invalid request URLs; static trusted origins remain available.
    }
  }

  return [...origins]
}

const getInvitationAcceptUrl = (invitationId: string): string => {
  const url = new URL('/auth/accept-invitation', appBaseUrl)
  url.searchParams.set('invitationId', invitationId)
  return url.toString()
}

const getRoleLabel = (role: string | string[] | undefined): string => {
  if (Array.isArray(role)) {
    return role.join(', ')
  }

  return role ?? 'member'
}

type OrganizationInvitationEmailPayload = {
  email: string
  id?: string
  role?: string | string[]
  invitation?: {
    id?: string
  }
  organization?: {
    name?: string | null
  }
  inviter?: {
    user?: {
      name?: string | null
      email?: string | null
    }
  }
}

export const authPlugins: BetterAuthPlugin[] = [
  organization({
    ac,
    roles: authOrganizationRoles,
    schema: authOrganizationSchema,
    invitationExpiresIn: 60 * 60 * 24 * 7,
    async sendInvitationEmail(data) {
      const payload = data as OrganizationInvitationEmailPayload
      const invitationId =
        typeof payload.id === 'string'
          ? payload.id
          : typeof payload.invitation?.id === 'string'
            ? payload.invitation.id
            : null

      if (!invitationId) {
        throw new Error('Unable to send organization invitation email without an invitation ID')
      }

      const organizationName =
        typeof payload.organization?.name === 'string' && payload.organization.name.length > 0
          ? payload.organization.name
          : 'your wedding workspace'
      const invitedByName =
        typeof payload.inviter?.user?.name === 'string' && payload.inviter.user.name.length > 0
          ? payload.inviter.user.name
          : typeof payload.inviter?.user?.email === 'string'
            ? payload.inviter.user.email
            : undefined

      await sendOrganizationInvitationEmail({
        to: payload.email,
        inviteUrl: getInvitationAcceptUrl(invitationId),
        organizationName,
        invitedByName,
        memberRole: getRoleLabel(payload.role),
      })
    },
  }) as unknown as BetterAuthPlugin,
  nextCookies(),
]

export const auth = betterAuth({
  baseURL: appBaseUrl,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => resolveTrustedOrigins(request?.url),
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  // ALLOW_SIGNUPS=false: the per-method flags below stop the known entry points early (email
  // OTP reports "invalid code" rather than "closed", so no new information leaks), and the
  // databaseHooks guard is the backstop: every creation path goes through the internal adapter's
  // createUser, so it blocks email, OTP, social and plugin sign ups, including future ones.
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          if (!areSignupsAllowed()) {
            // No email or other PII: this only tells operators attempts are being blocked.
            logger.warn('Blocked sign up because ALLOW_SIGNUPS is false', { component: 'auth' })
            throw new APIError('FORBIDDEN', { message: SIGNUPS_DISABLED_MESSAGE })
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: signupsDisabled,
    // Users must verify their email (via OTP) before a session is created.
    requireEmailVerification: true,
    // Signing up again with an email that is already registered returns the same generic
    // response as a new sign-up, so the form still moves to the OTP step. If that account
    // never verified, send it a fresh OTP so the user is not left waiting for a code.
    // The password submitted here is ignored, so this cannot be used to take over an
    // account. Verified accounts get nothing, which avoids revealing that they exist.
    onExistingUserSignUp: async ({ user }) => {
      if (user.emailVerified) {
        return
      }

      await (auth.api as unknown as EmailOtpApi).sendVerificationOTP({
        body: { email: user.email, type: 'email-verification' },
      })
    },
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string; name?: string | null }
      url: string
    }) => {
      await sendResetPasswordEmail({ to: user.email, url, userName: user.name ?? undefined })
    },
  },
  emailVerification: {
    // Routed through the emailOTP plugin (overrideDefaultEmailVerification).
    // The plugin's own sendVerificationOnSignUp is ignored while that override is on.
    sendOnSignUp: true,
    sendOnSignIn: true,
    // The OTP proves email ownership, so create the session right after it is verified.
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    // Add social providers as needed
    // github: {
    //   clientId: env.GITHUB_CLIENT_ID ?? "",
    //   clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
    // },
    // google: {
    //   clientId: env.GOOGLE_CLIENT_ID ?? "",
    //   clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    // },
  },
  // Persist rate limits in Postgres. The default in-memory store is per serverless instance
  // and resets on cold start, so it can't meaningfully limit OTP sends or guesses on Vercel.
  // Better Auth only enforces rate limits in production by default.
  rateLimit: {
    storage: 'database',
  },
  experimental: {
    joins: true, // Enable joins for 2-3x performance improvement
  },
  plugins: [
    ...authPlugins,
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ to: email, otp, type })
      },
      otpLength: 6,
      expiresIn: 600,
      storeOTP: { hash: hashOtp },
      overrideDefaultEmailVerification: true,
      disableSignUp: signupsDisabled,
    }) as unknown as BetterAuthPlugin,
  ],
})

export type Session = typeof auth.$Infer.Session
