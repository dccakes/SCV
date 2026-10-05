'use client'

import { ChevronRight, Layers, Plus } from 'lucide-react'
import { useState } from 'react'

import { AllocationBar } from '~/components/budget/allocation-bar'
import { BudgetSummary } from '~/components/budget/budget-summary'
import { CategoryCard } from '~/components/budget/category-card'
import { CategoryForm } from '~/components/budget/category-form'
import { formatCurrency } from '~/components/budget/format'
import { UpcomingPayments } from '~/components/budget/upcoming-payments'
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const { data: overview } = api.budget.getOverview.useQuery(undefined, {
    initialData: initialOverview,
  })

  const current = overview ?? initialOverview
  const categories = current.categories
  const currency = current.currency
  const hasCategories = categories.length > 0
  // Preserve selection across refreshes; fall back when the selected section is deleted.
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? categories[0]

  return (
    <div className='mx-auto w-full max-w-[1320px]'>
      <div className='mb-6'>
        <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
          Wedding finances
        </p>
        <h1 className='mt-2 font-display text-4xl text-foreground italic md:text-5xl'>
          Your budget, beautifully clear.
        </h1>
        <p className='mt-2 text-muted-foreground text-sm'>
          Plan each section, record payments, and keep deposits in view.
        </p>
      </div>
      <BudgetSummary summary={current.summary} currency={currency} />

      {hasCategories ? (
        <>
          <AllocationBar categories={categories} currency={currency} />
          <UpcomingPayments categories={categories} currency={currency} />
          <div className='mb-3 flex items-center gap-3'>
            <h2 className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
              Budget sections · {categories.length}
            </h2>
            <div className='h-px flex-1 bg-border/70' />
          </div>
          <div className='grid min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card/65 xl:grid-cols-[minmax(245px,30%)_minmax(0,1fr)]'>
            <nav
              aria-label='Budget sections'
              className='min-w-0 border-border/70 border-b bg-background/60 xl:border-r xl:border-b-0'
            >
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowAddCategory(true)}
                className='h-14 w-full justify-start gap-2 rounded-none border-border/70 border-b px-5 text-primary hover:bg-primary/5 hover:text-primary'
              >
                <Plus className='h-4 w-4' aria-hidden='true' />
                Add section
              </Button>
              <div className='flex overflow-x-auto xl:block'>
                {categories.map((category) => {
                  const selected = category.id === selectedCategory?.id
                  return (
                    <button
                      key={category.id}
                      type='button'
                      aria-current={selected ? 'true' : undefined}
                      aria-controls='budget-category-detail'
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`relative flex w-64 shrink-0 items-center gap-3 border-border/60 border-r px-4 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset xl:w-full xl:border-r-0 xl:border-b ${selected ? 'bg-primary/[0.07] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary' : 'hover:bg-muted/50'}`}
                    >
                      <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80'>
                        <Layers className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block break-words font-medium text-foreground text-sm'>
                          {category.name}
                        </span>
                        <span className='mt-1 block font-mono text-[0.6rem] text-muted-foreground uppercase tracking-wider'>
                          {category.expenses.length}{' '}
                          {category.expenses.length === 1 ? 'expense' : 'expenses'}
                        </span>
                      </span>
                      <span className='shrink-0 font-mono text-foreground text-xs tabular-nums'>
                        {formatCurrency(category.totals.plannedAmount, currency)}
                      </span>
                      <ChevronRight
                        className='h-3 w-3 shrink-0 text-muted-foreground'
                        aria-hidden='true'
                      />
                    </button>
                  )
                })}
              </div>
            </nav>
            {selectedCategory ? (
              <CategoryCard
                key={selectedCategory.id}
                category={selectedCategory}
                currency={currency}
              />
            ) : null}
          </div>
        </>
      ) : (
        <BudgetEmptyState onAdd={() => setShowAddCategory(true)} />
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
