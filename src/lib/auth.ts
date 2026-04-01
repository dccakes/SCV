// better-auth 1.5.6: OrganizationPlugin / StrictEndpoint no longer structurally satisfies
// BetterAuthPlugin due to a Zod 4 migration type regression. The cast is safe —
// plugins satisfy the interface at runtime. Track: https://github.com/better-auth/better-auth/issues/5637
import { type BetterAuthPlugin, betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { emailOTP, organization } from 'better-auth/plugins'

import { env } from '~/env'
import { ac, organizationRoles } from '~/lib/auth-permissions'
import { sendOtpEmail, sendResetPasswordEmail } from '~/lib/email'
import { db } from '~/server/db'

export const authOrganizationRoles = organizationRoles

export const authPlugins: BetterAuthPlugin[] = [
  organization({
    ac,
    roles: authOrganizationRoles,
  }) as unknown as BetterAuthPlugin,
  nextCookies(),
]

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${env.PORT ?? '3000'}`,
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
