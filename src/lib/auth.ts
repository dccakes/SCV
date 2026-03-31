import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { emailOTP } from 'better-auth/plugins'

import { env } from '~/env'
import { sendOtpEmail } from '~/lib/email'
import { db } from '~/server/db'

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
    nextCookies(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ to: email, otp, type })
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
