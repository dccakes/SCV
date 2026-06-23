import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { WebsiteManager } from '~/components/website-manager/website-manager'
import { auth } from '~/lib/auth'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Website | Your Wedding Website',
  description: 'Publish and manage your wedding website',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export const dynamic = 'force-dynamic'

export default async function WebsitePage() {
  await getRequiredWedding()

  const session = await auth.api.getSession({ headers: await headers() })
  const userEmail = session?.user?.email
  if (!userEmail) {
    redirect('/')
  }

  let website: Awaited<ReturnType<typeof api.website.getByUserId>> = null
  try {
    website = await api.website.getByUserId()
  } catch {
    redirect('/')
  }

  return (
    <>
      <DashboardTopbar title='Website' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl'>
          <div className='mb-6'>
            <h2 className='font-serif text-foreground text-xl'>Wedding Website</h2>
            <p className='mt-1 font-mono text-[0.62rem] text-foreground/55 tracking-wider'>
              Publish your public wedding page and share it with guests.
            </p>
          </div>
          <WebsiteManager initialWebsite={website} userEmail={userEmail} />
        </div>
      </main>
    </>
  )
}
