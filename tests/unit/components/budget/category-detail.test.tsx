import { fireEvent, render, screen, within } from '@testing-library/react'

import { CategoryCard } from '~/components/budget/category-card'
import type { BudgetCategoryWithExpenses } from '~/server/domains/budget/budget.types'

const mockDeleteCategory = jest.fn()
const mockDeleteExpense = jest.fn()
jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({ budget: { getOverview: { invalidate: jest.fn() } } }),
    budget: {
      deleteCategory: { useMutation: () => ({ mutate: mockDeleteCategory, isPending: false }) },
      deleteExpense: { useMutation: () => ({ mutate: mockDeleteExpense, isPending: false }) },
    },
  },
}))
jest.mock('~/components/budget/category-form', () => ({
  CategoryForm: () => <div>Category form</div>,
}))
jest.mock('~/components/budget/expense-form', () => ({
  ExpenseForm: ({ mode, categoryId }: { mode: string; categoryId?: string }) => (
    <div>
      {mode} expense form {categoryId}
    </div>
  ),
}))

const date = new Date('2026-01-01T00:00:00Z')
const category: BudgetCategoryWithExpenses = {
  id: 'venue',
  weddingId: 'wedding',
  name: 'Venue',
  plannedAmount: 1000,
  position: 0,
  createdAt: date,
  updatedAt: date,
  expenses: [
    {
      id: 'deposit',
      weddingId: 'wedding',
      categoryId: 'venue',
      description: 'Security deposit',
      estimatedAmount: 200,
      amount: 200,
      isDeposit: true,
      isRefundable: true,
      refundedAt: null,
      dueAt: null,
      paidAt: date,
      notes: null,
      createdAt: date,
      updatedAt: date,
    },
  ],
  totals: {
    plannedAmount: 1000,
    estimatedTotal: 200,
    actualSpend: 200,
    refundableDeposits: 200,
    outstandingDeposits: 200,
    netSpend: 0,
    remaining: 1000,
  },
}

beforeEach(() => jest.clearAllMocks())

it('shows expenses immediately and uses net spend for budget progress', () => {
  render(<CategoryCard category={category} currency='GBP' />)
  expect(screen.getByRole('table', { name: 'Expenses for Venue' })).toBeInTheDocument()
  expect(screen.getByText('Refundable')).toBeInTheDocument()
  expect(screen.getByText(/£200 refundable deposits excluded from net spend/)).toBeInTheDocument()
  expect(screen.getByText('£0 net of £1,000')).toBeInTheDocument()
  expect(screen.getByText('£1,000 left')).toBeInTheDocument()
})

it('opens the existing add expense form in the selected category', () => {
  render(<CategoryCard category={category} currency='GBP' />)
  fireEvent.click(screen.getByRole('button', { name: 'Add new expense' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('create expense form venue')
})

it('opens the existing edit section form', () => {
  render(<CategoryCard category={category} currency='GBP' />)
  fireEvent.click(screen.getByRole('button', { name: 'Edit section' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Category form')
})

it('requires confirmation before deleting the selected category', () => {
  render(<CategoryCard category={category} currency='GBP' />)
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  expect(mockDeleteCategory).not.toHaveBeenCalled()
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete “Venue”?')
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
  expect(mockDeleteCategory).toHaveBeenCalledWith({ categoryId: 'venue' })
})

it('keeps add expense available when the category has no expenses', () => {
  render(<CategoryCard category={{ ...category, expenses: [] }} currency='GBP' />)
  expect(screen.getByText(/No expenses recorded yet/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add new expense' })).toBeInTheDocument()
})
