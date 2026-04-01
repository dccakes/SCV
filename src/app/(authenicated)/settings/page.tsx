import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import WeddingSettingsForm from '~/components/forms/wedding-settings-form'
import { api } from '~/trpc/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let details: Awaited<ReturnType<typeof api.wedding.getDetails>> | null = null

  try {
    details = await api.wedding.getDetails()
  } catch {
    details = null
  }

  return (
    <>
      <DashboardTopbar title='Settings' showManagementActions={false} />
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl'>
          <div className='mb-6'>
            <h2 className='font-serif text-foreground text-xl'>Wedding Details</h2>
            <p className='mt-1 font-mono text-[0.62rem] text-foreground/55 tracking-wider'>
              Update your names. Ceremony date and location are managed from Events.
            </p>
          </div>
          {details ? (
            <WeddingSettingsForm
              initialData={{
                groomFirstName: details.groomFirstName,
                groomLastName: details.groomLastName,
                brideFirstName: details.brideFirstName,
                brideLastName: details.brideLastName,
                weddingDate: details.weddingDate,
                weddingLocation: details.weddingLocation,
                primaryEventId: details.primaryEventId,
              }}
            />
          ) : (
            <p className='text-foreground/60'>
              No wedding found. Please complete onboarding first.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
