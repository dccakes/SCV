import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import WeddingSettingsForm from '~/components/forms/wedding-settings-form'
import { OrganizationMembersSettingsCard } from '~/components/settings/organization-members-settings-card'
import { OrganizationOutstandingInvitesCard } from '~/components/settings/organization-outstanding-invites-card'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  await getRequiredWedding()

  let details: Awaited<ReturnType<typeof api.wedding.getDetails>> | null = null
  let weddingDetailsLoadFailed = false

  try {
    details = await api.wedding.getDetails()
  } catch {
    weddingDetailsLoadFailed = true
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
          <div className='space-y-6'>
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
            ) : weddingDetailsLoadFailed ? (
              <p className='text-foreground/60'>
                Unable to load wedding details for the active workspace.
              </p>
            ) : (
              <p className='text-foreground/60'>
                No wedding found. Please complete onboarding first.
              </p>
            )}
            <div className='space-y-3'>
              <div>
                <h3 className='font-serif text-foreground text-xl'>Organization Members</h3>
                <p className='mt-1 font-mono text-[0.62rem] text-foreground/55 tracking-wider'>
                  Invite collaborators and manage access to this workspace.
                </p>
              </div>
              <OrganizationMembersSettingsCard />
              <OrganizationOutstandingInvitesCard />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
