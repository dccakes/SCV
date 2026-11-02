import { AuthView } from '@daveyplate/better-auth-ui'
import { redirect } from 'next/navigation'

import { areSignupsAllowed } from '~/lib/signups'

type SearchParamValue = string | string[] | undefined

const SIGNUPS_CLOSED_NOTICE = 'signups-closed'

// Keep where the visitor was heading (e.g. an invitation) when sign up is closed.
const HANDOFF_PARAMS = ['redirectTo', 'callbackUrl'] as const

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string }>
  searchParams?: Promise<Record<string, SearchParamValue>>
}) {
  const { path } = await params
  const resolvedSearchParams = (await searchParams) ?? {}

  if (path === 'sign-up' && !areSignupsAllowed()) {
    const next = new URLSearchParams({ notice: SIGNUPS_CLOSED_NOTICE })
    for (const key of HANDOFF_PARAMS) {
      const value = resolvedSearchParams[key]
      const first = Array.isArray(value) ? value[0] : value
      if (first) next.set(key, first)
    }
    redirect(`/auth/sign-in?${next.toString()}`)
  }

  const isSignInPath = path === 'sign-in'
  const showDemoAccounts = process.env.NODE_ENV !== 'production'
  const showSignupsClosedNotice =
    isSignInPath && resolvedSearchParams.notice === SIGNUPS_CLOSED_NOTICE

  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
      <div className='w-full max-w-md space-y-4'>
        {showSignupsClosedNotice ? (
          <p
            role='status'
            // max-w-sm matches the width of the AuthView card below it, which is left-aligned.
            className='w-full max-w-sm rounded-2xl border border-border bg-card p-4 text-card-foreground text-sm shadow-sm'
          >
            New accounts are not being accepted right now. If you already have an account, sign in
            below.
          </p>
        ) : null}

        <AuthView path={path} />

        {isSignInPath && showDemoAccounts ? (
          <section className='rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm'>
            <h2 className='font-medium text-sm'>Demo Accounts</h2>
            <p className='mt-1 text-muted-foreground text-xs'>
              Try the seeded wedding demo data with one of these accounts.
            </p>
            <ul className='mt-2 list-disc space-y-1 pl-5 text-xs'>
              <li>
                <span className='font-medium'>shrek@swamp.wed</span>
              </li>
              <li>
                <span className='font-medium'>fiona@swamp.wed</span>
              </li>
              <li>
                <span className='font-medium'>queen.lillian@swamp.wed</span>
              </li>
            </ul>
            <p className='mt-2 text-xs'>Password: password123</p>
          </section>
        ) : null}
      </div>
    </main>
  )
}
