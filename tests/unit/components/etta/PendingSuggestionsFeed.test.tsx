import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PendingSuggestionsFeed } from '~/components/etta/PendingSuggestionsFeed'
import type { EttaSuggestionView } from '~/lib/etta/types'

const mockGetAllSuggestionsQuery = jest.fn()
const mockReviewSuggestion = jest.fn()

jest.mock('~/trpc/react', () => ({
  api: {
    etta: {
      getAll: {
        useQuery: (...args: unknown[]) => mockGetAllSuggestionsQuery(...args),
      },
    },
  },
}))

jest.mock('~/components/etta/use-suggestion-review-action', () => ({
  useSuggestionReviewAction: () => mockReviewSuggestion,
}))

const suggestions: EttaSuggestionView[] = [
  {
    id: 'pending-1',
    summary: 'Add Northlight Venue to your list.',
    tier: 'T1',
    domain: 'vendors',
    actionType: 'add_vendor',
    status: 'pending',
    createdAt: '2026-04-10T12:00:00.000Z',
    executedAt: null,
    failureReason: null,
    payload: {
      name: 'Northlight Venue',
      category: 'venue',
    },
  },
  {
    id: 'actioned-1',
    summary: 'Ceremony timeline was updated.',
    tier: 'T1',
    domain: 'events',
    actionType: 'other',
    status: 'actioned',
    createdAt: '2026-04-09T12:00:00.000Z',
    executedAt: '2026-04-09T12:10:00.000Z',
    failureReason: null,
    payload: {},
  },
  {
    id: 'failed-1',
    summary: 'Send a follow-up to delayed RSVPs.',
    tier: 'T2',
    domain: 'guests',
    actionType: 'guest_followup',
    status: 'failed',
    createdAt: '2026-04-08T12:00:00.000Z',
    executedAt: null,
    failureReason: 'The guest list did not include a contact method.',
    payload: {
      message: 'Can you confirm by Friday?',
    },
  },
]

describe('PendingSuggestionsFeed', () => {
  beforeEach(() => {
    mockGetAllSuggestionsQuery.mockReset()
    mockReviewSuggestion.mockReset()
    mockGetAllSuggestionsQuery.mockReturnValue({
      data: suggestions,
    })
    mockReviewSuggestion.mockResolvedValue(true)
  })

  it('hydrates the inbox query from the server payload', () => {
    render(<PendingSuggestionsFeed suggestions={suggestions} />)

    expect(mockGetAllSuggestionsQuery).toHaveBeenCalledWith(
      {},
      {
        initialData: suggestions,
        staleTime: 30_000,
        refetchInterval: 15_000,
        refetchIntervalInBackground: false,
      }
    )
  })

  it('defaults to the pending filter and lets users switch to failed suggestions', () => {
    render(<PendingSuggestionsFeed suggestions={suggestions} />)

    expect(screen.getByRole('button', { name: 'Pending' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Add Northlight Venue to your list.')).toBeInTheDocument()
    expect(screen.queryByText('Ceremony timeline was updated.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Failed' }))

    expect(screen.getByText('Send a follow-up to delayed RSVPs.')).toBeInTheDocument()
    expect(screen.getByText('The guest list did not include a contact method.')).toBeInTheDocument()
    expect(screen.queryByText('Add Northlight Venue to your list.')).not.toBeInTheDocument()
  })

  it('shows an empty state when the active filter has no matching suggestions', () => {
    mockGetAllSuggestionsQuery.mockReturnValue({
      data: suggestions.filter((suggestion) => suggestion.status !== 'actioned'),
    })

    render(
      <PendingSuggestionsFeed
        suggestions={suggestions.filter((suggestion) => suggestion.status !== 'actioned')}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Actioned' }))

    expect(screen.getByText('No suggestions match the Actioned filter.')).toBeInTheDocument()
  })

  it('retries failed suggestions through the shared review action', async () => {
    render(<PendingSuggestionsFeed suggestions={suggestions} />)

    fireEvent.click(screen.getByRole('button', { name: 'Failed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(mockReviewSuggestion).toHaveBeenCalledWith({
        action: 'approve',
        domain: 'guests',
        suggestionId: 'failed-1',
      })
    })
  })
})
