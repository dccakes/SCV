import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import { WebsiteDisabledCallout } from '~/app/_components/website/website-disabled-callout'
import { WebsiteEditor } from '~/app/_components/website/website-editor'
import { computePublicWebsiteUrl } from '~/lib/website/public-url'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const dynamic = 'force-dynamic'

export default async function WebsitePage() {
  const wedding = await getRequiredWedding()
  const isWebsiteBuilderEnabled = wedding.enabledAddOns.includes('website_builder')

  const existingWebsite = await api.website.getByUserId()
  let websiteId = existingWebsite?.id ?? null
  let websiteSubUrl = existingWebsite?.subUrl ?? null

  if (isWebsiteBuilderEnabled && !websiteId) {
    const createdWebsite = await api.website.create({})

    websiteId = createdWebsite.id
    websiteSubUrl = createdWebsite.subUrl
  }

  const homeSection =
    isWebsiteBuilderEnabled && websiteId ? await api.websiteSection.getHomeSection() : null

  return (
    <>
      <DashboardTopbar title='Wedding Website' showManagementActions={false} />
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-5xl'>
          {isWebsiteBuilderEnabled && websiteId && websiteSubUrl ? (
            <WebsiteEditor
              initialIntroText={homeSection?.content.introText ?? ''}
              publicUrl={computePublicWebsiteUrl(websiteSubUrl)}
              websiteId={websiteId}
            />
          ) : (
            <WebsiteDisabledCallout />
          )}
        </div>
      </div>
    </>
  )
}
