'use client'

import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { AiOutlinePlusCircle } from 'react-icons/ai'
import { BsPencil } from 'react-icons/bs'
import { GoArrowLeft } from 'react-icons/go'
import { TiEyeOutline } from 'react-icons/ti'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { DashboardData, EventWithResponses, Question } from '~/app/utils/shared-types'
import { useToggleEditRsvpSettingsForm } from '~/components/contexts/edit-rsvp-settings-form-context'
import QuestionForm from '~/components/forms/question-form'
import GeneralQuestionsSection from '~/components/forms/rsvp/general-questions-section'
import NoQuestionsView from '~/components/forms/rsvp/no-questions.view'
import NoRsvpView from '~/components/forms/rsvp/no-rsvp-view'
import { useScrollToTop } from '~/components/hooks'
import { LoadingSpinner } from '~/components/loaders'
import { AsyncState } from '~/components/ui/async-state'
import { Switch } from '~/components/ui/switch'
import { api } from '~/trpc/react'

export default function RsvpFormSettings({
  dashboardData,
  setShowRsvpSettings,
}: {
  dashboardData: DashboardData
  setShowRsvpSettings: Dispatch<SetStateAction<boolean>>
}) {
  useScrollToTop()
  const toggleEditRsvpSettingsForm = useToggleEditRsvpSettingsForm()
  const [showQuestionForm, setShowQuestionForm] = useState<boolean>(false)
  const [prefillQuestion, setPrefillQuestion] = useState<Question>()
  const [useEditMode, setUseEditMode] = useState<boolean>(false)

  return (
    <>
      {showQuestionForm && prefillQuestion && (
        <QuestionForm
          isEditMode={useEditMode}
          question={prefillQuestion}
          setShowQuestionForm={setShowQuestionForm}
        />
      )}
      <div className='absolute top-0 left-0 flex h-[120px] w-screen items-center bg-white pl-10'>
        <button
          type='button'
          className='flex cursor-pointer gap-3'
          onClick={() => setShowRsvpSettings(false)}
        >
          <GoArrowLeft size={36} />
          <span className='font-semibold text-2xl'>Online RSVP</span>
        </button>
      </div>
      <div className='m-auto w-[800px]'>
        <div className='mt-10 flex items-center gap-2 bg-blue-50 p-4'>
          <TiEyeOutline size={30} color='blue' />
          <p>
            This form is <b>visible</b> on your Website. Guests on your Guest List can RVSP{' '}
            <button type='button' className='underline' onClick={toggleEditRsvpSettingsForm}>
              View Settings
            </button>
          </p>
        </div>
        <ul>
          {dashboardData?.events.map((event: EventWithResponses) => {
            const { attending, invited, declined } = event.guestResponses
            const numGuests = attending + invited + declined
            return (
              <section key={event.id} className='border-b py-12'>
                <EventRsvpSection
                  event={event}
                  numGuests={numGuests}
                  setUseEditMode={setUseEditMode}
                  setPrefillQuestion={setPrefillQuestion}
                  setShowQuestionForm={setShowQuestionForm}
                />
              </section>
            )
          })}
        </ul>
        <GeneralQuestionsSection
          website={dashboardData?.weddingData.website}
          setUseEditMode={setUseEditMode}
          setPrefillQuestion={setPrefillQuestion}
          setShowQuestionForm={setShowQuestionForm}
        />
      </div>
    </>
  )
}

type EventRsvpSectionProps = {
  event: EventWithResponses
  numGuests: number
  setUseEditMode: Dispatch<SetStateAction<boolean>>
  setPrefillQuestion: Dispatch<SetStateAction<Question | undefined>>
  setShowQuestionForm: Dispatch<SetStateAction<boolean>>
}

const getMutationErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return fallback
}

const EventRsvpSection = ({
  event,
  numGuests,
  setUseEditMode,
  setPrefillQuestion,
  setShowQuestionForm,
}: EventRsvpSectionProps) => {
  const router = useRouter()
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const updateEventRsvpSetting = api.event.updateCollectRsvp.useMutation({
    onSuccess: () => {
      setFeedbackError(null)
      router.refresh()
    },
    onError: (err) => {
      setFeedbackError(getMutationErrorMessage(err, 'Failed to update event. Please try again.'))
    },
  })

  const onAddQuestion = (eventId: string) => {
    setUseEditMode(false)
    setPrefillQuestion({
      id: undefined,
      eventId,
      text: '',
      type: 'Text',
      isRequired: false,
    })
    setShowQuestionForm(true)
  }
  return (
    <>
      <div className='flex items-center justify-between pb-4'>
        <h2 className='font-bold text-2xl'>{event.name}</h2>
        <div className='flex items-center gap-3'>
          <span>Collect RSVPs</span>
          {updateEventRsvpSetting.isPending ? (
            <LoadingSpinner size={20} />
          ) : (
            <Switch
              id={`${event.id}-rsvp-toggle`}
              checked={event.collectRsvp}
              onClick={() =>
                updateEventRsvpSetting.mutate({
                  eventId: event.id,
                  collectRsvp: !event.collectRsvp,
                })
              }
            />
          )}
        </div>
      </div>
      <AsyncState error={feedbackError} className='pb-4' />
      {event.collectRsvp && (event.questions?.length ?? 0) > 0 ? (
        <>
          <p>
            Questions will be asked to all of the {numGuests} guests on the{' '}
            <span className='font-semibold underline'>{event.name}</span> list who RSVP
            &apos;Yes&apos;
          </p>
          <ul className='mt-5 flex flex-col gap-3'>
            {event.questions?.map((question) => {
              return (
                <li key={question.id} className='border-2 p-4'>
                  <div className='flex items-center justify-between'>
                    {question.type === 'Text' ? (
                      <p>{question.text}</p>
                    ) : (
                      <div>
                        <p>{question.text}</p>
                        <span className='text-sm'>{question.options?.length} options</span>
                      </div>
                    )}
                    <BsPencil
                      size={20}
                      color={sharedStyles.primaryColorHex}
                      className='cursor-pointer'
                      onClick={() => {
                        setUseEditMode(true)
                        setPrefillQuestion(question)
                        setShowQuestionForm(true)
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          <button
            type='button'
            className='mt-5 flex w-fit cursor-pointer gap-2 decoration-pink-400 hover:underline'
            onClick={() => {
              setFeedbackError(null)
              onAddQuestion(event.id)
            }}
          >
            <AiOutlinePlusCircle size={25} color={sharedStyles.primaryColorHex} />
            <span className={sharedStyles.primaryText}>Add a Follow-Up Question</span>
          </button>
        </>
      ) : event.collectRsvp ? (
        <NoQuestionsView event={event} onAddQuestion={onAddQuestion} />
      ) : (
        <NoRsvpView />
      )}
    </>
  )
}
