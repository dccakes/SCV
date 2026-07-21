'use client'

import { useState } from 'react'

import { BudgetSummary } from '~/components/budget/budget-summary'
import { CategoryCard } from '~/components/budget/category-card'
import { CategoryForm } from '~/components/budget/category-form'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import type { BudgetOverview as BudgetOverviewData } from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type BudgetOverviewProps = {
  initialOverview: BudgetOverviewData
}

function BudgetEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className='flex flex-col items-center gap-5 py-20 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-muted/50'>
        <span className='text-2xl opacity-50' aria-hidden='true'>
          ▤
        </span>
      </div>
      <div className='max-w-sm'>
        <p className='font-serif text-foreground text-xl'>Start your budget</p>
        <p className='mt-2 font-mono text-[0.65rem] text-foreground/55 leading-relaxed tracking-wider'>
          Set a target, break it into sections like venue and catering, then track every payment —
          including refundable deposits that come back after the event.
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

export default function BudgetOverview({ initialOverview }: Readonly<BudgetOverviewProps>) {
  const [showAddCategory, setShowAddCategory] = useState(false)

  const { data: overview } = api.budget.getOverview.useQuery(undefined, {
    initialData: initialOverview,
  })

  const current = overview ?? initialOverview
  const categories = current.categories
  const currency = current.currency

  return (
    <div>
      <BudgetSummary summary={current.summary} currency={currency} />

      <div className='mb-4 flex items-center justify-between'>
        <p className='font-mono text-[0.62rem] text-muted-foreground tracking-wider'>
          {categories.length} {categories.length === 1 ? 'section' : 'sections'}
        </p>
        {categories.length > 0 ? (
          <Button
            type='button'
            size='sm'
            onClick={() => setShowAddCategory(true)}
            className='font-mono text-[0.62rem] uppercase tracking-widest'
          >
            + Add Section
          </Button>
        ) : null}
      </div>

      {categories.length === 0 ? (
        <BudgetEmptyState onAdd={() => setShowAddCategory(true)} />
      ) : (
        <div className='space-y-4'>
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} currency={currency} />
          ))}
        </div>
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
