import type { Dispatch, SetStateAction } from 'react'
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlinePlusCircle } from 'react-icons/ai'
import { BsPencil } from 'react-icons/bs'
import { CiLocationOn } from 'react-icons/ci'
import { TfiNewWindow } from 'react-icons/tfi'
import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import CoverPhotoImage from '~/app/_components/dashboard/cover-photo-image'
import CoverPhotoUploader from '~/app/_components/dashboard/cover-photo-uploader'
import { convertDate, formatDateHTML5 } from '~/app/utils/helpers'
import type { DashboardData, Event, EventFormData } from '~/app/utils/shared-types'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

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
      <div className='px-10'>
        {dashboardData?.weddingData?.website?.coverPhotoUrl ? (
          <CoverPhotoImage
            coverPhotoUrl={dashboardData.weddingData.website.coverPhotoUrl}
            deleteImage={deleteImage}
          />
        ) : (
          <CoverPhotoUploader uploadImage={uploadImage} />
        )}
      </div>
      <div className='border-b py-5'>
        <div className='px-10'>
          <h2 className='my-3 font-semibold font-serif text-xl'>
            {dashboardData?.weddingData?.groomFirstName} &{' '}
            {dashboardData?.weddingData?.brideFirstName}
          </h2>
          <div className='flex gap-1 text-muted-foreground'>
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
          <div className='mt-1 flex gap-1'>
            <CiLocationOn size={20} />
            <button type='button' className='cursor-pointer text-primary' onClick={toggleEventForm}>
              Add your wedding location
            </button>
          </div>
        </div>
      </div>
      <div className='px-10 py-5'>
        <h2 className='mb-3 text-sm'>Events</h2>
        <div className='grid auto-rows-[minmax(min-content,150px)] grid-cols-3 gap-5'>
          {events?.map((event) => {
            return (
              <Card key={event.id} className='relative transition-shadow hover:shadow-md'>
                <button
                  type='button'
                  className='absolute top-4 right-4 text-muted-foreground transition-colors hover:text-primary'
                  onClick={() => handleEditEvent(event)}
                >
                  <BsPencil size={16} className='text-primary' />
                </button>
                <CardHeader className='pb-2'>
                  <CardTitle className='pr-6 font-serif text-base'>{event.name}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex flex-col gap-3 font-light text-sm'>
                    <div className='flex items-center gap-2 text-xs'>
                      <AiOutlineCalendar size={20} />
                      {event.date ? (
                        <p>{convertDate(event.date)}</p>
                      ) : (
                        <button
                          type='button'
                          className='underline'
                          onClick={() => handleEditEvent(event)}
                        >
                          Add date
                        </button>
                      )}
                    </div>
                    <div className='flex items-center gap-2 text-xs'>
                      <AiOutlineClockCircle size={20} />
                      {event.startTime ? (
                        <p>{event.startTime.toString()}</p>
                      ) : (
                        <button
                          type='button'
                          className='underline'
                          onClick={() => handleEditEvent(event)}
                        >
                          Add time
                        </button>
                      )}
                    </div>
                    <div className='flex items-center gap-2 text-xs'>
                      <CiLocationOn size={20} />
                      {event.venue ? (
                        <p>{event.venue}</p>
                      ) : (
                        <div className='flex gap-2'>
                          <button
                            type='button'
                            className='underline'
                            onClick={() => handleEditEvent(event)}
                          >
                            Add venue
                          </button>
                          <span className='text-neutral-300'>|</span>
                          <button
                            type='button'
                            className='underline'
                            onClick={() => handleEditEvent(event)}
                          >
                            Browse venues
                          </button>
                          <TfiNewWindow size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          <button
            type='button'
            onClick={() => {
              setPrefillEvent(undefined)
              toggleEventForm()
            }}
            className='flex min-h-[150px] cursor-pointer items-center justify-center rounded-lg border-2 border-border border-dashed transition-colors hover:border-primary hover:bg-primary/5'
          >
            <div className='flex'>
              <AiOutlinePlusCircle size={22} className='text-primary' />
              <span className='pl-2 text-primary text-sm'>Add Event</span>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
