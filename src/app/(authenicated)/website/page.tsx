import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { RsvpToggleCard } from '~/app/_components/website/rsvp-toggle-card'
import { SectionsEditor } from '~/app/_components/website/sections-editor'
import { TemplatePicker } from '~/app/_components/website/template-picker'
import { WebsiteDisabledCallout } from '~/app/_components/website/website-disabled-callout'
import { WebsiteEditor } from '~/app/_components/website/website-editor'
import { WebsiteMediaEditor } from '~/app/_components/website/website-media-editor'
import { WebsitePasswordCard } from '~/app/_components/website/website-password-card'
import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { WebsiteManager } from '~/components/website-manager/website-manager'
import { auth } from '~/lib/auth'
import { computePublicWebsiteUrl } from '~/lib/website/public-url'
import { deriveWeddingSubUrl } from '~/lib/website-slug'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { listTemplateSummaries } from '~/templates/catalog'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Website | Your Wedding Website',
  description: 'Publish and manage your wedding website',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export const dynamic = 'force-dynamic'

export default async function WebsitePage() {
  const [wedding, existingWebsite, session] = await Promise.all([
    getRequiredWedding(),
    api.website.getByUserId(),
    headers().then((requestHeaders) => auth.api.getSession({ headers: requestHeaders })),
  ])
  const isWebsiteBuilderEnabled = wedding.enabledAddOns.includes('website_builder')
  const defaultSubUrl = deriveWeddingSubUrl(wedding)

  const userEmail = session?.user?.email
  if (!userEmail) {
    redirect('/')
  }

  const websiteId = existingWebsite?.id ?? null
  const websiteSubUrl = existingWebsite?.subUrl ?? null

  const [homeSection, sections] =
    isWebsiteBuilderEnabled && websiteId
      ? await Promise.all([api.websiteSection.getHomeSection(), api.websiteSection.getSections()])
      : [null, []]
  const homeContent = homeSection?.type === 'HOME' ? homeSection.content : null
  const introText = homeContent?.introText ?? ''
  const headline = homeContent?.headline ?? ''
  const headlineAccent = homeContent?.headlineAccent ?? ''

  if (!isWebsiteBuilderEnabled) {
    return (
      <>
        <DashboardTopbar title='Website' showManagementActions={false} />
        <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
          <div className='mx-auto max-w-2xl'>
            <WebsiteDisabledCallout />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardTopbar title='Website' showManagementActions={false} />
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mx-auto max-w-2xl space-y-6'>
          <div className='mb-2'>
            <h2 className='font-serif text-foreground text-xl'>Wedding Website</h2>
            <p className='mt-1 font-mono text-[0.62rem] text-foreground/55 tracking-wider'>
              Publish your public wedding page and share it with guests.
            </p>
          </div>
          <WebsiteManager
            initialWebsite={existingWebsite}
            userEmail={userEmail}
            defaultSubUrl={defaultSubUrl}
          />
          {websiteId && websiteSubUrl ? (
            <>
              <WebsitePasswordCard
                initialIsPasswordEnabled={existingWebsite?.isPasswordEnabled ?? false}
              />
              <RsvpToggleCard
                websiteId={websiteId}
                initialIsRsvpEnabled={existingWebsite?.isRsvpEnabled ?? true}
              />
              <TemplatePicker
                templates={listTemplateSummaries()}
                currentTemplateId={existingWebsite?.templateId ?? null}
              />
              <WebsiteEditor
                initialIntroText={introText}
                initialHeadline={headline}
                initialHeadlineAccent={headlineAccent}
                publicUrl={computePublicWebsiteUrl(websiteSubUrl)}
              />
              <WebsiteMediaEditor
                initialHeaderImageUrl={existingWebsite?.headerImageUrl ?? null}
                initialCoupleImageUrls={existingWebsite?.coupleImageUrls ?? []}
              />
              <SectionsEditor initialSections={sections} />
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
