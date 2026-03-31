import type { Metadata } from 'next'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import ConnectionsTab from '~/components/settings/connections-tab'

export const metadata: Metadata = {
  title: 'Settings | Your Wedding Website',
  description: 'Manage your account settings and connections',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function SettingsPage() {
  return (
    <>
      <DashboardTopbar title='Settings' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mb-6'>
          <div className='flex gap-1 border-border/80 border-b'>
            <button
              type='button'
              className='border-foreground border-b-2 px-4 py-2 font-mono text-xs text-foreground uppercase tracking-wider'
            >
              Connections
            </button>
          </div>
        </div>
        <ConnectionsTab />
      </main>
    </>
  )
}
