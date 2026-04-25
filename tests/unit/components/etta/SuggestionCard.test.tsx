import { fireEvent, render, screen } from '@testing-library/react'

import { SuggestionCard } from '~/components/etta/SuggestionCard'
import type { EttaSuggestionView } from '~/lib/etta/types'

const baseSuggestion: EttaSuggestionView = {
  id: 'suggestion-1',
  summary: 'Add Solstice Floral to your shortlist.',
  tier: 'T1',
  domain: 'vendors',
  actionType: 'add_vendor',
  status: 'pending',
  createdAt: '2026-04-01T12:00:00.000Z',
  executedAt: null,
  failureReason: null,
  payload: {
    name: 'Solstice Floral',
    category: 'florist',
  },
}

describe('SuggestionCard', () => {
  it('shows the domain badge and retry affordance for failed suggestions', () => {
    const onApprove = jest.fn()

    render(
      <SuggestionCard
        suggestion={{
          ...baseSuggestion,
          status: 'failed',
          failureReason: 'Vendor email was missing a recipient address.',
        }}
        onApprove={onApprove}
        onDismiss={jest.fn()}
      />
    )

    expect(screen.getByText('vendors')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Vendor email was missing a recipient address.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onApprove).toHaveBeenCalledWith('suggestion-1')
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('renders actioned suggestions as read-only history items', () => {
    render(
      <SuggestionCard
        suggestion={{
          ...baseSuggestion,
          status: 'actioned',
          executedAt: '2026-04-01T12:05:00.000Z',
        }}
        onApprove={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    expect(screen.getByText('Actioned')).toBeInTheDocument()
    expect(screen.getByText(/etta completed this suggestion/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
  })
})
