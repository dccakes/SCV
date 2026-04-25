import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import VendorList from '~/components/vendor'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Vendors | Your Wedding Website',
  description: 'Manage your wedding vendors',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function VendorsPage() {
  await getRequiredWedding()

  let vendors: Awaited<ReturnType<typeof api.vendor.getAll>>
  let initialSuggestions: Awaited<ReturnType<typeof api.etta.getPendingByDomain>>

  try {
    ;[vendors, initialSuggestions] = await Promise.all([
      api.vendor.getAll({}),
      api.etta.getPendingByDomain({ domain: 'vendors' }),
    ])
  } catch {
    redirect('/')
  }

  if (vendors === null) {
    redirect('/')
  }

  return (
    <>
      <DashboardTopbar title='Vendors' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <VendorList initialSuggestions={initialSuggestions} initialVendors={vendors} />
      </main>
    </>
  )
}
