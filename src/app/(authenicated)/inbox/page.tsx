import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { InboxView } from '~/components/inbox/inbox-view'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Inbox | Your Wedding Website',
  description: 'Vendor and guest email, triaged by Etta',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function InboxPage() {
  await getRequiredWedding()

  let inbox: Awaited<ReturnType<typeof api.email.getInbox>>
  let threads: Awaited<ReturnType<typeof api.email.listThreads>>

  try {
    ;[inbox, threads] = await Promise.all([api.email.getInbox(), api.email.listThreads()])
  } catch {
    redirect('/')
  }

  return (
    <>
      <DashboardTopbar title='Inbox' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-hidden'>
        <InboxView initialInbox={inbox} initialThreads={threads} />
      </main>
    </>
  )
}
