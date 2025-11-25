'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type ReactNode } from 'react'
import { IoMdClose } from 'react-icons/io'

import { useRsvpForm, useUpdateRsvpForm } from '~/app/_components/contexts/rsvp-form-context'
import { useConfirmReloadPage } from '~/app/_components/hooks'
import MultistepRsvpForm from '~/app/_components/website/forms/multi-step-form'
import ConfirmNameForm from '~/app/_components/website/forms/steps/confirm-name'
import EventRsvpForm from '~/app/_components/website/forms/steps/event-rsvp'
import FindYourInvitationForm from '~/app/_components/website/forms/steps/find-your-invitation'
import QuestionMultipleChoice from '~/app/_components/website/forms/steps/question-multiple-choice'
import QuestionShortAnswer from '~/app/_components/website/forms/steps/question-short-answer'
import SendRsvp from '~/app/_components/website/forms/steps/send-rsvp'
import RsvpConfirmation from '~/app/_components/website/rsvp-confirmation'
import { type Event, type Question, type RsvpPageData } from '~/app/utils/shared-types'
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
  }, [])

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
    const newSteps = weddingData?.events?.reduce((acc: ReactNode[], event: Event) => {
      if (!event.collectRsvp) return acc
      // TODO: invitedGuests need to be filtered based on rsvp selection - shouldnt show question step forms for those who declined rsvp
      const invitedGuests = rsvpFormData.selectedHousehold?.guests.filter((guest) =>
        guest.invitations.some(
          (invite) =>
            invite.eventId === event.id &&
            ['Invited', 'Attending', 'Declined'].includes(invite.rsvp ?? '')
        )
      )

      if (invitedGuests !== undefined && invitedGuests.length > 0) {
        acc.push(<EventRsvpForm event={event} invitedGuests={invitedGuests} />)
        for (const question of event.questions) {
          invitedGuests.forEach((guest) => {
            question.type === 'Text'
              ? acc.push(<QuestionShortAnswer question={question} guest={guest} />)
              : acc.push(<QuestionMultipleChoice question={question} guest={guest} />)
          })
        }
      }
      return acc
    }, [])

    weddingData?.website.generalQuestions.forEach((question: Question) => {
      question.type === 'Text'
        ? newSteps?.push(<QuestionShortAnswer question={question} />)
        : newSteps?.push(<QuestionMultipleChoice question={question} />)
    })

    const steps = newSteps ?? []
    numSteps.current = steps.length + NUM_STATIC_STEPS
    return steps
  }, [weddingData, rsvpFormData.selectedHousehold])

  return (
    <div className="pb-20 font-serif">
      <ProgressBar
        currentStep={currentStep}
        progress={progress}
        numSteps={numSteps.current}
        basePath={basePath}
      />
      <form
        className="m-auto w-[450px] py-5"
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
    <div className="fixed top-0 z-10 w-full bg-white px-10 py-1 text-center">
      <IoMdClose
        size={25}
        className="absolute right-3 top-2 z-20 cursor-pointer"
        onClick={() => {
          if (
            currentStep <= 1 ||
            (currentStep > 1 && window.confirm('Are you sure? Your RSVP has not been sent.'))
          ) {
            window.location.href = basePath
          }
        }}
      />
      <h1 className="py-3 text-2xl">RSVP</h1>
      <div className="relative mb-2.5 h-3 w-full rounded-full bg-gray-200">
        <div
          className="absolute left-0 top-0 mb-2.5 h-3 rounded-full bg-gray-700 transition-[width]"
          style={{
            width: currentStep < 3 ? '3%' : currentStep === numSteps - 1 ? '99%' : `${progress}%`,
          }}
        ></div>
      </div>
    </div>
  )
}
