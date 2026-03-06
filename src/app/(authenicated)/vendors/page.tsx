import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import VendorList from '~/app/_components/vendor'
import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Vendors | Your Wedding Website',
  description: 'Manage your wedding vendors',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function VendorsPage() {
  const vendors = await api.vendor.getAll.query({})

  if (vendors === null) {
    redirect('/')
  }

  return (
    <>
      <DashboardTopbar title='Vendors' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <VendorList initialVendors={vendors} />
      </main>
    </>
  )
}
