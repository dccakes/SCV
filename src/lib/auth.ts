// better-auth 1.5.6: OrganizationPlugin / StrictEndpoint no longer structurally satisfies
// BetterAuthPlugin due to a Zod 4 migration type regression. The cast is safe —
// plugins satisfy the interface at runtime. Track: https://github.com/better-auth/better-auth/issues/5637
import { type BetterAuthPlugin, betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { emailOTP, organization } from 'better-auth/plugins'

import { env } from '~/env'
import { authOrganizationSchema } from '~/lib/auth-organization-schema'
import { ac, organizationRoles } from '~/lib/auth-permissions'
import { sendOrganizationInvitationEmail, sendOtpEmail, sendResetPasswordEmail } from '~/lib/email'
import { db } from '~/server/db'

export const authOrganizationRoles = organizationRoles

const appBaseUrl = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${env.PORT ?? '3000'}`

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
  trustedOrigins: [
    'https://oswp.carvallo.io',
    'https://scv-teal.vercel.app',
    ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []),
    ...(env.VERCEL_BRANCH_URL ? [`https://${env.VERCEL_BRANCH_URL}`] : []),
    ...(env.NEXT_PUBLIC_APP_URL ? [env.NEXT_PUBLIC_APP_URL] : []),
  ],
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
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
      overrideDefaultEmailVerification: true,
    }) as unknown as BetterAuthPlugin,
  ],
})

export type Session = typeof auth.$Infer.Session
