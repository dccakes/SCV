'use client'

import { useState } from 'react'

import { useEditRsvpSettingsForm } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import { useEventForm } from '~/app/_components/contexts/event-form-context'
import DashboardControls from '~/app/_components/dashboard/controls'
import DashboardHeader from '~/app/_components/dashboard/header'
import PageSectionsTemplate from '~/app/_components/dashboard/page-section-template'
import RegistrySetup from '~/app/_components/dashboard/registry-setup'
import HomeContent from '~/app/_components/dashboard/section-content/home'
import RsvpContent from '~/app/_components/dashboard/section-content/rsvp'
import SidebarPanel from '~/app/_components/dashboard/sidebar-panel'
import DashboardSettingsForm from '~/app/_components/forms/dashboard-settings-form'
import EventForm from '~/app/_components/forms/event-form'
import EditRsvpSettingsForm from '~/app/_components/forms/rsvp/edit-rsvp-settings'
import RsvpFormSettings from '~/app/_components/forms/rsvp-form-settings'
import { type DashboardData, type EventFormData } from '~/app/utils/shared-types'

export default function Dashboard({
  dashboardData,
  uploadImage,
  deleteImage,
}: {
  dashboardData: DashboardData
  uploadImage: (formData: FormData) => Promise<{ ok: boolean }>
  deleteImage: (imageKey: string) => Promise<{ ok: boolean }>
}) {
  const isEventFormOpen = useEventForm()
  const showEditRsvpSettings = useEditRsvpSettingsForm()
  const [showRegistrySetup, setShowRegistrySetup] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('registrySectionStatus') !== 'hidden'
    }
    return true
  })
  const [prefillEvent, setPrefillEvent] = useState<EventFormData | undefined>()
  const [collapseSections, setCollapseSections] = useState<boolean>(false)
  const [showRsvpSettings, setShowRsvpSettings] = useState<boolean>(false)
  const [showWebsiteSettings, setShowWebsiteSettings] = useState<boolean>(false)

  // Derive events directly from dashboardData instead of duplicating state
  const events = dashboardData?.events ?? []

  if (showRsvpSettings) {
    return (
      <RsvpFormSettings dashboardData={dashboardData} setShowRsvpSettings={setShowRsvpSettings} />
    )
  }
  return (
    <>
      {isEventFormOpen && <EventForm prefillFormData={prefillEvent} />}
      {showWebsiteSettings && (
        <DashboardSettingsForm
          setShowWebsiteSettings={setShowWebsiteSettings}
          website={dashboardData?.weddingData?.website}
        />
      )}
      {showEditRsvpSettings && (
        <EditRsvpSettingsForm website={dashboardData?.weddingData.website} />
      )}
      <DashboardHeader
        websiteUrl={dashboardData?.weddingData?.website?.url}
        setShowWebsiteSettings={setShowWebsiteSettings}
      />
      <hr className="relative -left-48 bottom-0 w-screen border-gray-300" />
      {showRegistrySetup && <RegistrySetup setShowRegistrySetup={setShowRegistrySetup} />}
      <hr className="relative -left-48 bottom-0 w-screen border-gray-300" />
      <div className="mt-14 grid grid-cols-[3fr_275px] gap-7">
        <div>
          <div className="flex justify-between pb-8">
            <h2 className="text-xl font-semibold">Pages</h2>
            <DashboardControls
              collapseSections={collapseSections}
              setCollapseSections={setCollapseSections}
            />
          </div>
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
        </div>
        <SidebarPanel setShowWebsiteSettings={setShowWebsiteSettings} />
      </div>
    </>
  )
}
