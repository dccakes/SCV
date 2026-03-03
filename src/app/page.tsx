import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'

import AuthenticatedView from '~/app/_components/home/authenticated-view'
import NonAuthenticatedView from '~/app/_components/home/non-authenticated-view'
import { auth } from '~/lib/auth'

export const metadata: Metadata = {
  title: 'OSWP — The Open Source Wedding Platform',
  description:
    'A self-hosted platform with everything your wedding needs — invitations, RSVPs, planning, and Etta, your AI wedding planner.',
}

export default async function Home() {
  noStore()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const isSignedIn = !!session

  return <>{!isSignedIn ? <NonAuthenticatedView /> : <AuthenticatedView />}</>
}
