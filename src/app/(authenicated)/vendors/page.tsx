import { redirect } from 'next/navigation'

import VendorList from '~/app/_components/vendor'
import { sharedStyles } from '~/app/utils/shared-styles'
import { api } from '~/trpc/server'

export const metadata = {
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
    <main className={`${sharedStyles.desktopPaddingSidesGuestList} py-8`}>
      <VendorList initialVendors={vendors} />
    </main>
  )
}
