import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { organization } from 'better-auth/plugins'

import { env } from '~/env'
import { ac, organizationRoles } from '~/lib/auth-permissions'
import { db } from '~/server/db'

export const authOrganizationRoles = organizationRoles

export const authPlugins = [
  organization({
    ac,
    roles: authOrganizationRoles,
  }),
  nextCookies(),
]

export const auth = betterAuth({
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
  plugins: authPlugins,
})

export type Session = typeof auth.$Infer.Session
