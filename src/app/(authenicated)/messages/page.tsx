import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import { GuestMessagingPanel } from '~/components/messaging/guest-messaging-panel'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  await getRequiredWedding()

  return (
    <>
      <DashboardTopbar title='Guest Messages' showManagementActions={false} />
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-4xl'>
          <div className='mb-6'>
            <h2 className='font-serif text-foreground text-xl'>WhatsApp Concierge</h2>
            <p className='mt-1 font-mono text-[0.62rem] text-foreground/55 tracking-wider'>
              Guests text your wedding&apos;s number to reach Etta. Send updates to every household
              or chat with one at a time.
            </p>
          </div>
          <GuestMessagingPanel />
        </div>
      </div>
    </>
  )
}
