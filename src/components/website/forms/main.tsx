'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import type { Event, Question, RsvpPageData } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import { useConfirmReloadPage } from '~/components/hooks'
import { AsyncState } from '~/components/ui/async-state'
import MultistepRsvpForm from '~/components/website/forms/multi-step-form'
import ConfirmNameForm from '~/components/website/forms/steps/confirm-name'
import EventRsvpForm from '~/components/website/forms/steps/event-rsvp'
import FindYourInvitationForm from '~/components/website/forms/steps/find-your-invitation'
import QuestionMultipleChoice from '~/components/website/forms/steps/question-multiple-choice'
import QuestionShortAnswer from '~/components/website/forms/steps/question-short-answer'
import SendRsvp from '~/components/website/forms/steps/send-rsvp'
import RsvpConfirmation from '~/components/website/rsvp-confirmation'
import { ANALYTICS_ACTIONS, ANALYTICS_SCOPES, buildEventName } from '~/lib/analytics/events'
import { track } from '~/lib/analytics/track'
import { api } from '~/trpc/react'

const RSVP_SUBMISSION_EVENT = buildEventName({
  scope: ANALYTICS_SCOPES.rsvp,
  object: 'public_submission',
  action: ANALYTICS_ACTIONS.started,
})

type MainRsvpFormProps = {
  weddingData: RsvpPageData
  basePath: string
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

const NUM_STATIC_STEPS = 4 // find invitation step, confirm household step, final step, and confirmation

export const shouldConfirmRsvpClose = ({
  currentStep,
  numSteps,
}: {
  currentStep: number
  numSteps: number
}) => currentStep > 1 && currentStep < numSteps

export default function MainRsvpForm({ weddingData, basePath }: MainRsvpFormProps) {
  const rsvpFormData = useRsvpForm()
  const numSteps = useRef(NUM_STATIC_STEPS)
  const updateRsvpForm = useUpdateRsvpForm()
  // A recognized guest (identified by their save-the-date invite) skips the name
  // search and lands on the confirm step (step 2).
  const [currentStep, setCurrentStep] = useState<number>(rsvpFormData.recognized ? 2 : 1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  useConfirmReloadPage(currentStep > 1 && currentStep < numSteps.current)
  useEffect(() => {
    updateRsvpForm({ weddingData })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRsvpForm, weddingData])

  const submitRsvpForm = api.website.submitPublicRsvpForm.useMutation({
    onSuccess: () => {
      setSubmitError(null)
      setCurrentStep((prev) => prev + 1)
    },
    onError: (err) => {
      setSubmitError(getMutationErrorMessage(err, 'Failed to submit RSVP. Please try again.'))
    },
  })
  const progress = (currentStep / numSteps.current) * 100

  const generateDynamicStepForms = useCallback((): ReactNode[] => {
    const newSteps: ReactNode[] =
      weddingData?.events?.reduce((acc: ReactNode[], event: Event) => {
        if (!event.collectRsvp) return acc
        const invitedGuests = rsvpFormData.selectedHousehold?.guests.filter((guest) =>
          guest.invitations.some(
            (invite) =>
              invite.eventId === event.id &&
              ['Invited', 'Attending', 'Declined'].includes(invite.rsvp ?? '')
          )
        )

        if (invitedGuests !== undefined && invitedGuests.length > 0) {
          acc.push(<EventRsvpForm event={event} invitedGuests={invitedGuests} />)
          // Only show question steps for guests who confirmed attendance.
          // Fall back to all invited guests if responses haven't been recorded yet.
          const hasResponsesForEvent = rsvpFormData.rsvpResponses.some(
            (r) => r.eventId === event.id
          )
          const guestsForQuestions = hasResponsesForEvent
            ? invitedGuests.filter((guest) =>
                rsvpFormData.rsvpResponses.some(
                  (r) => r.guestId === guest.id && r.eventId === event.id && r.rsvp === 'Attending'
                )
              )
            : invitedGuests
          for (const question of event.questions) {
            guestsForQuestions.forEach((guest) => {
              if (question.type === 'Text') {
                acc.push(<QuestionShortAnswer question={question} guest={guest} />)
              } else {
                acc.push(<QuestionMultipleChoice question={question} guest={guest} />)
              }
            })
          }
        }
        return acc
      }, []) ?? []

    weddingData?.website?.generalQuestions?.forEach((question: Question) => {
      if (question.type === 'Text') {
        newSteps.push(<QuestionShortAnswer question={question} />)
      } else {
        newSteps.push(<QuestionMultipleChoice question={question} />)
      }
    })

    numSteps.current = newSteps.length + NUM_STATIC_STEPS
    return newSteps
  }, [weddingData, rsvpFormData.selectedHousehold, rsvpFormData.rsvpResponses])

  return (
    // pt-24 reserves space for the fixed ProgressBar so the first step's copy
    // isn't hidden beneath it.
    <div className='pt-24 pb-20 font-serif'>
      <ProgressBar
        currentStep={currentStep}
        progress={progress}
        numSteps={numSteps.current}
        basePath={basePath}
      />
      <form
        className='m-auto w-full max-w-[450px] px-4 py-5 md:px-0'
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitError(null)

          const subUrl = weddingData.website?.subUrl

          if (!subUrl) {
            setSubmitError('Something went wrong. Please refresh the page and try again.')
            return
          }

          // The guest reaches this page from the wedding website (or their
          // save-the-date link), so the submission is scoped by subUrl. An
          // optional ?token= from a shared self-fill link is still forwarded when
          // present.
          const token = new URLSearchParams(window.location.search).get('token') ?? undefined

          // Analytics: record the guest's RSVP submission from the template.
          // The backend also captures the persisted outcome; this frontend event
          // carries the rich client context (household, response payload) that we
          // keep as a temporary backup while the app is being tested.
          track(
            RSVP_SUBMISSION_EVENT,
            {
              weddingId: weddingData.events?.[0]?.weddingId,
              token,
              householdId: rsvpFormData.selectedHousehold?.id,
              subUrl,
            },
            {
              num_event_responses: rsvpFormData.rsvpResponses.length,
              num_question_answers: rsvpFormData.answersToQuestions.length,
              payload: {
                rsvpResponses: rsvpFormData.rsvpResponses,
                answersToQuestions: rsvpFormData.answersToQuestions,
              },
            }
          )

          submitRsvpForm.mutate({
            subUrl,
            ...(token ? { token } : {}),
            rsvpResponses: rsvpFormData.rsvpResponses,
            answersToQuestions: rsvpFormData.answersToQuestions,
          })
        }}
      >
        <AsyncState error={submitError} className='mb-4 text-center' />
        <MultistepRsvpForm currentStep={currentStep} setCurrentStep={setCurrentStep}>
          <FindYourInvitationForm />
          <ConfirmNameForm />
          {...generateDynamicStepForms()}
          <SendRsvp isFetching={submitRsvpForm.isPending} />
          <RsvpConfirmation basePath={basePath} setCurrentStep={setCurrentStep} />
        </MultistepRsvpForm>
      </form>
    </div>
  )
}

const ProgressBar = ({
  currentStep,
  progress,
  numSteps,
  basePath,
}: {
  currentStep: number
  progress: number
  numSteps: number
  basePath: string
}) => {
  return (
    <div className='fixed top-0 z-10 w-full bg-white px-10 py-1 text-center'>
      <button
        type='button'
        aria-label='Close RSVP form'
        className='absolute top-2 right-3 z-20 rounded-md text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        onClick={() => {
          if (
            !shouldConfirmRsvpClose({ currentStep, numSteps }) ||
            window.confirm('Are you sure? Your RSVP has not been sent.')
          ) {
            window.location.href = basePath
          }
        }}
      >
        <IoMdClose size={25} />
      </button>
      <h1 className='py-3 text-2xl'>RSVP</h1>
      <div className='relative mb-2.5 h-3 w-full rounded-full bg-gray-200'>
        <div
          className='absolute top-0 left-0 mb-2.5 h-3 rounded-full bg-gray-700 transition-[width]'
          style={{
            width: currentStep < 3 ? '3%' : currentStep === numSteps - 1 ? '99%' : `${progress}%`,
          }}
        ></div>
      </div>
    </div>
  )
}
