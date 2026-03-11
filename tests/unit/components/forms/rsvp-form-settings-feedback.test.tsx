import { act, render, screen } from '@testing-library/react'

import RsvpFormSettings from '~/components/forms/rsvp-form-settings'

const mockRefresh = jest.fn()
let capturedOnError: ((error: unknown) => void) | undefined

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

jest.mock('~/components/contexts/edit-rsvp-settings-form-context', () => ({
  useToggleEditRsvpSettingsForm: () => jest.fn(),
}))

jest.mock('~/components/hooks', () => ({
  useScrollToTop: jest.fn(),
}))

jest.mock('~/components/forms/question-form', () => {
  return function MockQuestionForm() {
    return <div>Question form</div>
  }
})

jest.mock('~/components/forms/rsvp/general-questions-section', () => {
  return function MockGeneralQuestionsSection() {
    return <div>General questions</div>
  }
})

jest.mock('~/components/forms/rsvp/no-questions.view', () => {
  return function MockNoQuestionsView() {
    return <div>No questions</div>
  }
})

jest.mock('~/components/forms/rsvp/no-rsvp-view', () => {
  return function MockNoRsvpView() {
    return <div>No RSVP</div>
  }
})

jest.mock('~/components/loaders', () => ({
  LoadingSpinner: () => <div>Loading</div>,
}))

jest.mock('~/components/ui/switch', () => ({
  Switch: ({ onClick }: { onClick?: () => void }) => (
    <button type='button' onClick={onClick}>
      Toggle RSVP
    </button>
  ),
}))

jest.mock('~/trpc/react', () => ({
  api: {
    event: {
      updateCollectRsvp: {
        useMutation: (options: { onError?: (error: unknown) => void }) => {
          capturedOnError = options.onError

          return {
            mutate: jest.fn(),
            isPending: false,
          }
        },
      },
    },
  },
}))

describe('RsvpFormSettings async feedback', () => {
  beforeEach(() => {
    capturedOnError = undefined
    mockRefresh.mockReset()
  })

  it('renders inline error when RSVP toggle update fails', () => {
    render(
      <RsvpFormSettings
        dashboardData={
          {
            events: [
              {
                id: 'event-1',
                name: 'Wedding Day',
                collectRsvp: true,
                questions: [],
                guestResponses: {
                  attending: 0,
                  invited: 0,
                  declined: 0,
                },
              },
            ],
            weddingData: {
              website: {
                id: 'website-1',
                generalQuestions: [],
              },
            },
          } as never
        }
        setShowRsvpSettings={jest.fn()}
      />
    )

    act(() => {
      capturedOnError?.({ message: 'Failed to update RSVP setting' })
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to update RSVP setting')
  })
})
