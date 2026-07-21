'use client'

import { sectionColor } from '~/components/budget/colors'
import { formatCurrency } from '~/components/budget/format'
import type { BudgetCategoryWithExpenses } from '~/server/domains/budget/budget.types'

type AllocationBarProps = {
  categories: BudgetCategoryWithExpenses[]
  currency: string
}

type Segment = {
  id: string
  name: string
  value: number
  color: string
}

/**
 * Segmented "where the money goes" bar plus legend. Visualizes each section's
 * share of net spend; when nothing has been spent yet it falls back to the
 * planned allocation so couples can still see the intended split.
 */
export function AllocationBar({ categories, currency }: Readonly<AllocationBarProps>) {
  const spendSegments = toSegments(categories, (c) => c.totals.netSpend)
  const spendTotal = sum(spendSegments)

  const usePlanned = spendTotal <= 0
  const segments = usePlanned
    ? toSegments(categories, (c) => c.totals.plannedAmount)
    : spendSegments
  const total = usePlanned ? sum(segments) : spendTotal

  // Nothing to show until there's either spend or a planned split.
  if (total <= 0) return null

  return (
    <section className='mb-8 rounded-lg border border-border/70 bg-card p-4 md:p-5'>
      <div className='mb-3 flex items-center justify-between'>
        <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
          {usePlanned ? 'Planned allocation' : 'Where it’s going'}
        </p>
        <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
          {formatCurrency(total, currency)}
        </p>
      </div>

      <div className='flex h-3 w-full overflow-hidden rounded-full bg-muted'>
        {segments.map((segment) => (
          <div
            key={segment.id}
            className='h-full first:rounded-l-full last:rounded-r-full'
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.name} · ${formatCurrency(segment.value, currency)}`}
          />
        ))}
      </div>

      <ul className='mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3'>
        {segments.map((segment) => (
          <li key={segment.id} className='flex items-center gap-2 text-sm'>
            <span
              className='h-2.5 w-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: segment.color }}
              aria-hidden='true'
            />
            <span className='min-w-0 flex-1 truncate text-foreground'>{segment.name}</span>
            <span className='font-mono text-muted-foreground text-xs tabular-nums'>
              {Math.round((segment.value / total) * 100)}%
            </span>
            <span className='font-mono text-foreground text-xs tabular-nums'>
              {formatCurrency(segment.value, currency)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function toSegments(
  categories: BudgetCategoryWithExpenses[],
  metric: (category: BudgetCategoryWithExpenses) => number
): Segment[] {
  return (
    categories
      // Keep the section's original index so its color is stable regardless of
      // which sections happen to have a value in this metric.
      .map((category, index) => ({
        id: category.id,
        name: category.name,
        value: Math.max(0, metric(category)),
        color: sectionColor(index),
      }))
      .filter((segment) => segment.value > 0)
  )
}

function sum(segments: Segment[]): number {
  return segments.reduce((total, segment) => total + segment.value, 0)
}
