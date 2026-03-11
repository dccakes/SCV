import { act, fireEvent, render, screen } from '@testing-library/react'

import QuestionForm from '~/app/_components/forms/question-form'

const mockRefresh = jest.fn()
const mockSetShowQuestionForm = jest.fn()
let capturedUpsertOnError: ((error: unknown) => void) | undefined
let capturedDeleteOnError: ((error: unknown) => void) | undefined

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

jest.mock('~/trpc/react', () => ({
  api: {
    question: {
      upsert: {
        useMutation: (options: { onError?: (error: unknown) => void }) => {
          capturedUpsertOnError = options.onError

          return {
            mutate: jest.fn(),
            isPending: false,
          }
        },
      },
      delete: {
        useMutation: (options: { onError?: (error: unknown) => void }) => {
          capturedDeleteOnError = options.onError

          return {
            mutate: jest.fn(),
            isPending: false,
          }
        },
      },
    },
  },
}))

jest.mock('~/app/_components/forms/animated-input-label', () => {
  return function MockAnimatedInputLabel() {
    return <div>Question Input</div>
  }
})

jest.mock('~/app/_components/forms/rsvp/question-option-form', () => {
  return function MockQuestionOptionsForm() {
    return <div>Question Options</div>
  }
})

describe('QuestionForm accessibility', () => {
  beforeEach(() => {
    mockRefresh.mockReset()
    mockSetShowQuestionForm.mockReset()
    capturedUpsertOnError = undefined
    capturedDeleteOnError = undefined
  })

  it('should render a semantic close button with accessible name', () => {
    render(
      <QuestionForm
        isEditMode={false}
        question={{
          id: 'question-1',
          text: 'Dietary restrictions?',
          type: 'Text',
          eventId: 'event-1',
          websiteId: 'website-1',
          options: [],
        }}
        setShowQuestionForm={mockSetShowQuestionForm}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Close question form' })
    expect(closeButton).toHaveAttribute('type', 'button')

    fireEvent.click(closeButton)

    expect(mockSetShowQuestionForm).toHaveBeenCalledWith(false)
  })

  it('renders inline error messaging for save failures', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined)

    render(
      <QuestionForm
        isEditMode={false}
        question={{
          id: 'question-1',
          text: 'Dietary restrictions?',
          type: 'Text',
          eventId: 'event-1',
          websiteId: 'website-1',
          options: [],
        }}
        setShowQuestionForm={mockSetShowQuestionForm}
      />
    )

    act(() => {
      capturedUpsertOnError?.({ message: 'Failed to save question' })
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save question')
    expect(alertSpy).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })

  it('renders inline error messaging for delete failures', () => {
    render(
      <QuestionForm
        isEditMode={false}
        question={{
          id: 'question-1',
          text: 'Dietary restrictions?',
          type: 'Text',
          eventId: 'event-1',
          websiteId: 'website-1',
          options: [],
        }}
        setShowQuestionForm={mockSetShowQuestionForm}
      />
    )

    act(() => {
      capturedDeleteOnError?.({ message: 'Failed to delete question' })
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete question')
  })
})
