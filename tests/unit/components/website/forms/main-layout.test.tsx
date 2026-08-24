import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Dispatch, SetStateAction } from 'react'
import { sharedStyles } from '~/app/utils/shared-styles'
import MainRsvpForm from '~/components/website/forms/main'

const mockMutate = jest.fn()
let capturedOnError: ((error: unknown) => void) | undefined
let capturedOnSuccess: (() => void) | undefined
let capturedSetCurrentStep: Dispatch<SetStateAction<number>> | undefined

jest.mock('~/components/contexts/rsvp-form-context', () => ({
  useRsvpForm: () => ({
    selectedHousehold: undefined,
    rsvpResponses: [],
    answersToQuestions: [],
  }),
  useUpdateRsvpForm: () => jest.fn(),
}))

jest.mock('~/components/hooks', () => ({
  useConfirmReloadPage: jest.fn(),
}))

jest.mock('~/components/website/forms/multi-step-form', () => {
  return function MockMultistepRsvpForm({
    children,
    setCurrentStep,
  }: {
    children: React.ReactNode
    setCurrentStep: Dispatch<SetStateAction<number>>
  }) {
    capturedSetCurrentStep = setCurrentStep
    return <>{children}</>
  }
})

jest.mock('~/components/website/forms/steps/find-your-invitation', () => {
  return function MockFindYourInvitationForm() {
    return <div>Find invitation</div>
  }
})

jest.mock('~/components/website/forms/steps/confirm-name', () => {
  return function MockConfirmNameForm() {
    return <div>Confirm name</div>
  }
})

jest.mock('~/components/website/forms/steps/event-rsvp', () => {
  return function MockEventRsvpForm() {
    return <div>Event RSVP</div>
  }
})

jest.mock('~/components/website/forms/steps/question-multiple-choice', () => {
  return function MockQuestionMultipleChoice() {
    return <div>Question multiple choice</div>
  }
})

jest.mock('~/components/website/forms/steps/question-short-answer', () => {
  return function MockQuestionShortAnswer() {
    return <div>Question short answer</div>
  }
})

jest.mock('~/components/website/forms/steps/send-rsvp', () => {
  return function MockSendRsvp() {
    return <div>Send RSVP</div>
  }
})

jest.mock('~/components/website/rsvp-confirmation', () => {
  return function MockRsvpConfirmation() {
    return <div>RSVP confirmation</div>
  }
})

jest.mock('~/trpc/react', () => ({
  api: {
    website: {
      submitPublicRsvpForm: {
        useMutation: (options: { onError?: (error: unknown) => void; onSuccess?: () => void }) => {
          capturedOnError = options.onError
          capturedOnSuccess = options.onSuccess

          return {
            mutate: mockMutate,
            isPending: false,
          }
        },
      },
    },
  },
}))

describe('Main RSVP layout', () => {
  beforeEach(() => {
    mockMutate.mockReset()
    capturedOnError = undefined
    capturedOnSuccess = undefined
    capturedSetCurrentStep = undefined
  })

  it('uses a mobile-first responsive width contract for the main form', () => {
    const { container } = render(
      <MainRsvpForm
        weddingData={{ events: [], website: { generalQuestions: [] } } as never}
        basePath='/wedding'
      />
    )

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    const classTokens = form?.className.split(' ') ?? []
    expect(classTokens).toContain('w-full')
    expect(classTokens).toContain('max-w-[450px]')
    expect(classTokens).not.toContain('w-[450px]')
  })

  it('reserves top space so content clears the fixed progress bar', () => {
    const { container } = render(
      <MainRsvpForm
        weddingData={{ events: [], website: { generalQuestions: [] } } as never}
        basePath='/wedding'
      />
    )

    // The form's wrapper pads the top to clear the fixed "RSVP" header bar,
    // otherwise the first step's copy renders underneath it.
    const wrapper = container.querySelector('form')?.parentElement
    expect(wrapper?.className.split(' ')).toContain('pt-24')
  })

  it('uses responsive side pane footer widths for mobile screens', () => {
    expect(sharedStyles.sidebarFormWidth).toContain('w-full')
    expect(sharedStyles.sidebarFormWidth).toContain('max-w-')
    expect(sharedStyles.sidebarFormWidth).not.toContain('w-[525px]')
  })

  it('renders inline submit errors without using window alert', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined)

    const { container } = render(
      <MainRsvpForm
        weddingData={{ events: [], website: { generalQuestions: [] } } as never}
        basePath='/wedding'
      />
    )

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)
    act(() => {
      capturedOnError?.({ message: 'RSVP service unavailable' })
    })

    expect(screen.getByRole('alert')).toHaveTextContent('RSVP service unavailable')
    expect(alertSpy).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })

  it('does not show the unsent RSVP confirmation after submission is complete', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    const { container } = render(
      <MainRsvpForm
        weddingData={
          { events: [], website: { subUrl: 'our-wedding', generalQuestions: [] } } as never
        }
        basePath='#wedding'
      />
    )

    expect(capturedSetCurrentStep).toBeDefined()
    expect(capturedOnSuccess).toBeDefined()

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    act(() => {
      capturedSetCurrentStep?.(3)
    })
    fireEvent.submit(form as HTMLFormElement)
    expect(mockMutate).toHaveBeenCalledWith({
      subUrl: 'our-wedding',
      rsvpResponses: [],
      answersToQuestions: [],
    })

    act(() => {
      capturedOnSuccess?.()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close RSVP form' }))

    expect(confirmSpy).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('shows the unsent RSVP confirmation while submission is still in progress', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <MainRsvpForm
        weddingData={
          { events: [], website: { subUrl: 'our-wedding', generalQuestions: [] } } as never
        }
        basePath='#wedding'
      />
    )

    expect(capturedSetCurrentStep).toBeDefined()
    act(() => {
      capturedSetCurrentStep?.(2)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close RSVP form' }))

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure? Your RSVP has not been sent.')

    confirmSpy.mockRestore()
  })
})
