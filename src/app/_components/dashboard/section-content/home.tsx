import { type Dispatch, type SetStateAction } from 'react'
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlinePlusCircle } from 'react-icons/ai'
import { BsPencil } from 'react-icons/bs'
import { CiLocationOn } from 'react-icons/ci'
import { TfiNewWindow } from 'react-icons/tfi'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import CoverPhotoImage from '~/app/_components/dashboard/cover-photo-image'
import CoverPhotoUploader from '~/app/_components/dashboard/cover-photo-uploader'
import { convertDate, formatDateHTML5 } from '~/app/utils/helpers'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type DashboardData, type Event, type EventFormData } from '~/app/utils/shared-types'

type HomeContentProps = {
  dashboardData: DashboardData
  events: Event[] | undefined
  setPrefillEvent: Dispatch<SetStateAction<EventFormData | undefined>>
  uploadImage: (formData: FormData) => Promise<{ ok: boolean }>
  deleteImage: (imageKey: string) => Promise<{ ok: boolean }>
}

export default function HomeContent({
  dashboardData,
  events,
  setPrefillEvent,
  uploadImage,
  deleteImage,
}: HomeContentProps) {
  const toggleEventForm = useToggleEventForm()

  const handleEditEvent = (event: Event) => {
    const standardDate = formatDateHTML5(event.date)

    setPrefillEvent({
      eventName: event.name,
      date: standardDate ?? undefined,
      startTime: event.startTime ?? undefined,
      endTime: event.endTime ?? undefined,
      venue: event.venue ?? undefined,
      attire: event.attire ?? undefined,
      description: event.description ?? undefined,
      eventId: event.id,
    })
    toggleEventForm()
  }

  return (
    <>
      <div className="px-10">
        {dashboardData?.weddingData?.website?.coverPhotoUrl ? (
          <CoverPhotoImage
            coverPhotoUrl={dashboardData.weddingData.website.coverPhotoUrl}
            deleteImage={deleteImage}
          />
        ) : (
          <CoverPhotoUploader uploadImage={uploadImage} />
        )}
      </div>
      <div className="border-b py-5">
        <div className="px-10">
          <h2 className="my-3 text-xl font-semibold">
            {dashboardData?.weddingData?.groomFirstName} &{' '}
            {dashboardData?.weddingData?.brideFirstName}
          </h2>
          <div className="flex gap-1 text-neutral-500">
            <AiOutlineCalendar size={20} />
            {dashboardData?.weddingData?.date?.standardFormat ? (
              <span>{dashboardData?.weddingData?.date?.standardFormat}</span>
            ) : (
              <span>Date to be Announced</span>
            )}
            {(dashboardData?.weddingData?.daysRemaining ?? 0) > 0 && (
              <>
                <span>|</span>
                <span>{dashboardData?.weddingData?.daysRemaining} Days To Go!</span>
              </>
            )}
          </div>
          <div className="mt-1 flex gap-1">
            <CiLocationOn size={20} />
            <span
              className={`cursor-pointer text-${sharedStyles.primaryColor}`}
              onClick={toggleEventForm}
            >
              Add your wedding location
            </span>
          </div>
        </div>
      </div>
      <div className="px-10 py-5">
        <h2 className="mb-3 text-sm">Events</h2>
        <div className="grid auto-rows-[minmax(min-content,150px)] grid-cols-3 gap-5">
          {events?.map((event) => {
            return (
              <div key={event.id} className="relative border p-6">
                <button className="absolute right-5 top-5" onClick={() => handleEditEvent(event)}>
                  <BsPencil size={20} color={sharedStyles.primaryColorHex} />
                </button>
                <h3 className="mb-4 pr-5 text-lg font-semibold">{event.name}</h3>
                <div className="flex flex-col gap-3 text-sm font-light">
                  <div className="flex items-center gap-2 text-xs">
                    <AiOutlineCalendar size={20} />
                    {event.date ? (
                      <p>{convertDate(event.date)}</p>
                    ) : (
                      <button className="underline" onClick={() => handleEditEvent(event)}>
                        Add date
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AiOutlineClockCircle size={20} />
                    {event.startTime ? (
                      <p>{event.startTime.toString()}</p>
                    ) : (
                      <button className="underline" onClick={() => handleEditEvent(event)}>
                        Add time
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CiLocationOn size={20} />
                    {event.venue ? (
                      <p>{event.venue}</p>
                    ) : (
                      <div className="flex gap-2">
                        <button className="underline" onClick={() => handleEditEvent(event)}>
                          Add venue
                        </button>
                        <span className="text-neutral-300">|</span>
                        <button className="underline" onClick={() => handleEditEvent(event)}>
                          Browse venues
                        </button>
                        <TfiNewWindow size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div
            onClick={() => {
              setPrefillEvent(undefined)
              toggleEventForm()
            }}
            className="flex cursor-pointer items-center justify-center border transition-colors duration-300 ease-in-out hover:bg-gray-100"
          >
            <div className="flex">
              <AiOutlinePlusCircle size={25} color={sharedStyles.primaryColorHex} />
              <span className={`pl-2 text-${sharedStyles.primaryColor}`}>Add Event</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
