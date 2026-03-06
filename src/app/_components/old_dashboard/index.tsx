'use client'

import { useEffect, useState } from 'react'

import DashboardHeader from '@/app/_components/old_dashboard/header'
import PageSectionsTemplate from '@/app/_components/old_dashboard/page-section-template'
import RegistrySetup from '@/app/_components/old_dashboard/registry-setup'
import HomeContent from '@/app/_components/old_dashboard/section-content/home'
import RsvpContent from '@/app/_components/old_dashboard/section-content/rsvp'
import SidebarPanel from '@/app/_components/old_dashboard/sidebar-panel'
import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import PlanningOverview from '@/components/dashboard/planning-overview'
import { useAuthenticatedSidebar } from '@/components/layout/authenticated-app-shell'
import { useEditRsvpSettingsForm } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import { useEventForm } from '~/app/_components/contexts/event-form-context'
import DashboardSettingsForm from '~/app/_components/forms/dashboard-settings-form'
import EventForm from '~/app/_components/forms/event-form'
import EditRsvpSettingsForm from '~/app/_components/forms/rsvp/edit-rsvp-settings'
import RsvpFormSettings from '~/app/_components/forms/rsvp-form-settings'
import type { DashboardData, EventFormData } from '~/app/utils/shared-types'

export default function Dashboard({
  dashboardData,
  uploadImage,
  deleteImage,
}: {
  dashboardData: DashboardData
  uploadImage: (formData: FormData) => Promise<{ ok: boolean }>
  deleteImage: (imageKey: string) => Promise<{ ok: boolean }>
}) {
  const { openSidebar } = useAuthenticatedSidebar()
  const isEventFormOpen = useEventForm()
  const showEditRsvpSettings = useEditRsvpSettingsForm()
  // SSR-safe: start true, sync from localStorage after mount
  const [showRegistrySetup, setShowRegistrySetup] = useState(true)
  const [prefillEvent, setPrefillEvent] = useState<EventFormData | undefined>()
  const [collapseSections, _setCollapseSections] = useState<boolean>(false)
  const [showRsvpSettings, setShowRsvpSettings] = useState<boolean>(false)
  const [showWebsiteSettings, setShowWebsiteSettings] = useState<boolean>(false)

  useEffect(() => {
    setShowRegistrySetup(localStorage.getItem('registrySectionStatus') !== 'hidden')
  }, [])

  const events = dashboardData?.events ?? []

  if (showRsvpSettings) {
    return (
      <RsvpFormSettings dashboardData={dashboardData} setShowRsvpSettings={setShowRsvpSettings} />
    )
  }

  return (
    <>
      {/* Overlaid modals */}
      {isEventFormOpen && <EventForm prefillFormData={prefillEvent} />}
      {showWebsiteSettings && (
        <DashboardSettingsForm
          setShowWebsiteSettings={setShowWebsiteSettings}
          website={dashboardData?.weddingData?.website}
        />
      )}
      {showEditRsvpSettings && (
        <EditRsvpSettingsForm website={dashboardData?.weddingData?.website} />
      )}

      {/* Top bar */}
      <DashboardTopbar onMenuToggle={openSidebar} />

      {/* Scrollable main content */}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        {/* Planning overview hub */}
        <PlanningOverview dashboardData={dashboardData} />

        {/* Website editor — anchored for sidebar "Website" link */}
        <div id='website-editor' className='mt-8 border-border border-t pt-8'>
          <h2 className='mb-5 font-semibold font-serif text-foreground text-xl'>Website Editor</h2>
          <DashboardHeader
            websiteUrl={dashboardData?.weddingData?.website?.url}
            setShowWebsiteSettings={setShowWebsiteSettings}
          />
          <div className='border-border border-t' />
          {showRegistrySetup && <RegistrySetup setShowRegistrySetup={setShowRegistrySetup} />}
          <div className='border-border border-t' />
          <div className='mt-8'>
            <PageSectionsTemplate title={'Home'} collapse={collapseSections}>
              <HomeContent
                dashboardData={dashboardData}
                events={events}
                setPrefillEvent={setPrefillEvent}
                uploadImage={uploadImage}
                deleteImage={deleteImage}
              />
            </PageSectionsTemplate>
            <PageSectionsTemplate title={'Our Story'} collapse={collapseSections} />
            <PageSectionsTemplate title={'Wedding Party'} collapse={collapseSections} />
            <PageSectionsTemplate title={'Photos'} collapse={collapseSections} />
            <PageSectionsTemplate title={'Q + A'} collapse={collapseSections} />
            <PageSectionsTemplate title={'Travel'} collapse={collapseSections} />
            <PageSectionsTemplate title={'Things to Do'} collapse={collapseSections} />
            <PageSectionsTemplate
              title={'RSVP'}
              collapse={collapseSections}
              setShowRsvpSettings={setShowRsvpSettings}
            >
              <RsvpContent
                events={dashboardData?.events}
                totalGuests={dashboardData?.totalGuests ?? 0}
                generalQuestions={dashboardData?.weddingData.website?.generalQuestions ?? []}
              />
            </PageSectionsTemplate>
            <SidebarPanel setShowWebsiteSettings={setShowWebsiteSettings} />
          </div>
        </div>
      </div>
    </>
  )
}
