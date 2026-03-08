'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { IoMdClose } from 'react-icons/io'

import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import { useConfirmReloadPage } from '~/components/hooks'
import MultistepRsvpForm from '~/components/website/forms/multi-step-form'
import ConfirmNameForm from '~/components/website/forms/steps/confirm-name'
import EventRsvpForm from '~/components/website/forms/steps/event-rsvp'
import FindYourInvitationForm from '~/components/website/forms/steps/find-your-invitation'
import QuestionMultipleChoice from '~/components/website/forms/steps/question-multiple-choice'
import QuestionShortAnswer from '~/components/website/forms/steps/question-short-answer'
import SendRsvp from '~/components/website/forms/steps/send-rsvp'
import RsvpConfirmation from '~/components/website/rsvp-confirmation'
import type { Event, Question, RsvpPageData } from '~/app/utils/shared-types'
import { api } from '~/trpc/react'

type MainRsvpFormProps = {
  weddingData: RsvpPageData
  basePath: string
}

const NUM_STATIC_STEPS = 4 // find invitation step, confirm household step, final step, and confirmation

export default function MainRsvpForm({ weddingData, basePath }: MainRsvpFormProps) {
  const rsvpFormData = useRsvpForm()
  const numSteps = useRef(NUM_STATIC_STEPS)
  const updateRsvpForm = useUpdateRsvpForm()
  const [currentStep, setCurrentStep] = useState<number>(1)
  useConfirmReloadPage(currentStep > 1 && currentStep < numSteps.current)
  useEffect(() => {
    updateRsvpForm({ weddingData })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRsvpForm, weddingData])

  const submitRsvpForm = api.website.submitRsvpForm.useMutation({
    onSuccess: () => {
      setCurrentStep((prev) => prev + 1)
    },
    onError: (err) => {
      if (err) window.alert(err)
      else window.alert('Failed to submit rsvp! Please try again later.')
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
    <div className='pb-20 font-serif'>
      <ProgressBar
        currentStep={currentStep}
        progress={progress}
        numSteps={numSteps.current}
        basePath={basePath}
      />
      <form
        className='m-auto w-[450px] py-5'
        onSubmit={(e) => {
          e.preventDefault()
          submitRsvpForm.mutate(rsvpFormData)
        }}
      >
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
      <IoMdClose
        size={25}
        className='absolute top-2 right-3 z-20 cursor-pointer'
        onClick={() => {
          if (
            currentStep <= 1 ||
            (currentStep > 1 && window.confirm('Are you sure? Your RSVP has not been sent.'))
          ) {
            window.location.href = basePath
          }
        }}
      />
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
