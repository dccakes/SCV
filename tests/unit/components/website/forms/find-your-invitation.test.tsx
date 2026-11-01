import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import FindYourInvitationForm from '~/components/website/forms/steps/find-your-invitation'

const mockRefetch = jest.fn()
const mockUpdateRsvpForm = jest.fn()

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('~/trpc/react', () => ({
  api: {
    household: {
      findBySearchPublic: {
        useQuery: () => ({ refetch: mockRefetch, isFetching: false }),
      },
    },
  },
}))
jest.mock('~/components/contexts/rsvp-form-context', () => ({
  useRsvpForm: () => ({
    weddingData: { brideFirstName: 'A', groomFirstName: 'B', website: { subUrl: 'a-and-b' } },
  }),
  useUpdateRsvpForm: () => mockUpdateRsvpForm,
}))

const goNext = jest.fn()

function search(result: unknown) {
  mockRefetch.mockResolvedValue(result)
  render(<FindYourInvitationForm goNext={goNext} {...({} as object)} />)
  fireEvent.change(screen.getByPlaceholderText('fullNamePlaceholder'), {
    target: { value: 'Jane Doe' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'findInvitation' }))
}

describe('FindYourInvitationForm search errors', () => {
  beforeEach(() => jest.clearAllMocks())

  it('advances when households are found', async () => {
    search({ data: [{ id: 1 }], error: null })

    await waitFor(() => expect(goNext).toHaveBeenCalled())
    expect(mockUpdateRsvpForm).toHaveBeenCalledWith({ matchedHouseholds: [{ id: 1 }] })
  })

  it('says the name was not found when the search finds nothing', async () => {
    search({ data: [], error: null })

    expect(await screen.findByText('notFound')).toBeInTheDocument()
    expect(goNext).not.toHaveBeenCalled()
  })

  it('does not tell a rate limited guest their name was not found', async () => {
    search({ data: undefined, error: { data: { code: 'TOO_MANY_REQUESTS' } } })

    expect(await screen.findByText('tooManyRequests')).toBeInTheDocument()
    expect(screen.queryByText('notFound')).not.toBeInTheDocument()
    expect(goNext).not.toHaveBeenCalled()
  })

  it('keeps the not-found hint for other errors', async () => {
    search({ data: undefined, error: { data: { code: 'INTERNAL_SERVER_ERROR' } } })

    expect(await screen.findByText('notFound')).toBeInTheDocument()
  })

  it('clears the hint when the guest edits their name', async () => {
    search({ data: undefined, error: { data: { code: 'TOO_MANY_REQUESTS' } } })
    await screen.findByText('tooManyRequests')

    fireEvent.change(screen.getByPlaceholderText('fullNamePlaceholder'), {
      target: { value: 'Jane Do' },
    })

    expect(screen.queryByText('tooManyRequests')).not.toBeInTheDocument()
  })
})
