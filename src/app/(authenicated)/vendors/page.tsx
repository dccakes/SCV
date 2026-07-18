import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { PageContent } from '~/components/layout/page-content'
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

  try {
    vendors = await api.vendor.getAll({})
  } catch {
    redirect('/')
  }

  if (vendors === null) {
    redirect('/')
  }

  return (
    <>
      <DashboardTopbar title='Vendors' showManagementActions={false} />
      <PageContent>
        <VendorList initialVendors={vendors} />
      </PageContent>
    </>
  )
}
