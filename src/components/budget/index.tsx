'use client'

import { useState } from 'react'

import { AllocationBar } from '~/components/budget/allocation-bar'
import { BudgetSummary } from '~/components/budget/budget-summary'
import { CategoryCard } from '~/components/budget/category-card'
import { CategoryForm } from '~/components/budget/category-form'
import { UpcomingPayments } from '~/components/budget/upcoming-payments'
import type { ExpenseView } from '~/components/budget/view'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import type { BudgetOverview as BudgetOverviewData } from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type BudgetOverviewProps = {
  initialOverview: BudgetOverviewData
}

function BudgetEmptyState({ onAdd, targetTotal }: { onAdd: () => void; targetTotal: number }) {
  const hasTarget = targetTotal > 0

  return (
    <div className='flex flex-col items-center gap-5 py-20 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-muted/50'>
        <span className='text-2xl opacity-50' aria-hidden='true'>
          ▤
        </span>
      </div>
      <div className='max-w-sm'>
        <p className='font-serif text-foreground text-xl'>
          {hasTarget ? 'Add your first section' : 'Start your budget'}
        </p>
        <p className='mt-2 font-mono text-[0.65rem] text-foreground/55 leading-relaxed tracking-wider'>
          {hasTarget
            ? 'Organize your budget into named sections like venue, catering, and florals. Each section gets its own planned amount and tracks every expense.'
            : 'Set a target, break it into sections like venue and catering, then track every payment — including refundable deposits that come back after the event.'}
        </p>
      </div>
      <Button
        type='button'
        onClick={onAdd}
        className='font-mono text-[0.65rem] uppercase tracking-widest'
      >
        Add your first section
      </Button>
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ExpenseView
  onChange: (view: ExpenseView) => void
}) {
  return (
    <div className='inline-flex rounded-md border border-border/70 p-0.5'>
      {(['list', 'table'] as const).map((option) => (
        <button
          key={option}
          type='button'
          onClick={() => onChange(option)}
          aria-pressed={view === option}
          className={`rounded px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition-colors ${
            view === option
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default function BudgetOverview({ initialOverview }: Readonly<BudgetOverviewProps>) {
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [view, setView] = useState<ExpenseView>('list')

  const { data: overview } = api.budget.getOverview.useQuery(undefined, {
    initialData: initialOverview,
  })

  const current = overview ?? initialOverview
  const categories = current.categories
  const currency = current.currency
  const targetTotal = current.targetTotal
  const hasCategories = categories.length > 0

  return (
    <div>
      <BudgetSummary summary={current.summary} currency={currency} />

      {hasCategories ? (
        <>
          <AllocationBar categories={categories} currency={currency} />
          <UpcomingPayments categories={categories} currency={currency} />
          <div className='mb-4 flex items-center justify-between gap-3'>
            <p className='font-mono text-[0.62rem] text-muted-foreground tracking-wider'>
              {categories.length} {categories.length === 1 ? 'section' : 'sections'}
            </p>
            <div className='flex items-center gap-2'>
              <ViewToggle view={view} onChange={setView} />
              <Button
                type='button'
                size='sm'
                onClick={() => setShowAddCategory(true)}
                className='font-mono text-[0.62rem] uppercase tracking-widest'
              >
                + Add Section
              </Button>
            </div>
          </div>
          <div className='space-y-4'>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} currency={currency} view={view} />
            ))}
          </div>
        </>
      ) : (
        <BudgetEmptyState onAdd={() => setShowAddCategory(true)} targetTotal={targetTotal} />
      )}

      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>Add section</DialogTitle>
          </DialogHeader>
          <CategoryForm
            mode='create'
            currency={currency}
            onSuccess={() => setShowAddCategory(false)}
            onCancel={() => setShowAddCategory(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
