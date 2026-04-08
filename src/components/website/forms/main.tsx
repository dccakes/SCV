'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { useSearchParams } from 'next/navigation'
import type { Event, Guest, HouseholdRsvpData, Question, RsvpPageData } from '~/app/utils/shared-types'
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
import UpdateContactInfoForm from '~/components/website/forms/steps/update-contact-info'
import RsvpConfirmation from '~/components/website/rsvp-confirmation'
import { api } from '~/trpc/react'

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

// find invitation + confirm name + contact info + send rsvp + confirmation
const NUM_STATIC_STEPS = 5

/** Coerce confirmedHousehold guests into the Guest shape EventRsvpForm expects */
function toGuests(
  household: HouseholdRsvpData,
  weddingId: string
): Array<Guest & { invitations: Guest['invitations'] }> {
  return household.guests.map((g) => ({
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    isPrimaryContact: g.isPrimaryContact,
    isTagAlong: g.isTagAlong,
    householdId: household.id,
    weddingId,
    ageGroup: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    invitations: g.invitations.map((i) => ({
      id: '',
      guestId: g.id,
      eventId: i.eventId,
      weddingId,
      rsvp: i.rsvp,
      dietaryRestrictions: null,
      submittedBy: null,
      submittedAt: null,
      invitedAt: new Date(0),
      createdAt: new Date(0),
      updatedAt: new Date(0),
    })),
  }))
}

export default function MainRsvpForm({ weddingData, basePath }: MainRsvpFormProps) {
  const rsvpFormData = useRsvpForm()
  const numSteps = useRef(NUM_STATIC_STEPS)
  const updateRsvpForm = useUpdateRsvpForm()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  useConfirmReloadPage(currentStep > 1 && currentStep < numSteps.current)

  const subUrl = weddingData.website?.subUrl ?? ''
  const weddingId = weddingData.website?.weddingId ?? ''

  useEffect(() => {
    updateRsvpForm({ weddingData })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRsvpForm, weddingData])

  // On mount, try rsvp_token from URL or localStorage
  const urlRsvpToken = searchParams.get('rsvp_token')
  const storedToken =
    typeof window !== 'undefined' ? localStorage.getItem(`rsvp_token_${subUrl}`) : null
  const initialToken = urlRsvpToken ?? storedToken ?? null

  const validateToken = api.website.validateRsvpToken.useQuery(
    { subUrl, rsvpToken: initialToken ?? '' },
    {
      enabled: !!initialToken && !!subUrl,
      retry: false,
    }
  )

  useEffect(() => {
    if (validateToken.data) {
      updateRsvpForm({
        rsvpToken: validateToken.data.rsvpToken,
        confirmedHousehold: validateToken.data.household,
      })
      try {
        localStorage.setItem(`rsvp_token_${subUrl}`, validateToken.data.rsvpToken)
      } catch {
        // localStorage unavailable — ignore
      }
      // Skip find-invitation (1) and confirm-name (2) steps
      setCurrentStep(3)
    }
  }, [validateToken.data, updateRsvpForm, subUrl])

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

  const confirmedHousehold = rsvpFormData.confirmedHousehold

  const generateDynamicStepForms = useCallback((): ReactNode[] => {
    // Prefer confirmedHousehold (new flow) over selectedHousehold (old flow)
    const householdGuests: Array<Guest & { invitations: Guest['invitations'] }> =
      confirmedHousehold
        ? toGuests(confirmedHousehold, weddingId)
        : (rsvpFormData.selectedHousehold?.guests as Array<Guest & { invitations: Guest['invitations'] }> ?? [])

    const newSteps: ReactNode[] =
      weddingData?.events?.reduce((acc: ReactNode[], event: Event) => {
        if (!event.collectRsvp) return acc

        const invitedGuests = householdGuests.filter(
          (guest) =>
            !guest.isTagAlong &&
            guest.invitations?.some(
              (invite) =>
                invite.eventId === event.id &&
                ['Invited', 'Attending', 'Declined'].includes(invite.rsvp ?? '')
            )
        )

        if (invitedGuests.length > 0) {
          acc.push(<EventRsvpForm event={event} invitedGuests={invitedGuests} />)
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
  }, [weddingData, confirmedHousehold, weddingId, rsvpFormData.selectedHousehold, rsvpFormData.rsvpResponses])

  return (
    <div className='pb-20 font-serif'>
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

          const rsvpToken = rsvpFormData.rsvpToken

          if (!rsvpToken || !subUrl) {
            setSubmitError('Invalid or expired RSVP link. Please request a new invitation link.')
            return
          }

          submitRsvpForm.mutate({
            subUrl,
            rsvpToken,
            rsvpResponses: rsvpFormData.rsvpResponses,
            answersToQuestions: rsvpFormData.answersToQuestions,
          })
        }}
      >
        <AsyncState error={submitError} className='mb-4 text-center' />
        <MultistepRsvpForm currentStep={currentStep} setCurrentStep={setCurrentStep}>
          <FindYourInvitationForm />
          <ConfirmNameForm />
          <UpdateContactInfoForm />
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
            currentStep <= 1 ||
            (currentStep > 1 && window.confirm('Are you sure? Your RSVP has not been sent.'))
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
