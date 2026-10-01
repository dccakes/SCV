import { fireEvent, render, screen, within } from '@testing-library/react'

import BudgetOverview from '~/components/budget'
import type {
  BudgetCategoryWithExpenses,
  BudgetOverview as Overview,
} from '~/server/domains/budget/budget.types'

let mockOverview: Overview

jest.mock('~/trpc/react', () => ({
  api: { budget: { getOverview: { useQuery: () => ({ data: mockOverview }) } } },
}))
jest.mock('~/components/budget/budget-summary', () => ({
  BudgetSummary: () => <div>Overview summary</div>,
}))
jest.mock('~/components/budget/allocation-bar', () => ({
  AllocationBar: () => <div>Allocation</div>,
}))
jest.mock('~/components/budget/upcoming-payments', () => ({
  UpcomingPayments: () => <div>Upcoming payments</div>,
}))
jest.mock('~/components/budget/category-form', () => ({
  CategoryForm: () => <div>Category form</div>,
}))
jest.mock('~/components/budget/category-card', () => ({
  CategoryCard: ({ category }: { category: BudgetCategoryWithExpenses }) => (
    <section aria-label='Selected category'>{category.name}</section>
  ),
}))

const totals = {
  plannedAmount: 1000,
  estimatedTotal: 0,
  actualSpend: 0,
  refundableDeposits: 0,
  outstandingDeposits: 0,
  netSpend: 0,
  remaining: 1000,
}
function category(id: string, name: string): BudgetCategoryWithExpenses {
  return {
    id,
    name,
    weddingId: 'wedding',
    plannedAmount: 1000,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    expenses: [],
    totals,
  }
}
function overview(categories: BudgetCategoryWithExpenses[]): Overview {
  return {
    targetTotal: 10000,
    currency: 'GBP',
    categories,
    summary: {
      targetTotal: 10000,
      totalPlanned: 2000,
      estimatedTotal: 0,
      actualSpend: 0,
      refundableDeposits: 0,
      outstandingDeposits: 0,
      netSpend: 0,
      remaining: 10000,
    },
  }
}

beforeEach(() => {
  mockOverview = overview([category('venue', 'Venue'), category('flowers', 'Flowers')])
})

it('selects the first category automatically and keeps existing overview sections visible', () => {
  render(<BudgetOverview initialOverview={mockOverview} />)
  expect(screen.getByRole('region', { name: 'Selected category' })).toHaveTextContent('Venue')
  expect(screen.getByRole('button', { name: /Venue/ })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByText('Overview summary')).toBeInTheDocument()
  expect(screen.getByText('Allocation')).toBeInTheDocument()
  expect(screen.getByText('Upcoming payments')).toBeInTheDocument()
})

it('switches the detail panel and preserves selection when data refreshes', () => {
  const { rerender } = render(<BudgetOverview initialOverview={mockOverview} />)
  fireEvent.click(screen.getByRole('button', { name: /Flowers/ }))
  mockOverview = overview([category('venue', 'Venue'), category('flowers', 'Updated flowers')])
  rerender(<BudgetOverview initialOverview={mockOverview} />)
  expect(screen.getByRole('region', { name: 'Selected category' })).toHaveTextContent(
    'Updated flowers'
  )
  expect(screen.getByRole('button', { name: /Updated flowers/ })).toHaveAttribute(
    'aria-current',
    'true'
  )
})

it('falls back to the first remaining category after selection is deleted', () => {
  const { rerender } = render(<BudgetOverview initialOverview={mockOverview} />)
  fireEvent.click(screen.getByRole('button', { name: /Flowers/ }))
  mockOverview = overview([category('venue', 'Venue')])
  rerender(<BudgetOverview initialOverview={mockOverview} />)
  expect(screen.getByRole('region', { name: 'Selected category' })).toHaveTextContent('Venue')
  mockOverview = overview([])
  rerender(<BudgetOverview initialOverview={mockOverview} />)
  expect(screen.getByText('Start your budget')).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Selected category' })).not.toBeInTheDocument()
})

it('opens the existing add-section dialog from the category rail', () => {
  render(<BudgetOverview initialOverview={mockOverview} />)
  fireEvent.click(screen.getByRole('button', { name: 'Add section' }))
  expect(within(screen.getByRole('dialog')).getByText('Category form')).toBeInTheDocument()
})
