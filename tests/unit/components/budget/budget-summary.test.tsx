import { render, screen } from '@testing-library/react'

import { BudgetSummary } from '~/components/budget/budget-summary'
import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import type { BudgetSummary as Summary } from '~/server/domains/budget/budget.types'

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({ budget: { getOverview: { invalidate: jest.fn() } } }),
    budget: {
      setTarget: { useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }) },
      setCurrency: { useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }) },
    },
  },
}))

const summary: Summary = {
  targetTotal: 10000,
  totalPlanned: 2000,
  estimatedTotal: 0,
  actualSpend: 500,
  refundableDeposits: 0,
  outstandingDeposits: 0,
  netSpend: 500,
  remaining: 9500,
}

it('shows the budget settings button for editors', () => {
  render(<BudgetSummary summary={summary} currency='GBP' />)
  expect(screen.getByRole('button', { name: 'Budget settings' })).toBeInTheDocument()
})

it('hides budget settings for viewers but keeps the numbers', () => {
  render(
    <WorkspaceCapabilitiesProvider canEditPlanning={false}>
      <BudgetSummary summary={summary} currency='GBP' />
    </WorkspaceCapabilitiesProvider>
  )
  expect(
    screen.queryByRole('button', { name: /Budget settings|Set budget/ })
  ).not.toBeInTheDocument()
  expect(screen.getByText('£10,000')).toBeInTheDocument()
  expect(screen.getByText('£9,500')).toBeInTheDocument()
})
