'use client'

import { useState } from 'react'
import { formatCurrency } from '~/components/budget/format'
import { Badge } from '~/components/ui/badge'
import type { BudgetCategoryWithExpenses } from '~/server/domains/budget/budget.types'

type UpcomingPaymentsProps = {
  categories: BudgetCategoryWithExpenses[]
  currency: string
}

type DuePayment = {
  id: string
  description: string
  categoryName: string
  amount: number
  dueAt: Date
  overdue: boolean
}

const MAX_VISIBLE = 6

/**
 * Payment schedule: unpaid line items that carry a due date, soonest first,
 * with overdue payments called out. Mirrors the deposit/balance reminders the
 * major planners lead with, built on the expense data we already track.
 */
export function UpcomingPayments({ categories, currency }: Readonly<UpcomingPaymentsProps>) {
  const [showAll, setShowAll] = useState(false)
  const payments = collectDuePayments(categories)
  if (payments.length === 0) return null

  const hasMore = payments.length > MAX_VISIBLE
  const visible = showAll ? payments : payments.slice(0, MAX_VISIBLE)
  const overdueCount = payments.filter((payment) => payment.overdue).length

  return (
    <section className='mb-8 rounded-lg border border-border/70 bg-card p-4 md:p-5'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='font-serif text-foreground text-lg'>Upcoming payments</h2>
        {overdueCount > 0 ? (
          <Badge variant='outline' className='border-destructive/40 text-[0.6rem] text-destructive'>
            {overdueCount} overdue
          </Badge>
        ) : null}
      </div>

      <ul className='divide-y divide-border/50'>
        {visible.map((payment) => (
          <li key={payment.id} className='flex items-center justify-between gap-3 py-2.5'>
            <div className='min-w-0'>
              <p className='truncate font-medium text-foreground text-sm'>{payment.description}</p>
              <p className='mt-0.5 font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
                {payment.categoryName}
              </p>
            </div>
            <div className='flex shrink-0 flex-col items-end'>
              <span className='font-mono text-foreground text-sm tabular-nums'>
                {formatCurrency(payment.amount, currency)}
              </span>
              <span
                className={`text-xs ${payment.overdue ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {payment.overdue ? 'Overdue · ' : 'Due '}
                {payment.dueAt.toLocaleDateString()}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {hasMore ? (
        <button
          type='button'
          onClick={() => setShowAll((prev) => !prev)}
          className='mt-3 font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest transition-colors hover:text-foreground'
        >
          {showAll ? 'Show less' : `+${payments.length - MAX_VISIBLE} more — show all`}
        </button>
      ) : null}
    </section>
  )
}

function collectDuePayments(categories: BudgetCategoryWithExpenses[]): DuePayment[] {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const payments: DuePayment[] = []
  for (const category of categories) {
    for (const expense of category.expenses) {
      // Only items that are still owed (unpaid) and have a scheduled due date.
      if (expense.paidAt || !expense.dueAt) continue
      const dueAt = new Date(expense.dueAt)
      payments.push({
        id: expense.id,
        description: expense.description,
        categoryName: category.name,
        // Prefer the estimate for a not-yet-paid item; fall back to any amount.
        amount: expense.estimatedAmount > 0 ? expense.estimatedAmount : expense.amount,
        dueAt,
        overdue: dueAt < startOfToday,
      })
    }
  }

  return payments.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
}
