import type { Metadata } from 'next'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import InboxView from '~/components/inbox/inbox-view'

export const metadata: Metadata = {
  title: 'Inbox | Your Wedding Website',
  description: 'View and manage your email communications',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function InboxPage() {
  return (
    <>
      <DashboardTopbar title='Inbox' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto'>
        <InboxView />
      </main>
    </>
  )
}
